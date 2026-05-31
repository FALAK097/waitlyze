// In-memory sliding window rate limiter
const rateLimitMap = new Map();

// Cleanup older entries every 10 minutes to prevent memory leak
const intervalId = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    // Keep only timestamps from the last 1 hour (3600000 ms)
    const validTimestamps = timestamps.filter(t => now - t < 3600000);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, validTimestamps);
    }
  }
}, 10 * 60 * 1000);

if (intervalId && typeof intervalId.unref === "function") {
  intervalId.unref();
}

/**
 * Checks if a user has exceeded the rate limit.
 * @param {string} userId - Unique identifier for the user.
 * @param {number} limit - Maximum allowed actions in the window.
 * @param {number} windowMs - Time window in milliseconds (default 1 hour).
 * @returns {boolean} - True if allowed, false if rate limited.
 */
export function checkRateLimit(userId, limit = 10, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, [now]);
    return true;
  }

  const timestamps = rateLimitMap.get(userId);
  // Filter out timestamps outside the window
  const validTimestamps = timestamps.filter(t => now - t < windowMs);
  
  if (validTimestamps.length >= limit) {
    // Update map with trimmed timestamps
    rateLimitMap.set(userId, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);
  return true;
}
