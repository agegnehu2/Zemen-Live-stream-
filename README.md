![Zemen Logo](./Zemen%20Live%20Stream.png)
# Zemen — Full-Stack Live Streaming Platform

Full-scale live streaming + VOD platform: Express + PostgreSQL + Socket.IO backend, React + Vite frontend.

## What's included
- `backend/migrations/001_schema.sql` — full DB schema (users, channels, videos, live_streams, chat, subscriptions, moderation_reports, content_flags)
- `backend/src/index.js` — Express server + Socket.IO live chat (viewers can watch anonymously; chatting requires login)
- `backend/src/routes/` — auth, channels, live streams, moderation endpoints
- `backend/src/middleware/` — JWT auth, role checks, basic chat text filter
- `frontend/` — React + Vite app: live feed home page, HLS watch page with live chat, login/register
- Design: dark "signal-black" palette with an ember-orange broadcast accent; a pulsing signal-ring motif represents live transmission

## Backend setup
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
psql $DATABASE_URL -f migrations/001_schema.sql
npm run dev             # runs on http://localhost:4000
```

## Frontend setup
```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL / VITE_SOCKET_URL at your backend
npm run dev              # runs on http://localhost:5173
```

**Note on testing**: I built this in a sandboxed environment with no network access, so I could not run `npm install`/`npm run build` myself to confirm it compiles. The code follows standard Vite + React 18 + react-router-dom v6 patterns — run the commands above locally and let me know if you hit any errors and I'll fix them.

## Important: this schema requires 18+ signup and has moderation built in
- `users.date_of_birth` is required at registration; under-18 signups are rejected server-side.
- Every report goes into `moderation_reports` for **human review** — nothing is auto-deleted without a moderator action.
- `content_flags` table is where you'd wire in an automated scanner (AWS Rekognition, Google Video Intelligence, etc.) for nudity/violence detection on uploads and live streams.
- I built it this way deliberately — a public live-streaming platform without moderation gets your app store listing pulled and can create real legal exposure for you. I'm not able to help remove these safeguards or build a version that allows sexual content, live or otherwise.

## Still needed (real infrastructure, not code I can run here)
1. **Ingest/transcoding**: pick one —
   - Managed (fastest to launch): Mux, Cloudflare Stream, or AWS IVS — handles RTMP ingest, transcoding, HLS delivery, and often has built-in moderation hooks.
   - Self-hosted: nginx-rtmp or SRS + FFmpeg workers, fronted by a CDN.
2. **CDN** for video delivery (CloudFront, Cloudflare).
3. **Object storage** for VOD (S3-compatible) referenced by `videos.playback_url`.
4. **Automated content moderation API** wired into `content_flags`.

## Next phases
- Phase 2: React frontend (channel pages, video feed, live player)
- Phase 3: RTMP/WebRTC ingest wiring + HLS.js player
- Phase 4: Moderator dashboard UI for the `moderation_reports` queue

Tell me which phase to build next.
## About the Developer

Built by **Agegnehu Shibiru** — a self-taught developer from Ethiopia, building full-stack 
applications entirely from a mobile phone using AI-assisted development tools.

- 🐙 GitHub: [github.com/agegnehu2](https://github.com/agegnehu2)
- 📱 WhatsApp: +251 910 195 166
- 📧 Email: agegnehushibiru5@gmail.com or agegnehushibiru7@gmail.com

Open to collaboration, learning opportunities, and connecting with developers internationally.
