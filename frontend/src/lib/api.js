const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('zemen_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getLiveStreams: () => request('/live'),
  getStream: (id) => request(`/live/${id}`),
  createStream: (body) => request('/live', { method: 'POST', body: JSON.stringify(body) }),
  createChannel: (body) => request('/channels', { method: 'POST', body: JSON.stringify(body) }),
  getChannel: (slug) => request(`/channels/${slug}`),
  subscribe: (channelId) => request(`/channels/${channelId}/subscribe`, { method: 'POST' }),
  report: (body) => request('/moderation/report', { method: 'POST', body: JSON.stringify(body) }),
};

export { getToken };
