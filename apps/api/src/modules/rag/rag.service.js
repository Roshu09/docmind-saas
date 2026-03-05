// src/modules/rag/rag.service.js
// RAG = Retrieval Augmented Generation
// 1. Find relevant chunks via semantic search
// 2. Build a prompt with those chunks as context
// 3. Stream LLM response back to client
import { search } from '../search/search.service.js';
import { logger } from '../../utils/logger.js';

const OLLAMA_CHAT_URL = 'http://localhost:11434/api/generate';

const buildPrompt = (question, chunks) => {
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.original_name}]\n${c.content}`)
    .join('\n\n---\n\n');

  return `You are a helpful AI assistant that answers questions based on the provided documents.
Answer the question using ONLY the information from the provided context.
If the answer is not in the context, say "I could not find information about this in the provided documents."
Always cite which source you used.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;
};

export const ragQuery = async (orgId, question, options = {}) => {
  const { documentIds = null, limit = 5 } = options;

  logger.info('RAG query started', { orgId, question: question.substring(0, 100) });

  // Step 1: Find relevant chunks
  const searchResult = await search(orgId, question, {
    limit,
    documentIds,
    searchType: 'hybrid',
  });

  if (searchResult.results.length === 0) {
    return {
      answer: 'No relevant documents found. Please upload documents first.',
      sources: [],
      chunks_used: 0,
    };
  }

  // Step 2: Build prompt with context
  const prompt = buildPrompt(question, searchResult.results);

  // Step 3: Call Ollama for answer (non-streaming for simplicity)
  logger.info('Calling Ollama for answer', { chunks: searchResult.results.length });

  const response = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 1024 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama chat error: ${response.statusText}`);
  }

  const data = await response.json();

  // Build sources list (deduplicated by document)
  const seenDocs = new Set();
  const sources = searchResult.results
    .filter(r => { if (seenDocs.has(r.document_id)) return false; seenDocs.add(r.document_id); return true; })
    .map(r => ({ document_id: r.document_id, original_name: r.original_name, mime_type: r.mime_type }));

  logger.info('RAG query complete', { chunks_used: searchResult.results.length });

  return {
    answer: data.response,
    sources,
    chunks_used: searchResult.results.length,
    question,
  };
};

// Streaming version — sends chunks as SSE
export const ragQueryStream = async (orgId, question, res, options = {}) => {
  const { documentIds = null, limit = 5 } = options;

  logger.info('RAG stream started', { orgId, question: question.substring(0, 100) });

  // Step 1: Find relevant chunks
  const searchResult = await search(orgId, question, { limit, documentIds, searchType: 'hybrid' });

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (searchResult.results.length === 0) {
    res.write('data: ' + JSON.stringify({ type: 'answer', text: 'No relevant documents found.' }) + '\n\n');
    res.write('data: ' + JSON.stringify({ type: 'done' }) + '\n\n');
    res.end();
    return;
  }

  // Send sources first
  const seenDocs = new Set();
  const sources = searchResult.results
    .filter(r => { if (seenDocs.has(r.document_id)) return false; seenDocs.add(r.document_id); return true; })
    .map(r => ({ document_id: r.document_id, original_name: r.original_name }));

  res.write('data: ' + JSON.stringify({ type: 'sources', sources }) + '\n\n');

  // Step 2: Stream LLM response
  const prompt = buildPrompt(question, searchResult.results);

  const ollamaResponse = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: true,
      options: { temperature: 0.1, num_predict: 1024 },
    }),
  });

  if (!ollamaResponse.ok) {
    res.write('data: ' + JSON.stringify({ type: 'error', message: 'LLM unavailable' }) + '\n\n');
    res.end();
    return;
  }

  // Stream tokens to client
  for await (const chunk of ollamaResponse.body) {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          res.write('data: ' + JSON.stringify({ type: 'token', text: parsed.response }) + '\n\n');
        }
        if (parsed.done) {
          res.write('data: ' + JSON.stringify({ type: 'done', chunks_used: searchResult.results.length }) + '\n\n');
          res.end();
          return;
        }
      } catch {}
    }
  }

  res.end();
};
