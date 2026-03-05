// src/modules/search/search.controller.js
import { z } from 'zod';
import { search } from './search.service.js';
import { ValidationError } from '../../middlewares/errorHandler.js';

const searchSchema = z.object({
  query: z.string().min(2).max(500),
  limit: z.number().int().min(1).max(50).default(10).optional(),
  documentIds: z.array(z.string().uuid()).optional(),
  searchType: z.enum(['hybrid', 'semantic', 'fulltext']).default('hybrid').optional(),
});

export const searchController = async (req, res) => {
  const parsed = searchSchema.safeParse({
    query: req.query.q || req.body.query,
    limit: req.query.limit ? parseInt(req.query.limit) : (req.body.limit || 10),
    documentIds: req.body.documentIds,
    searchType: req.query.type || req.body.searchType || 'hybrid',
  });

  if (!parsed.success) throw new ValidationError('Invalid search params', parsed.error.errors);

  const result = await search(req.user.orgId, parsed.data.query, {
    limit: parsed.data.limit || 10,
    documentIds: parsed.data.documentIds,
    searchType: parsed.data.searchType || 'hybrid',
  });

  res.json({ success: true, data: result });
};
