// src/embedding/embeddingGenerator.js
// Using Ollama (local, free) instead of OpenAI
// To switch to OpenAI later: replace embedBatch with OpenAI API call
import { logger } from '../utils/logger.js';

const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
const BATCH_SIZE = 20;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const embedBatch = async (texts, attempt = 0) => {
  try {
    const embeddings = await Promise.all(
      texts.map(async (text) => {
        const response = await fetch(OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
        });
        if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
        const data = await response.json();
        return data.embedding;
      })
    );
    return embeddings;
  } catch (error) {
    if (attempt < 3) {
      await sleep(1000 * (attempt + 1));
      return embedBatch(texts, attempt + 1);
    }
    throw error;
  }
};

export const generateEmbeddings = async (chunks) => {
  if (chunks.length === 0) return [];
  logger.info('Generating embeddings via Ollama', { totalChunks: chunks.length });
  const start = Date.now();

  const batches = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE));
  }

  const allEmbeddings = [];
  for (const batch of batches) {
    const embeddings = await embedBatch(batch.map(c => c.content));
    allEmbeddings.push(...embeddings);
  }

  const result = chunks.map((chunk, i) => ({ ...chunk, embedding: allEmbeddings[i] }));
  logger.info('Embeddings done', { count: chunks.length, durationMs: Date.now() - start });
  return result;
};