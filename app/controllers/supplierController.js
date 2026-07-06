import { Supplier } from '../models/index.js';
import { Op } from 'sequelize';

export class SupplierController {
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
        { kode_supplier: { [Op.like]: `%${search}%` } },
        { nama_supplier: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await Supplier.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.render('admin_umkm/supplier/index', {
        title: 'Daftar Supplier',
        suppliers: rows,
        search,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat daftar supplier', error: err });
    }
  }

  static create(req, res) {
    res.render('admin_umkm/supplier/create', { title: 'Tambah Supplier' });
  }

  static async store(req, res) {
    const umkmId = req.session.user.umkm_id;
    const { kode_supplier, nama_supplier, alamat, npwp } = req.body;

    try {
      await Supplier.create({
        kode_supplier,
        nama_supplier,
        alamat,
        npwp,
        umkm_id: umkmId
      });

      req.session.flash = { success: 'Supplier berhasil ditambahkan!' };
      res.redirect('/admin-umkm/supplier');
    } catch (err) {
      console.error(err);
      req.session.errors = { general: err.message };
      res.redirect('back');
    }
  }

  static async edit(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;

    try {
      const supplier = await Supplier.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (!supplier) {
        req.session.flash = { error: 'Supplier tidak ditemukan.' };
        return res.redirect('/admin-umkm/supplier');
      }

      res.render('admin_umkm/supplier/edit', { title: 'Edit Supplier', supplier });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat form edit supplier', error: err });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;
    const { kode_supplier, nama_supplier, alamat, npwp } = req.body;

    try {
      const supplier = await Supplier.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (!supplier) {
        req.session.flash = { error: 'Supplier tidak ditemukan.' };
        return res.redirect('/admin-umkm/supplier');
      }

      await supplier.update({
        kode_supplier,
        nama_supplier,
        alamat,
        npwp
      });

      req.session.flash = { success: 'Data supplier berhasil diperbarui!' };
      res.redirect('/admin-umkm/supplier');
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
      const supplier = await Supplier.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (supplier) {
        await supplier.destroy();
        req.session.flash = { success: 'Supplier berhasil dihapus.' };
      } else {
        req.session.flash = { error: 'Supplier tidak ditemukan.' };
      }
      res.redirect('/admin-umkm/supplier');
    } catch (err) {
      console.error(err);
      req.session.flash = { error: 'Gagal menghapus supplier.' };
      res.redirect('/admin-umkm/supplier');
    }
  }
}

export default SupplierController;
