// src/chunking/textChunker.js
// ============================================================
// Sliding window chunker
//
// Why overlap? If an answer spans a chunk boundary,
// the 50-token overlap ensures it's captured in at least one chunk.
//
// Strategy:
//   1. Split text into sentences
//   2. Group sentences into ~512 token chunks
//   3. Add 50-token overlap between consecutive chunks
// ============================================================

import { logger } from '../utils/logger.js';

// ~4 chars per token for English text
const estimateTokens = (text) => Math.ceil(text.length / 4);

const splitIntoSentences = (text) => {
  return text
    .replace(/([.!?])\s+([A-Z])/g, '$1\n$2')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 10);
};

/**
 * Chunk text using sliding window with overlap
 * @param {string} text
 * @param {number} chunkSize - target tokens per chunk
 * @param {number} overlap - overlap tokens between chunks
 * @returns {Array<{ content, chunkIndex, tokenCount }>}
 */
export const chunkText = (text, chunkSize = 512, overlap = 50) => {
  if (!text || text.trim().length === 0) return [];

  const sentences = splitIntoSentences(text);
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      const content = currentChunk.join(' ').trim();
      if (content.length > 50) {
        chunks.push({ content, chunkIndex, tokenCount: currentTokens });
        chunkIndex++;
      }

      // Build overlap: keep last N sentences for next chunk
      const overlapSentences = [];
      let overlapTokens = 0;
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const t = estimateTokens(currentChunk[i]);
        if (overlapTokens + t > overlap) break;
        overlapSentences.unshift(currentChunk[i]);
        overlapTokens += t;
      }

      currentChunk = [...overlapSentences, sentence];
      currentTokens = overlapTokens + sentenceTokens;
    } else {
      currentChunk.push(sentence);
      currentTokens += sentenceTokens;
    }
  }

  // Last chunk
  if (currentChunk.length > 0) {
    const content = currentChunk.join(' ').trim();
    if (content.length > 50) {
      chunks.push({ content, chunkIndex, tokenCount: currentTokens });
    }
  }

  logger.info('Text chunked', {
    totalChunks: chunks.length,
    avgTokens: chunks.length > 0
      ? Math.round(chunks.reduce((s, c) => s + c.tokenCount, 0) / chunks.length)
      : 0,
  });

  return chunks;
};
