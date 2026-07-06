import bcrypt from 'bcryptjs';
import { User, Role } from '../models/index.js';

export class AuthController {
  static showLogin(req, res) {
    const error = req.query.error || null;
    res.render('auth/login', { error, layout: false });
  }

  static async login(req, res) {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({
        where: { username },
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.status) {
        return res.render('auth/login', { error: 'Username tidak ditemukan atau akun dinonaktifkan', layout: false });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.render('auth/login', { error: 'Password salah', layout: false });
      }

      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role.slug,
        roleName: user.role.name,
        umkm_id: user.umkm_id
      };

      const role = user.role.slug;
      if (role === 'admin_system') return res.redirect('/admin-system/dashboard');
      if (role === 'admin_umkm') return res.redirect('/admin-umkm/dashboard');
      if (role === 'pegawai_penjualan') return res.redirect('/kasir/dashboard');
      if (role === 'pegawai_pembelian') return res.redirect('/pembelian/dashboard');

      res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.render('auth/login', { error: 'Terjadi kesalahan sistem', layout: false });
    }
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.redirect('/login');
    });
  }

  static showChangePassword(req, res) {
    res.render('auth/change-password', { title: 'Ubah Password' });
  }

  static async updatePassword(req, res) {
    const { current_password, password, password_confirmation } = req.body;
    const userId = req.session.user.id;

    if (password !== password_confirmation) {
      req.session.errors = { password_confirmation: 'Konfirmasi password baru tidak cocok' };
      return res.redirect('back');
    }

    try {
      const user = await User.findByPk(userId);
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        req.session.errors = { current_password: 'Password saat ini salah' };
        return res.redirect('back');
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      req.session.flash = { success: 'Password berhasil diperbarui!' };
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.redirect('back');
    }
  }

  static async showProfile(req, res) {
    try {
      const user = await User.findByPk(req.session.user.id);
      res.render('auth/profile', { title: 'Profil Saya', profileUser: user });
    } catch (err) {
      console.error(err);
      res.redirect('back');
    }
  }

  static async updateProfile(req, res) {
    const { name, email } = req.body;
    const userId = req.session.user.id;

    try {
      const user = await User.findByPk(userId);
      user.name = name;
      user.email = email;
      await user.save();

      req.session.user.name = name;
      req.session.user.email = email;

      req.session.flash = { success: 'Profil berhasil diperbarui!' };
      res.redirect('back');
    } catch (err) {
      console.error(err);
      res.redirect('back');
    }
  }
}

export default AuthController;
