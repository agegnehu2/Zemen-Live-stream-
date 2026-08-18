import { Link } from 'react-router-dom';
import './LiveCard.css';

export default function LiveCard({ stream }) {
  return (
    <Link to={`/watch/${stream.id}`} className="live-card">
      <div className="live-card-thumb">
        {stream.thumbnail_url ? (
          <img src={stream.thumbnail_url} alt={stream.title} />
        ) : (
          <div className="live-card-thumb-placeholder" />
        )}
        <span className="live-badge live-card-badge">
          <span className="pulse-dot" /> Live
        </span>
        <span className="live-card-viewers">{stream.viewer_count ?? 0} watching</span>
      </div>
      <div className="live-card-meta">
        <div className="live-card-avatar">{stream.channel_name?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <p className="live-card-title">{stream.title}</p>
          <p className="live-card-channel">{stream.channel_name}</p>
        </div>
      </div>
    </Link>
  );
}

