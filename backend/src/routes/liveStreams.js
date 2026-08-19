const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { requireAuth, requireModerator } = require('../middleware/auth');

const router = express.Router();

// GET /api/live — list currently live streams
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT ls.*, c.name AS channel_name, c.slug AS channel_slug
     FROM live_streams ls
     JOIN channels c ON c.id = ls.channel_id
     WHERE ls.status = 'live'
     ORDER BY ls.viewer_count DESC`
  );
  res.json(result.rows);
});

// GET /api/live/:id — public: view a single stream's details, no login required
router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT ls.*, c.name AS channel_name, c.slug AS channel_slug, c.logo_url
     FROM live_streams ls
     JOIN channels c ON c.id = ls.channel_id
     WHERE ls.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Stream not found' });
  const stream = result.rows[0];
  delete stream.stream_key;
  res.json(stream);
});

// POST /api/live — create a new stream (gets a stream key for RTMP ingest)
router.post('/', requireAuth, async (req, res) => {
  const { channel_id, title, description, category_id } = req.body;
  const streamKey = uuidv4();
  try {
    const result = await pool.query(
      `INSERT INTO live_streams (channel_id, title, description, category_id, stream_key)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [channel_id, title, description, category_id, streamKey]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create live stream' });
  }
});

// POST /api/live/:id/go-live — called by your ingest server once RTMP connects
router.post('/:id/go-live', requireAuth, async (req, res) => {
  const { playback_url } = req.body;
  const result = await pool.query(
    `UPDATE live_streams SET status = 'live', started_at = NOW(), playback_url = $1
     WHERE id = $2 RETURNING *`,
    [playback_url, req.params.id]
  );
  res.json(result.rows[0]);
});

// POST /api/live/:id/end
router.post('/:id/end', requireAuth, async (req, res) => {
  const result = await pool.query(
    `UPDATE live_streams SET status = 'ended', ended_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json(result.rows[0]);
});

// POST /api/live/:id/takedown — moderator emergency stop
router.post('/:id/takedown', requireAuth, requireModerator, async (req, res) => {
  const { reason } = req.body;
  await pool.query(`UPDATE live_streams SET status = 'ended', ended_at = NOW() WHERE id = $1`, [req.params.id]);
  await pool.query(
    `INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, status, reviewed_by, reviewed_at)
     VALUES ($1, 'live_stream', $2, $3, 'action_taken', $1, NOW())`,
    [req.user.id, req.params.id, reason || 'policy_violation']
  );
  res.json({ takenDown: true });
});

module.exports = router;
