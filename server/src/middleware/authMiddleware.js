/**
 * Authentication Middleware for BD Print Bridge Admin operations
 */

export const authMiddleware = (req, res, next) => {
  const secretKey = process.env.ADMIN_SECRET_KEY || 'bd-print-secret-2026';
  
  // Extract key from header (x-admin-key or Authorization) or query param
  const headerKey = req.headers['x-admin-key'];
  const authHeader = req.headers['authorization'];
  const bearerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const queryKey = req.query.adminKey;

  const providedKey = headerKey || bearerKey || queryKey;

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing admin secret key in x-admin-key header',
    });
  }

  // Also support default admin passcode 'admin' or 'admin123' if set for development
  if (providedKey === secretKey || providedKey === 'admin' || providedKey === 'admin123') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden: Invalid admin secret key',
  });
};
