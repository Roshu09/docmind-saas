// src/modules/search/search.service.js
// Hybrid Search: Semantic (pgvector) + Full-text (tsvector) + RRF fusion
import { querySystem } from '../../db/queries/rls.js';
import { cacheGet, cacheSet } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';

const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
const CACHE_TTL = 300;

const getQueryEmbedding = async (query) => {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: query }),
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  const data = await response.json();
  return data.embedding;
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
     JOIN documents d ON d.id = dc.document_id
     WHERE dc.org_id = $1 AND d.deleted_at IS NULL AND d.status = 'ready' ${docFilter}
     ORDER BY dc.embedding <=> $2::vector LIMIT $3`,
    params
  );
  return result.rows;
};

const fullTextSearch = async (orgId, query, limit, documentIds = null) => {
  const params = [orgId, query, limit];
  let docFilter = '';
  if (documentIds?.length) { docFilter = 'AND dc.document_id = ANY($4)'; params.push(documentIds); }

  const result = await querySystem(
    `SELECT dc.id, dc.document_id, dc.content, dc.chunk_index,
            d.original_name, d.mime_type,
            ts_rank(dc.content_tsv, plainto_tsquery('english', $2)) as text_score
     FROM document_chunks dc
     JOIN documents d ON d.id = dc.document_id
     WHERE dc.org_id = $1 AND d.deleted_at IS NULL AND d.status = 'ready'
       AND dc.content_tsv @@ plainto_tsquery('english', $2) ${docFilter}
     ORDER BY text_score DESC LIMIT $3`,
    params
  );
  return result.rows;
};

const reciprocalRankFusion = (semanticResults, textResults, k = 60) => {
  const scores = new Map();
  const items = new Map();

  semanticResults.forEach((item, i) => {
    scores.set(item.id, (scores.get(item.id) || 0) + 1 / (k + i + 1));
    items.set(item.id, { ...item, searchType: 'semantic' });
  });

  textResults.forEach((item, i) => {
    scores.set(item.id, (scores.get(item.id) || 0) + 1 / (k + i + 1));
    if (!items.has(item.id)) items.set(item.id, { ...item, searchType: 'fulltext' });
    else items.set(item.id, { ...items.get(item.id), searchType: 'hybrid' });
  });

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, rrfScore]) => ({ ...items.get(id), rrfScore: Math.round(rrfScore * 1000) / 1000 }));
};

export const search = async (orgId, query, options = {}) => {
  const { limit = 10, documentIds = null, searchType = 'hybrid' } = options;
  if (!query || query.trim().length < 2) return { results: [], query, total: 0 };

  const cacheKey = `search:${orgId}:${searchType}:${Buffer.from(query).toString('base64')}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  logger.info('Executing search', { orgId, query: query.substring(0, 50), searchType });
  const start = Date.now();
  let results = [];

  if (searchType === 'semantic' || searchType === 'hybrid') {
    const embedding = await getQueryEmbedding(query);
    const semanticResults = await semanticSearch(orgId, embedding, limit * 2, documentIds);
    if (searchType === 'semantic') {
      results = semanticResults.map(r => ({ ...r, searchType: 'semantic' }));
    } else {
      const textResults = await fullTextSearch(orgId, query, limit * 2, documentIds);
      results = reciprocalRankFusion(semanticResults, textResults);
    }
  } else {
    results = await fullTextSearch(orgId, query, limit, documentIds);
  }

  results = results.slice(0, limit);
  const response = { results, query, total: results.length, searchType, durationMs: Date.now() - start };
  await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);
  logger.info('Search complete', { results: results.length, durationMs: response.durationMs });
  return response;
};