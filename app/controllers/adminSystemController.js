import { Umkm, User, Role } from '../models/index.js';
import { DashboardService } from '../services/dashboardService.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

export class AdminSystemController {
  static async dashboard(req, res) {
    try {
      const stats = await DashboardService.getSystemStats();
      const umkms = await Umkm.findAll({
        include: [{
          model: User,
          as: 'users',
          required: false,
          include: [{
            model: Role,
            as: 'role',
            where: { slug: 'admin_umkm' }
          }]
        }],
        order: [['created_at', 'DESC']]
      });

      res.render('admin_system/dashboard', {
        title: 'Dashboard System Admin',
        stats,
        umkms
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat dashboard', error: err });
    }
  }

  static async indexUmkm(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { nama_umkm: { [Op.like]: `%${search}%` } },
        { alamat: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await Umkm.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'users',
          required: false,
          include: [{
            model: Role,
            as: 'role',
            where: { slug: 'admin_umkm' }
          }]
        }],
        limit,
        offset,
        distinct: true,
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.render('admin_system/umkm/index', {
        title: 'Daftar UMKM',
        umkms: rows,
        search,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat daftar UMKM', error: err });
    }
  }

  static createUmkm(req, res) {
    res.render('admin_system/umkm/create', { title: 'Tambah UMKM' });
  }

  static async storeUmkm(req, res) {
    const { nama_umkm, alamat, telepon, username, name, email, password } = req.body;

    try {
      // Find Role Admin UMKM
      const adminUmkmRole = await Role.findOne({ where: { slug: 'admin_umkm' } });
      if (!adminUmkmRole) {
        throw new Error('Role Admin UMKM tidak ditemukan di database.');
      }

      // Create UMKM
      const umkm = await Umkm.create({
        nama_umkm,
        alamat,
        telepon
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create Admin User for UMKM
      await User.create({
        username,
        name,
        email,
        password: hashedPassword,
        role_id: adminUmkmRole.id,
        status: true,
        umkm_id: umkm.id
      });

      req.session.flash = { success: 'UMKM dan Admin UMKM berhasil ditambahkan!' };
      res.redirect('/admin-system/umkm');
    } catch (err) {
      console.error(err);
      req.session.errors = { general: err.message };
      res.redirect('back');
    }
  }

  static async editUmkm(req, res) {
    const { id } = req.params;

    try {
      const umkm = await Umkm.findByPk(id);
      if (!umkm) {
        req.session.flash = { error: 'UMKM tidak ditemukan.' };
        return res.redirect('/admin-system/umkm');
      }

      const admin = await User.findOne({
        where: {
          umkm_id: umkm.id,
          status: true
        },
        include: [{
          model: Role,
          as: 'role',
          where: { slug: 'admin_umkm' }
        }]
      });

      res.render('admin_system/umkm/edit', {
        title: 'Edit UMKM',
        umkm,
        admin
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat data edit UMKM', error: err });
    }
  }

  static async updateUmkm(req, res) {
    const { id } = req.params;
    const { nama_umkm, alamat, telepon, username, name, email, password } = req.body;

    try {
      const umkm = await Umkm.findByPk(id);
      if (!umkm) {
        req.session.flash = { error: 'UMKM tidak ditemukan.' };
        return res.redirect('/admin-system/umkm');
      }

      // Update UMKM
      await umkm.update({
        nama_umkm,
        alamat,
        telepon
      });

      // Update Admin User
      const admin = await User.findOne({
        where: {
          umkm_id: umkm.id
        },
        include: [{
          model: Role,
          as: 'role',
          where: { slug: 'admin_umkm' }
        }]
      });

      if (admin) {
        const userData = { username, name, email };
        if (password && password.trim() !== '') {
          userData.password = await bcrypt.hash(password, 10);
        }
        await admin.update(userData);
      }

      req.session.flash = { success: 'UMKM dan Admin UMKM berhasil diperbarui!' };
      res.redirect('/admin-system/umkm');
    } catch (err) {
      console.error(err);
      req.session.errors = { general: err.message };
      res.redirect('back');
    }
  }

  static async destroyUmkm(req, res) {
    const { id } = req.params;

    try {
      const umkm = await Umkm.findByPk(id);
      if (umkm) {
        await umkm.destroy();
        req.session.flash = { success: 'UMKM berhasil dihapus.' };
      } else {
        req.session.flash = { error: 'UMKM tidak ditemukan.' };
      }
      res.redirect('/admin-system/umkm');
    } catch (err) {
      console.error(err);
      req.session.flash = { error: 'Gagal menghapus UMKM.' };
      res.redirect('/admin-system/umkm');
    }
  }

  static async toggleUserStatus(req, res) {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id);
      if (user) {
        user.status = !user.status;
        await user.save();
        req.session.flash = { success: `Status user ${user.username} berhasil diubah menjadi ${user.status ? 'Aktif' : 'Nonaktif'}!` };
      } else {
        req.session.flash = { error: 'User tidak ditemukan.' };
      }
      res.redirect('back');
    } catch (err) {
      console.error(err);
      req.session.flash = { error: 'Gagal mengubah status user.' };
      res.redirect('back');
    }
  }
}

export default AdminSystemController;
