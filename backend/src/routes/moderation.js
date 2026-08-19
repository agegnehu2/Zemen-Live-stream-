const express = require('express');
const pool = require('../db');
const { requireAuth, requireModerator } = require('../middleware/auth');

const router = express.Router();

// POST /api/moderation/report — any user can report content
router.post('/report', requireAuth, async (req, res) => {
  const { target_type, target_id, reason, details } = req.body;
  const result = await pool.query(
    `INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, details)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, target_type, target_id, reason, details]
  );
  res.status(201).json(result.rows[0]);
});

// GET /api/moderation/queue — moderators review pending reports
router.get('/queue', requireAuth, requireModerator, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM moderation_reports WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100`
  );
  res.json(result.rows);
});

// POST /api/moderation/queue/:id/resolve
router.post('/queue/:id/resolve', requireAuth, requireModerator, async (req, res) => {
  const { status } = req.body; // action_taken | dismissed
  const result = await pool.query(
    `UPDATE moderation_reports SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, req.user.id, req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
