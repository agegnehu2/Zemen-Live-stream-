import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import LiveCard from '../components/LiveCard';
import './Home.css';

export default function Home() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getLiveStreams()
      .then(setStreams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-signal">
            <span className="hero-ring r1" />
            <span className="hero-ring r2" />
            <span className="hero-ring r3" />
            <span className="hero-dot" />
          </div>
          <h1 className="hero-title">
            One signal.<br />Every screen on earth.
          </h1>
          <p className="hero-sub">
            Zemen carries live broadcasts from Ethiopia and beyond — watch instantly,
            no account required.
          </p>
        </div>
      </section>

      <section className="container feed">
        <div className="feed-header">
          <h2>Live now</h2>
          {!loading && <span className="feed-count">{streams.length} broadcasting</span>}
        </div>

        {loading && <p className="feed-status">Loading streams…</p>}
        {error && <p className="feed-status feed-error">{error}</p>}
        {!loading && !error && streams.length === 0 && (
          <p className="feed-status">Nothing live right now. Check back soon.</p>
        )}

        <div className="feed-grid">
          {streams.map((s) => <LiveCard key={s.id} stream={s} />)}
        </div>
      </section>
    </>
  );
            }
