const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/channels — create a channel
router.post('/', requireAuth, async (req, res) => {
  const { name, slug, description, category } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO channels (owner_id, name, slug, description, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name, slug, description, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Channel slug already taken' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// GET /api/channels/:slug
router.get('/:slug', async (req, res) => {
  const result = await pool.query('SELECT * FROM channels WHERE slug = $1', [req.params.slug]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Channel not found' });
  res.json(result.rows[0]);
});

// POST /api/channels/:id/subscribe
router.post('/:id/subscribe', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO subscriptions (user_id, channel_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    await pool.query('UPDATE channels SET subscriber_count = subscriber_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ subscribed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

module.exports = router;
