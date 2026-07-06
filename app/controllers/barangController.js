import { Barang, StokLog } from '../models/index.js';
import { Op } from 'sequelize';

export class BarangController {
  static async index(req, res) {
    const umkmId = req.session.user.umkm_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Sorting variables
    let sortBy = req.query.sort_by || 'nama_barang';
    let sortDir = req.query.sort_dir || 'asc';

    if (!['kode_barang', 'nama_barang', 'stok', 'satuan'].includes(sortBy)) {
      sortBy = 'nama_barang';
    }
    if (!['asc', 'desc'].includes(sortDir.toLowerCase())) {
      sortDir = 'asc';
    }

    const whereClause = {
      umkm_id: umkmId
    };

    if (search) {
      whereClause[Op.or] = [
        { kode_barang: { [Op.like]: `%${search}%` } },
        { nama_barang: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await Barang.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sortBy, sortDir.toUpperCase()]]
      });

      const totalPages = Math.ceil(count / limit);

      res.render('admin_umkm/barang/index', {
        title: 'Daftar Barang',
        barang: rows,
        search,
        sortBy,
        sortDir,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat daftar barang', error: err });
    }
  }

  static create(req, res) {
    res.render('admin_umkm/barang/create', { title: 'Tambah Barang' });
  }

  static async store(req, res) {
    const umkmId = req.session.user.umkm_id;
    const { kode_barang, nama_barang, ukuran, stok, satuan } = req.body;

    try {
      const parsedStok = parseInt(stok, 10) || 0;

      const barang = await Barang.create({
        kode_barang,
        nama_barang,
        ukuran,
        stok: parsedStok,
        satuan,
        umkm_id: umkmId
      });

      // Log initial stock log if stok > 0
      if (parsedStok > 0) {
        await StokLog.create({
          barang_id: barang.id,
          tipe: 'masuk',
          qty: parsedStok,
          keterangan: 'Input Awal Barang',
          tanggal: new Date()
        });
      }

      req.session.flash = { success: 'Barang berhasil ditambahkan!' };
      res.redirect('/admin-umkm/barang');
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
      const barang = await Barang.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (!barang) {
        req.session.flash = { error: 'Barang tidak ditemukan.' };
        return res.redirect('/admin-umkm/barang');
      }

      res.render('admin_umkm/barang/edit', { title: 'Edit Barang', barang });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat form edit barang', error: err });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;
    const { kode_barang, nama_barang, ukuran, stok, satuan } = req.body;

    try {
      const barang = await Barang.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (!barang) {
        req.session.flash = { error: 'Barang tidak ditemukan.' };
        return res.redirect('/admin-umkm/barang');
      }

      const oldStock = barang.stok;
      const newStock = parseInt(stok, 10) || 0;

      await barang.update({
        kode_barang,
        nama_barang,
        ukuran,
        stok: newStock,
        satuan
      });

      // Log manual adjustment if stock changes
      if (oldStock !== newStock) {
        const diff = newStock - oldStock;
        await StokLog.create({
          barang_id: barang.id,
          tipe: diff > 0 ? 'masuk' : 'keluar',
          qty: Math.abs(diff),
          keterangan: 'Koreksi Stok Manual oleh Admin',
          tanggal: new Date()
        });
      }

      req.session.flash = { success: 'Data barang berhasil diperbarui!' };
      res.redirect('/admin-umkm/barang');
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
      const barang = await Barang.findOne({
        where: { id, umkm_id: umkmId }
      });

      if (barang) {
        await barang.destroy();
        req.session.flash = { success: 'Barang berhasil dihapus.' };
      } else {
        req.session.flash = { error: 'Barang tidak ditemukan.' };
      }
      res.redirect('/admin-umkm/barang');
    } catch (err) {
      console.error(err);
      req.session.flash = { error: 'Gagal menghapus barang.' };
      res.redirect('/admin-umkm/barang');
    }
  }
}

export default BarangController;
