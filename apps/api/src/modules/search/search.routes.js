// src/modules/search/search.routes.js
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { searchController } from './search.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', searchController);   // GET /api/search?q=your+query
router.post('/', searchController);  // POST /api/search { query, documentIds, searchType }

export default router;
