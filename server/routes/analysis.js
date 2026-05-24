import express from 'express';
import store from '../data/store.js';
import aiAnalyzer from '../services/aiAnalyzer.js';

const router = express.Router();

router.get('/', (req, res) => {
  let analyses = [...store.analyses];
  
  if (req.query.service) analyses = analyses.filter(a => a.service === req.query.service);
  if (req.query.alertId) analyses = analyses.filter(a => a.alertId === req.query.alertId);
  
  analyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  
  res.json({
    analyses: analyses.slice(start, start + limit),
    total: analyses.length,
    page,
    limit,
  });
});

router.get('/:alertId', (req, res) => {
  const analysis = store.analyses.find(a => a.alertId === req.params.alertId);
  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
  res.json(analysis);
});

router.post('/:alertId', async (req, res) => {
  try {
    const analysis = await aiAnalyzer.analyze(req.params.alertId);
    if (!analysis) return res.status(404).json({ error: 'Alert not found or analysis failed' });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:alertId/debug', async (req, res) => {
  try {
    const debugSteps = await aiAnalyzer.generateDebugSteps(req.params.alertId);
    if (!debugSteps) return res.status(404).json({ error: 'Analysis not found' });
    res.json(debugSteps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
