require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const pool = require('./db');
const { scanMessage } = require('./middleware/textFilter');

const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const liveStreamRoutes = require('./routes/liveStreams');
const moderationRoutes = require('./routes/moderation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/live', liveStreamRoutes);
app.use('/api/moderation', moderationRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

// ---------- Live chat + viewing via Socket.IO ----------
// Anyone can connect and WATCH a stream without an account.
// Only an authenticated user can send chat messages.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.user = null; // anonymous viewer — allowed to watch, not to chat
    return next();
  }
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new Error('invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_stream', async (streamId) => {
    socket.join(`stream:${streamId}`);
    const room = io.sockets.adapter.rooms.get(`stream:${streamId}`);
    const viewerCount = room ? room.size : 1;
    io.to(`stream:${streamId}`).emit('viewer_count', viewerCount);
    await pool.query(
      `UPDATE live_streams SET viewer_count = $1,
       peak_viewer_count = GREATEST(peak_viewer_count, $1) WHERE id = $2`,
      [viewerCount, streamId]
    );
  });

  socket.on('chat_message', async ({ streamId, message }) => {
    if (!socket.user) {
      return socket.emit('chat_error', { error: 'Login required to chat' });
    }
    if (!message || message.length > 500) return;

    const { flags, action } = scanMessage(message);

    const result = await pool.query(
      `INSERT INTO chat_messages (live_stream_id, user_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [streamId, socket.user.id, message]
    );

    io.to(`stream:${streamId}`).emit('chat_message', {
      id: result.rows[0].id,
      userId: socket.user.id,
      username: socket.user.username,
      message,
      createdAt: result.rows[0].created_at,
    });

    if (action === 'flagged_for_review') {
      console.log(`Flagged chat message ${result.rows[0].id}:`, flags);
    }
  });

  socket.on('leave_stream', (streamId) => {
    socket.leave(`stream:${streamId}`);
    const room = io.sockets.adapter.rooms.get(`stream:${streamId}`);
    io.to(`stream:${streamId}`).emit('viewer_count', room ? room.size : 0);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room.startsWith('stream:')) {
        const size = (io.sockets.adapter.rooms.get(room)?.size || 1) - 1;
        io.to(room).emit('viewer_count', Math.max(size, 0));
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
