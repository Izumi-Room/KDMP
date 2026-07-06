import express from 'express';
import session from 'express-session';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectSessionSequelize from 'connect-session-sequelize';

// Load environment variables
dotenv.config();

import sequelize from './config/database.js';
import { csrfProtection } from './app/middlewares/csrfMiddleware.js';

// Imports routers
import authRouter from './app/routes/authRoutes.js';
import adminSystemRouter from './app/routes/adminSystemRoutes.js';
import adminUmkmRouter from './app/routes/adminUmkmRoutes.js';
import kasirRouter from './app/routes/kasirRoutes.js';
import pembelianRouter from './app/routes/pembelianRoutes.js';

// Middlewares
import { authMiddleware } from './app/middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8888;

// Security Headers with Helmet (configured to allow CDNs and inline scripts)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com"],
      connectSrc: ["'self'"]
    }
  }
}));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: 'Terlalu banyak permintaan dari IP Anda, silakan coba lagi nanti.'
});
app.use(globalLimiter);

// Set EJS template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser & Method override
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride((req) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
// Serving uploaded items if any
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Session Store with Sequelize
const SequelizeStore = connectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions'
});

// Initialize session store table if it doesn't exist
sessionStore.sync();

app.use(session({
  secret: process.env.SESSION_SECRET || 'aiwarungsecretkey123!@#',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Load CSRF Protection Middleware
app.use(csrfProtection);

// Inject session-based alert alerts, validation errors, and old inputs into views
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;

  res.locals.errors = req.session.errors || {};
  delete req.session.errors;

  res.locals.old = req.session.old || {};
  delete req.session.old;

  next();
});

// Load Auth Middleware
app.use(authMiddleware);

// Root Route Redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin_system') return res.redirect('/admin-system/dashboard');
    if (role === 'admin_umkm') return res.redirect('/admin-umkm/dashboard');
    if (role === 'pegawai_penjualan') return res.redirect('/kasir/dashboard');
    if (role === 'pegawai_pembelian') return res.redirect('/pembelian/dashboard');
  }
  res.redirect('/login');
});

// Map routes
app.use('/', authRouter);
app.use('/admin-system', adminSystemRouter);
app.use('/admin-umkm', adminUmkmRouter);
app.use('/kasir', kasirRouter);
app.use('/pembelian', pembelianRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Halaman Tidak Ditemukan.',
    error: { status: 404 }
  });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: 'Terjadi Kesalahan Internal Server.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start Server
app.listen(port, () => {
  console.log(`AIWarung is running at http://localhost:${port}`);
});
