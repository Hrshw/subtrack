import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getConnections, addConnection, removeConnection, updateConnection } from '../controllers/connectionController';

const router = express.Router();

router.use(requireAuth);

router.get('/', getConnections);
router.post('/', addConnection);
router.patch('/:id', updateConnection);
router.delete('/:id', removeConnection);

export default router;
