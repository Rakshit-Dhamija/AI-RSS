/**
 * Rate limiting middleware
 */
const rateLimiters = new Map();

const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimiters.has(clientId)) {
      rateLimiters.set(clientId, { requests: [], windowStart: now });
    }
    
    const clientData = rateLimiters.get(clientId);
    
    // Clean old requests outside the window
    clientData.requests = clientData.requests.filter(timestamp => 
      now - timestamp < windowMs
    );
    
    if (clientData.requests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    clientData.requests.push(now);
    next();
  };
};

// Different rate limits for different endpoints
const uploadRateLimit = createRateLimiter(15 * 60 * 1000, 10); // 10 uploads per 15 minutes
const authRateLimit = createRateLimiter(15 * 60 * 1000, 5);   // 5 auth attempts per 15 minutes
const generalRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

module.exports = {
  uploadRateLimit,
  authRateLimit,
  generalRateLimit
};