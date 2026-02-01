import express from 'express';
const router = express.Router();

// TODO: Implement team routes
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Team routes - to be implemented' });
});

export default router;
