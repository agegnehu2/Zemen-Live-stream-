import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/AuthContext';
import './Watch.css';

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    api.getStream(id).then(setStream).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!stream?.playback_url || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(stream.playback_url);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.playback_url;
    }
  }, [stream?.playback_url]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_stream', id);

    socket.on('chat_message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('viewer_count', setViewerCount);
    socket.on('chat_error', (e) => setError(e.error));

    return () => {
      socket.emit('leave_stream', id);
      socket.off('chat_message');
      socket.off('viewer_count');
      socket.off('chat_error');
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    getSocket().emit('chat_message', { streamId: id, message: draft.trim() });
    setDraft('');
  }

  if (error && !stream) return <div className="container watch-status">{error}</div>;
  if (!stream) return <div className="container watch-status">Loading…</div>;

  return (
    <div className="watch-layout">
      <div className="watch-main">
        <div className="watch-player">
          {stream.status === 'live' && stream.playback_url ? (
            <video ref={videoRef} controls autoPlay className="watch-video" />
          ) : (
            <div className="watch-offline">
              <span className="pulse-dot" style={{ background: 'var(--text-faint)' }} />
              This stream is offline right now
            </div>
          )}
        </div>

        <div className="watch-info">
          <div className="watch-info-top">
            {stream.status === 'live' && (
              <span className="live-badge"><span className="pulse-dot" /> Live</span>
            )}
            <span className="watch-viewers">{viewerCount} watching</span>
          </div>
          <h1 className="watch-title">{stream.title}</h1>
          <div className="watch-channel">
            <div className="live-card-avatar">{stream.channel_name?.[0]?.toUpperCase()}</div>
            <span>{stream.channel_name}</span>
          </div>
          {stream.description && <p className="watch-desc">{stream.description}</p>}
        </div>
      </div>

      <aside className="watch-chat">
        <div className="watch-chat-header">Live chat</div>
        <div className="watch-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className="chat-msg">
              <span className="chat-msg-user">{m.username}</span>
              <span className="chat-msg-text">{m.message}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {user ? (
          <form className="watch-chat-form" onSubmit={sendMessage}>
            <input
              className="input"
              placeholder="Say something…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
            />
            <button className="btn btn-primary" type="submit">Send</button>
          </form>
        ) : (
          <div className="watch-chat-login">
            <a href="/login" className="btn btn-ghost">Log in to chat</a>
          </div>
        )}
      </aside>
    </div>
  );
}
