import { User, Role } from '../models/index.js';

export const authMiddleware = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId, {
        include: [{ model: Role, as: 'role' }]
      });

      if (user && user.status) {
        req.user = user;
        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role.slug,
          roleName: user.role.name,
          umkm_id: user.umkm_id
        };
        res.locals.user = req.session.user;
      } else {
        req.session.destroy();
        return res.redirect('/login?error=Session+expired+or+account+deactivated');
      }
    } catch (err) {
      console.error('Error loading user in session:', err);
    }
  } else {
    res.locals.user = null;
  }
  next();
};

export const isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.redirect('/login');
};

export const isGuest = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  const role = req.session.user.role;
  if (role === 'admin_system') return res.redirect('/admin-system/dashboard');
  if (role === 'admin_umkm') return res.redirect('/admin-umkm/dashboard');
  if (role === 'pegawai_penjualan') return res.redirect('/kasir/dashboard');
  if (role === 'pegawai_pembelian') return res.redirect('/pembelian/dashboard');
  res.redirect('/login');
};

export const hasRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    const userRole = req.session.user.role;
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    res.status(403).render('error', {
      message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk membuka halaman ini.',
      error: { status: 403 }
    });
  };
};

export default {
  authMiddleware,
  isAuthenticated,
  isGuest,
  hasRole
};
