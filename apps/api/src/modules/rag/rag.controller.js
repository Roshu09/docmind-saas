// src/modules/rag/rag.controller.js
import { z } from 'zod';
import { ragQuery, ragQueryStream } from './rag.service.js';
import { ValidationError } from '../../middlewares/errorHandler.js';

const ragSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(1000),
  documentIds: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(10).default(5).optional(),
  stream: z.boolean().default(false).optional(),
});

export const ragController = async (req, res) => {
  const parsed = ragSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid RAG request', parsed.error.errors);

  const { question, documentIds, limit, stream } = parsed.data;

  if (stream) {
    await ragQueryStream(req.user.orgId, question, res, { documentIds, limit: limit || 5 });
  } else {
    const result = await ragQuery(req.user.orgId, question, { documentIds, limit: limit || 5 });
    res.json({ success: true, data: result });
  }
};
