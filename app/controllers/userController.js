import { User, Role } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

export class UserController {
  static async index(req, res) {
    const umkmId = req.session.user.umkm_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = {
      umkm_id: umkmId
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [{
          model: Role,
          as: 'role',
          where: {
            slug: {
              [Op.in]: ['pegawai_penjualan', 'pegawai_pembelian']
            }
          }
        }],
        limit,
        offset,
        distinct: true,
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.render('admin_umkm/user/index', {
        title: 'Daftar Pegawai',
        users: rows,
        search,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat daftar pegawai', error: err });
    }
  }

  static async create(req, res) {
    try {
      const roles = await Role.findAll({
        where: {
          slug: {
            [Op.in]: ['pegawai_penjualan', 'pegawai_pembelian']
          }
        }
      });
      res.render('admin_umkm/user/create', { title: 'Tambah Pegawai', roles });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat form tambah pegawai', error: err });
    }
  }

  static async store(req, res) {
    const umkmId = req.session.user.umkm_id;
    const { username, name, email, password, role_id } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        username,
        name,
        email: email || null,
        password: hashedPassword,
        role_id,
        status: true,
        umkm_id: umkmId
      });

      req.session.flash = { success: 'Pegawai berhasil ditambahkan!' };
      res.redirect('/admin-umkm/user');
    } catch (err) {
      console.error(err);
      req.session.errors = { general: err.message };
      res.redirect('back');
    }
  }

  static async show(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;

    try {
      const user = await User.findOne({
        where: { id, umkm_id: umkmId },
        include: [{ model: Role, as: 'role' }]
      });

      if (!user) {
        req.session.flash = { error: 'Pegawai tidak ditemukan.' };
        return res.redirect('/admin-umkm/user');
      }

      res.render('admin_umkm/user/show', { title: 'Detail Pegawai', employee: user });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat detail pegawai', error: err });
    }
  }

  static async edit(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;

    try {
      const user = await User.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (!user) {
        req.session.flash = { error: 'Pegawai tidak ditemukan.' };
        return res.redirect('/admin-umkm/user');
      }

      const roles = await Role.findAll({
        where: {
          slug: {
            [Op.in]: ['pegawai_penjualan', 'pegawai_pembelian']
          }
        }
      });

      res.render('admin_umkm/user/edit', { title: 'Edit Pegawai', employee: user, roles });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat form edit pegawai', error: err });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;
    const { username, name, email, password, role_id, status } = req.body;

    try {
      const user = await User.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (!user) {
        req.session.flash = { error: 'Pegawai tidak ditemukan.' };
        return res.redirect('/admin-umkm/user');
      }

      const updateData = {
        username,
        name,
        email: email || null,
        role_id,
        status: status === '1' || status === 'true' || status === true
      };

      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await user.update(updateData);

      req.session.flash = { success: 'Data pegawai berhasil diperbarui!' };
      res.redirect('/admin-umkm/user');
    } catch (err) {
      console.error(err);
      req.session.errors = { general: err.message };
      res.redirect('back');
    }
  }

  static async destroy(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;

    try {
      const user = await User.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (user) {
        await user.destroy();
        req.session.flash = { success: 'Pegawai berhasil dihapus.' };
      } else {
        req.session.flash = { error: 'Pegawai tidak ditemukan.' };
      }
      res.redirect('/admin-umkm/user');
    } catch (err) {
      console.error(err);
      req.session.flash = { error: 'Gagal menghapus pegawai.' };
      res.redirect('/admin-umkm/user');
    }
  }
}

export default UserController;
