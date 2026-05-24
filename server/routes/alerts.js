import express from 'express';
import store from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  let alerts = [...store.alerts];
  
  if (req.query.severity) alerts = alerts.filter(a => a.severity === req.query.severity);
  if (req.query.service) alerts = alerts.filter(a => a.service === req.query.service);
  if (req.query.status === 'active') alerts = alerts.filter(a => !a.resolved);
  if (req.query.status === 'resolved') alerts = alerts.filter(a => a.resolved);
  
  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  
  // Calculate counts from full alerts array, not filtered
  const total = store.alerts.length;
  const active = store.alerts.filter(a => !a.resolved).length;
  const resolved = store.alerts.filter(a => a.resolved).length;
  
  res.json({
    alerts: alerts.slice(start, start + limit),
    total,
    active,
    resolved,
    page,
    limit,
    totalPages: Math.ceil(alerts.length / limit),
  });
});

router.get('/:id', (req, res) => {
  const alert = store.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
});

router.post('/:id/acknowledge', (req, res) => {
  const alert = store.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.acknowledged = true;
  alert.updatedAt = new Date().toISOString();
  res.json({ success: true, alert });
});

router.post('/:id/resolve', (req, res) => {
  const alert = store.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.resolved = true;
  alert.updatedAt = new Date().toISOString();
  store.metrics.activeAlerts = store.alerts.filter(a => !a.resolved).length;
  res.json({ success: true, alert });
});

router.delete('/:id', (req, res) => {
  const index = store.alerts.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Alert not found' });
  store.alerts.splice(index, 1);
  store.metrics.activeAlerts = store.alerts.filter(a => !a.resolved).length;
  res.json({ success: true });
});

export default router;
