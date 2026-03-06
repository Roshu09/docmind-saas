import { querySystem } from '../../db/queries/rls.js';
import { cacheGet, cacheSet } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';

const CACHE_TTL = 300;

const getQueryEmbedding = (query) => {
  const vector = new Array(768).fill(0);
  const words = query.toLowerCase().split(/\s+/);
  words.forEach((word, wordIdx) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      vector[(charCode * 31 + wordIdx * 17 + i * 7) % 768] += 0.1;
      vector[(charCode * 13 + wordIdx * 23 + i * 11) % 768] += 0.05;
      vector[(charCode * 7 + wordIdx * 37 + i * 3) % 768] += 0.07;
    }
  });
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
};

const semanticSearch = async (orgId, queryEmbedding, limit, documentIds = null) => {
  const params = [orgId, JSON.stringify(queryEmbedding), limit];
  let docFilter = '';
  if (documentIds?.length) { docFilter = 'AND dc.document_id = ANY($4)'; params.push(documentIds); }
  const result = await querySystem(
    `SELECT dc.id, dc.document_id, dc.content, dc.chunk_index,
            d.original_name, d.mime_type,
            1 - (dc.embedding <=> $2::vector) as similarity_score
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE dc.org_id = $1 AND d.deleted_at IS NULL ${docFilter}
     ORDER BY dc.embedding <=> $2::vector
     LIMIT $3`,
    params
  );
  return result.rows;
};

const fulltextSearch = async (orgId, query, limit, documentIds = null) => {
  const params = [orgId, query, limit];
  let docFilter = '';
  if (documentIds?.length) { docFilter = 'AND dc.document_id = ANY($4)'; params.push(documentIds); }
  const result = await querySystem(
    `SELECT dc.id, dc.document_id, dc.content, dc.chunk_index,
            d.original_name, d.mime_type,
            ts_rank(dc.content_tsv, plainto_tsquery('english', $2)) as rank_score
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE dc.org_id = $1 AND d.deleted_at IS NULL
       AND dc.content_tsv @@ plainto_tsquery('english', $2) ${docFilter}
     ORDER BY rank_score DESC
     LIMIT $3`,
    params
  );
  return result.rows;
};

const rrfFusion = (semanticResults, fulltextResults, limit) => {
  const K = 60;
  const scores = new Map();
  const docs = new Map();
  semanticResults.forEach((r, i) => {
    const key = r.id;
    scores.set(key, (scores.get(key) || 0) + 1 / (K + i + 1));
    docs.set(key, { ...r, searchType: 'semantic' });
  });
  fulltextResults.forEach((r, i) => {
    const key = r.id;
    scores.set(key, (scores.get(key) || 0) + 1 / (K + i + 1));
    if (!docs.has(key)) docs.set(key, { ...r, searchType: 'fulltext' });
    else docs.get(key).searchType = 'hybrid';
  });
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => ({ ...docs.get(id), rrfScore: Math.round(score * 10000) }));
};

export const search = async (orgId, query, options = {}) => {
  const { limit = 10, documentIds = null, searchType = 'hybrid' } = options;
  if (!query?.trim()) throw new Error('Query is required');

  const cacheKey = `search:${orgId}:${query}:${searchType}:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  logger.info('Executing search', { orgId, query, searchType });

  const queryEmbedding = getQueryEmbedding(query);
  let results = [];

  if (searchType === 'semantic' || searchType === 'hybrid') {
    const semantic = await semanticSearch(orgId, queryEmbedding, limit, documentIds);
    if (searchType === 'semantic') results = semantic.map(r => ({ ...r, searchType: 'semantic' }));
    else {
      const fulltext = await fulltextSearch(orgId, query, limit, documentIds);
      results = rrfFusion(semantic, fulltext, limit);
    }
  } else {
    const fulltext = await fulltextSearch(orgId, query, limit, documentIds);
    results = fulltext.map(r => ({ ...r, searchType: 'fulltext' }));
  }

  const response = { query, results, total: results.length, searchType, durationMs: 0 };
  await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);
  return response;
};
