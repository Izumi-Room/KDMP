import crypto from 'crypto';

export const csrfProtection = (req, res, next) => {
  // 1. Ensure session is loaded
  if (!req.session) {
    return next(new Error('Session middleware must be loaded before CSRF middleware'));
  }

  // 2. Generate token if it doesn't exist
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // 3. Expose to templates
  res.locals.csrfToken = req.session.csrfToken;

  // 4. Bypass check for safe HTTP methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 5. Verify token for state-changing methods
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    // Check if JSON response is expected
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.status(403).json({
        success: false,
        message: 'Aktivitas tidak sah (CSRF Token tidak valid atau kedaluwarsa). Silakan muat ulang halaman.'
      });
    }

    return res.status(403).render('error', {
      message: 'Aktivitas tidak sah (CSRF Token tidak valid atau kedaluwarsa). Silakan kembali dan muat ulang halaman.',
      error: { status: 403 }
    });
  }

  next();
};

export default csrfProtection;
