// src/modules/rag/rag.service.js - Powered by Groq
import { search } from '../search/search.service.js';
import { logger } from '../../utils/logger.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_KEY = process.env.GROQ_API_KEY;

const groqChat = async (messages, maxTokens = 1024) => {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
};

// ── RAG Query (existing, now powered by Groq) ────────────────
export const ragQuery = async (orgId, question, options = {}) => {
  const { documentIds = null, limit = 5 } = options;
  logger.info('RAG query started', { question: question.substring(0, 100) });

  const searchResult = await search(orgId, question, { limit, documentIds, searchType: 'hybrid' });

  if (searchResult.results.length === 0) {
    return { answer: 'No relevant documents found. Please upload documents first.', sources: [], chunks_used: 0 };
  }

  const context = searchResult.results
    .map((c, i) => `[Source ${i + 1}: ${c.original_name}]\n${c.content}`)
    .join('\n\n---\n\n');

  const answer = await groqChat([
    { role: 'system', content: 'You are a helpful AI assistant. Answer questions using ONLY the provided context. Cite sources. If answer not in context, say so.' },
    { role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` },
  ]);

  const sources = [...new Map(searchResult.results.map(r => [r.document_id, { document_id: r.document_id, original_name: r.original_name }])).values()];

  return { answer, sources, chunks_used: searchResult.results.length };
};

// ── Smart Summarizer ─────────────────────────────────────────
export const summarizeDocument = async (orgId, documentId) => {
  logger.info('Summarizing document', { documentId });

  const searchResult = await search(orgId, 'main topics key points summary', {
    limit: 15, documentIds: [documentId], searchType: 'semantic',
  });

  if (searchResult.results.length === 0) throw new Error('No content found for this document');

  const content = searchResult.results.map(c => c.content).join('\n\n');

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

  try {
    return JSON.parse(summary);
  } catch {
    return { tldr: summary, key_points: [], action_items: [], topics: [], sentiment: 'neutral', difficulty: 'intermediate' };
  }
};

// ── Auto Q&A Generator ───────────────────────────────────────
export const generateQA = async (orgId, documentId, count = 5) => {
  logger.info('Generating Q&A', { documentId, count });

  const searchResult = await search(orgId, 'important concepts definitions examples', {
    limit: 15, documentIds: [documentId], searchType: 'semantic',
  });

  if (searchResult.results.length === 0) throw new Error('No content found');

  const content = searchResult.results.map(c => c.content).join('\n\n');

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

  try {
    return JSON.parse(result);
  } catch {
    return { questions: [] };
  }
};

// ── Multi-doc Chat ───────────────────────────────────────────
export const multiDocQuery = async (orgId, question, documentIds = [], options = {}) => {
  const { limit = 10 } = options;
  logger.info('Multi-doc RAG query', { documentCount: documentIds.length, question: question.substring(0, 100) });

  const searchResult = await search(orgId, question, {
    limit, documentIds: documentIds.length > 0 ? documentIds : null, searchType: 'hybrid',
  });

  if (searchResult.results.length === 0) {
    return { answer: 'No relevant content found in the selected documents.', sources: [], chunks_used: 0 };
  }

  const context = searchResult.results
    .map((c, i) => `[Doc ${i + 1}: ${c.original_name}]\n${c.content}`)
    .join('\n\n---\n\n');

  const docNames = [...new Set(searchResult.results.map(r => r.original_name))];

  const answer = await groqChat([
    { role: 'system', content: `You are analyzing ${docNames.length} documents: ${docNames.join(', ')}. Answer using information from ALL relevant documents. Compare and contrast when appropriate. Always cite which document contains the information.` },
    { role: 'user', content: `CONTEXT FROM MULTIPLE DOCUMENTS:\n${context}\n\nQUESTION: ${question}` },
  ], 1500);

  const sources = [...new Map(searchResult.results.map(r => [r.document_id, { document_id: r.document_id, original_name: r.original_name }])).values()];

  return { answer, sources, chunks_used: searchResult.results.length, documents_searched: docNames.length };
};
