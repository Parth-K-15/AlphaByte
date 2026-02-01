import express from 'express';
const router = express.Router();

// TODO: Implement access control routes
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Access control routes - to be implemented' });
});

export default router;
