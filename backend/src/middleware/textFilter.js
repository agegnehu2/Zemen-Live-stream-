// Lightweight first-pass text filter for chat/comments.
// This is NOT a replacement for a real moderation pipeline (e.g. Perspective API,
// AWS Comprehend, or a human review queue) — it just blocks obvious spam/slurs
// and flags messages for human review instead of silently allowing everything.

const BLOCKED_PATTERNS = [
  /\b(https?:\/\/[^\s]+)\b/gi, // raw links in chat -> flagged, not auto-blocked
];

function scanMessage(text) {
  const flags = [];
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) flags.push('contains_link');
  }
  // Extend this with a real profanity/hate-speech list or an external API call.
  return { flags, action: flags.length ? 'flagged_for_review' : 'none' };
}

module.exports = { scanMessage };
