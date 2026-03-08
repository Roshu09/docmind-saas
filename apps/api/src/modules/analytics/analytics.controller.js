import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export const getAnalytics = async (req, res) => {
  const orgId = req.user.orgId;
  try {
    const [docs, storage, queries, featureBreakdown, dailyQueries, topDocs] = await Promise.all([
      // Total docs + storage
      query('SELECT COUNT(*) as total, COALESCE(SUM(file_size_bytes),0) as storage FROM documents WHERE org_id=$1 AND deleted_at IS NULL', [orgId]),
      // Total users
      query('SELECT COUNT(*) as total FROM org_members WHERE org_id=$1', [orgId]),
      // Total AI queries
      query('SELECT COUNT(*) as total FROM ai_query_logs WHERE org_id=$1', [orgId]),
      // Feature breakdown
      query('SELECT feature, COUNT(*) as count FROM ai_query_logs WHERE org_id=$1 GROUP BY feature ORDER BY count DESC', [orgId]),
      // Daily queries last 7 days
      query(`SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM ai_query_logs WHERE org_id=$1 
             AND created_at > NOW() - INTERVAL '7 days'
             GROUP BY DATE(created_at) ORDER BY date ASC`, [orgId]),
      // Top queried documents
      query(`SELECT d.original_name, COUNT(q.id) as query_count
             FROM ai_query_logs q
             JOIN documents d ON q.document_id = d.id
             WHERE q.org_id=$1 AND q.document_id IS NOT NULL
             GROUP BY d.original_name ORDER BY query_count DESC LIMIT 5`, [orgId]),
    ]);

    res.json({ success: true, data: {
      total_docs: parseInt(docs.rows[0].total),
      total_storage: parseInt(docs.rows[0].storage),
      total_users: parseInt(storage.rows[0].total),
      total_queries: parseInt(queries.rows[0].total),
      feature_breakdown: featureBreakdown.rows,
      daily_queries: dailyQueries.rows,
      top_documents: topDocs.rows,
    }});
  } catch (err) {
    logger.error('Analytics error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};