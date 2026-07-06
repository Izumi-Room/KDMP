import { Umkm } from '../models/index.js';
import { DashboardService } from '../services/dashboardService.js';

export class AdminUmkmController {
  static async dashboard(req, res) {
    const umkmId = req.session.user.umkm_id;

    try {
      const stats = await DashboardService.getUmkmStats(umkmId);
      res.render('admin_umkm/dashboard', {
        title: 'Dashboard Admin UMKM',
        stats
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat dashboard UMKM', error: err });
    }
  }

  static async editProfile(req, res) {
    const umkmId = req.session.user.umkm_id;

    try {
      const umkm = await Umkm.findByPk(umkmId);
      res.render('admin_umkm/profile', {
        title: 'Edit Profil UMKM',
        umkm
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat profil UMKM', error: err });
    }
  }

  static async updateProfile(req, res) {
    const umkmId = req.session.user.umkm_id;
    const { nama_umkm, alamat, telepon } = req.body;

    try {
      const umkm = await Umkm.findByPk(umkmId);
      if (umkm) {
        await umkm.update({ nama_umkm, alamat, telepon });
        req.session.flash = { success: 'Profil UMKM berhasil diperbarui!' };
      } else {
        req.session.flash = { error: 'Profil UMKM tidak ditemukan.' };
      }
      res.redirect('back');
    } catch (err) {
      console.error(err);
      req.session.errors = { general: err.message };
      res.redirect('back');
    }
  }
}

export default AdminUmkmController;
