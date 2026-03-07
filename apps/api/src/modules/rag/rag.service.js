import { query } from '../../config/database.js';
import { search } from '../search/search.service.js';
import logger from '../../utils/logger.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groqChat = async (messages, maxTokens = 1024) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Groq API error');
  return data.choices[0].message.content;
};

// Directly fetch chunks for a specific document — bypasses search entirely
const getDocumentChunks = async (documentId, orgId) => {
  const result = await query(
    `SELECT dc.content, dc.chunk_index
     FROM document_chunks dc
     JOIN documents d ON dc.document_id = d.id
     WHERE dc.document_id = $1 AND dc.org_id = $2 AND d.deleted_at IS NULL
     ORDER BY dc.chunk_index ASC
     LIMIT 20`,
    [documentId, orgId]
  );
  return result.rows;
};

// ── RAG Query ────────────────────────────────────────────────
export const ragQuery = async (orgId, question, options = {}) => {
  const { documentIds = null, limit = 5 } = options;
  const searchResult = await search(orgId, question, { limit, documentIds, searchType: 'hybrid' });
  if (!searchResult.results.length) {
    return { answer: 'No relevant documents found. Please upload documents first.', sources: [], chunks_used: 0 };
  }
  const context = searchResult.results.map((r, i) => `[${i+1}] ${r.content}`).join('\n\n');
  const answer = await groqChat([
    { role: 'system', content: 'You are a helpful AI assistant. Answer based only on the provided context. Be concise and accurate.' },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
  ]);
  const sources = [...new Map(searchResult.results.map(r => [r.document_id, { document_id: r.document_id, original_name: r.original_name }])).values()];
  return { answer, sources, chunks_used: searchResult.results.length };
};

// ── Summarize Document ───────────────────────────────────────
export const summarizeDocument = async (orgId, documentId) => {
  logger.info('Summarizing document', { documentId });

  const chunks = await getDocumentChunks(documentId, orgId);
  if (!chunks.length) throw new Error('No content found for this document');

  const content = chunks.map(c => c.content).join('\n\n');
  const summary = await groqChat([
    { role: 'system', content: `You are an expert document analyst. Analyze the document and respond in this EXACT JSON format:
{
  "tldr": "2-3 sentence summary",
  "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "action_items": ["action 1", "action 2", "action 3"],
  "topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive|neutral|negative",
  "difficulty": "beginner|intermediate|advanced"
}
Return ONLY valid JSON, no markdown.` },
    { role: 'user', content: `Analyze this document:\n\n${content}` },
  ], 1024);

  try { return JSON.parse(summary); }
  catch { return { tldr: summary, key_points: [], action_items: [], topics: [], sentiment: 'neutral', difficulty: 'intermediate' }; }
};

// ── Auto Q&A Generator ───────────────────────────────────────
export const generateQA = async (orgId, documentId, count = 5) => {
  logger.info('Generating Q&A', { documentId, count });

  const chunks = await getDocumentChunks(documentId, orgId);
  if (!chunks.length) throw new Error('No content found for this document');

  const content = chunks.map(c => c.content).join('\n\n');
  const result = await groqChat([
    { role: 'system', content: `You are an expert educator. Generate exactly ${count} question-answer pairs from the document. Respond in this EXACT JSON format:
{
  "questions": [
    { "question": "...", "answer": "...", "difficulty": "easy|medium|hard", "type": "factual|conceptual|analytical" }
  ]
}
Return ONLY valid JSON, no markdown.` },
    { role: 'user', content: `Generate ${count} Q&A pairs from:\n\n${content}` },
  ], 2048);

  try { return JSON.parse(result); }
  catch { return { questions: [] }; }
};

// ── Multi-doc Chat ───────────────────────────────────────────
export const multiDocQuery = async (orgId, question, documentIds = [], options = {}) => {
  const { limit = 10 } = options;
  logger.info('Multi-doc RAG query', { documentCount: documentIds.length, question: question.substring(0, 100) });
  const searchResult = await search(orgId, question, {
    limit, documentIds: documentIds.length > 0 ? documentIds : null, searchType: 'hybrid',
  });
  if (!searchResult.results.length) {
    return { answer: 'No relevant content found in the selected documents.', sources: [], chunks_used: 0 };
  }
  const context = searchResult.results.map((r, i) => `[${i+1}] (${r.original_name}): ${r.content}`).join('\n\n');
  const docNames = [...new Set(searchResult.results.map(r => r.original_name))];
  const answer = await groqChat([
    { role: 'system', content: `You are a helpful AI assistant analyzing ${docNames.length} document(s): ${docNames.join(', ')}.

STRICT RULES:
- Structure your answer with each document as a separate section
- Format each section like: '## 📄 [Document Name]' then list its points
- Within each section use: 1.1, 1.2... sub-numbering for sub-points
- Answer ONLY using content from the provided documents
- Use numbered lists and bullet points (•) for clarity
- Use **bold** for important terms and headings
- Clearly separate findings from different documents
- Add relevant emojis (📄 for docs, ✅ for key points, 💡 for insights, ⚠️ for warnings)
- If a document has no relevant info, do NOT mention it
- Be concise, clear and well-structured` },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
  ]);
  const sources = [...new Map(searchResult.results.map(r => [r.document_id, { document_id: r.document_id, original_name: r.original_name }])).values()];
  return { answer, sources, chunks_used: searchResult.results.length, documents_searched: docNames.length };
};
