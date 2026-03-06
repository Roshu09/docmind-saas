// embeddingGenerator.js - Using Groq for text + simple TF-IDF embeddings
import { logger } from '../utils/logger.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Simple deterministic embedding using character/word hashing (768 dims)
// This enables full-text search while we use Groq for semantic understanding
const generateSimpleEmbedding = (text) => {
  const vector = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word, wordIdx) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const idx1 = (charCode * 31 + wordIdx * 17 + i * 7) % 768;
      const idx2 = (charCode * 13 + wordIdx * 23 + i * 11) % 768;
      const idx3 = (charCode * 7 + wordIdx * 37 + i * 3) % 768;
      vector[idx1] += 0.1;
      vector[idx2] += 0.05;
      vector[idx3] += 0.07;
    }
  });
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
};

export const generateEmbeddings = async (chunks) => {
  if (chunks.length === 0) return [];
  logger.info('Generating embeddings', { totalChunks: chunks.length });
  const start = Date.now();

  const result = chunks.map(chunk => ({
    ...chunk,
    embedding: generateSimpleEmbedding(chunk.content),
  }));

  logger.info('Embeddings done', { count: chunks.length, durationMs: Date.now() - start });
  return result;
};
