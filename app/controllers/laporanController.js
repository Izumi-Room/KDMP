import { Penjualan, DetailPenjualan, Pembelian, DetailPembelian, Barang, Supplier, User, Umkm, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit-table';
import ExcelJS from 'exceljs';

const indoMonths = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export class LaporanController {
  static getIndoMonths() {
    return indoMonths;
  }

  static getYearsRange() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }

  // 1. Sales Report
  static async penjualanIndex(req, res) {
    const umkmId = req.session.user.umkm_id;
    const bulan = parseInt(req.query.bulan || new Date().getMonth() + 1, 10);
    const tahun = parseInt(req.query.tahun || new Date().getFullYear(), 10);

    try {
      const report = await Penjualan.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: DetailPenjualan, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC'], ['created_at', 'ASC']]
      });

      res.render('admin_umkm/laporan/penjualan', {
        title: 'Laporan Penjualan',
        report,
        bulan,
        tahun,
        months: indoMonths,
        years: LaporanController.getYearsRange()
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat laporan penjualan', error: err });
    }
  }

  static async penjualanExportPdf(req, res) {
    const umkmId = req.session.user.umkm_id;
    const bulan = parseInt(req.query.bulan || new Date().getMonth() + 1, 10);
    const tahun = parseInt(req.query.tahun || new Date().getFullYear(), 10);
    const namaBulan = indoMonths[bulan];

    try {
      const umkm = await Umkm.findByPk(umkmId);
      const report = await Penjualan.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: DetailPenjualan, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC']]
      });

      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=laporan_penjualan_${umkm.nama_umkm.replace(/\s+/g, '_')}_${namaBulan}_${tahun}.pdf`);

      doc.pipe(res);

      // PDF Title Page Header
      doc.fontSize(16).text(umkm.nama_umkm, { align: 'center' });
      doc.fontSize(10).text(umkm.alamat || '', { align: 'center' });
      doc.fontSize(10).text('Telp: ' + (umkm.telepon || '-'), { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(14).text(`LAPORAN PENJUALAN - ${namaBulan.toUpperCase()} ${tahun}`, { align: 'center', underline: true });
      doc.moveDown(2);

      // Build Table rows
      let grandTotal = 0;
      const rows = [];
      report.forEach((sale, index) => {
        grandTotal += parseFloat(sale.total_harga);
        const itemNames = sale.details.map(d => `${d.barang?.nama_barang} (${d.qty}x)`).join(', ');
        rows.push([
          String(index + 1),
          sale.tanggal,
          sale.no_faktur,
          sale.user?.name || '-',
          itemNames,
          formatRupiah(sale.total_harga)
        ]);
      });

      // Append Grand Total Row
      rows.push(['', '', '', '', 'Total Pendapatan', formatRupiah(grandTotal)]);

      const table = {
        headers: ['No', 'Tanggal', 'No Faktur', 'Kasir', 'Barang (Qty)', 'Subtotal'],
        rows: rows
      };

      await doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
        prepareRow: (row, i) => doc.font('Helvetica').fontSize(8)
      });

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Gagal mengekspor PDF laporan penjualan.');
    }
  }

  static async penjualanExportExcel(req, res) {
    const umkmId = req.session.user.umkm_id;
    const bulan = parseInt(req.query.bulan || new Date().getMonth() + 1, 10);
    const tahun = parseInt(req.query.tahun || new Date().getFullYear(), 10);
    const namaBulan = indoMonths[bulan];

    try {
      const umkm = await Umkm.findByPk(umkmId);
      const report = await Penjualan.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: DetailPenjualan, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC']]
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Laporan Penjualan');

      // Title rows
      sheet.addRow([umkm.nama_umkm]).font = { bold: true, size: 14 };
      sheet.addRow([umkm.alamat || '']);
      sheet.addRow([`Laporan Penjualan: ${namaBulan} ${tahun}`]).font = { italic: true };
      sheet.addRow([]); // Blank spacer

      // Table header
      const headers = ['No', 'Tanggal', 'No Faktur', 'Kasir', 'Detail Barang Belanja', 'Total Harga (IDR)'];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      let grandTotal = 0;
      report.forEach((sale, index) => {
        grandTotal += parseFloat(sale.total_harga);
        const itemNames = sale.details.map(d => `${d.barang?.nama_barang} (${d.qty} ${d.barang?.satuan || 'pcs'})`).join(', ');
        const row = sheet.addRow([
          index + 1,
          sale.tanggal,
          sale.no_faktur,
          sale.user?.name || '-',
          itemNames,
          parseFloat(sale.total_harga)
        ]);
        row.getCell(6).numFmt = '#,##0';
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Total Row
      const totalRow = sheet.addRow(['', '', '', '', 'Total Pendapatan', grandTotal]);
      totalRow.font = { bold: true };
      totalRow.getCell(6).numFmt = '#,##0';
      totalRow.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Adjust column width
      sheet.columns.forEach(col => {
        let maxLen = 0;
        col.eachCell({ includeEmpty: true }, cell => {
          const cellLen = cell.value ? String(cell.value).length : 0;
          if (cellLen > maxLen) maxLen = cellLen;
        });
        col.width = maxLen < 12 ? 12 : maxLen + 4;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=laporan_penjualan_${umkm.nama_umkm.replace(/\s+/g, '_')}_${namaBulan}_${tahun}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Gagal mengekspor Excel laporan penjualan.');
    }
  }

  // 2. Purchase Report
  static async pembelianIndex(req, res) {
    const umkmId = req.session.user.umkm_id;
    const bulan = parseInt(req.query.bulan || new Date().getMonth() + 1, 10);
    const tahun = parseInt(req.query.tahun || new Date().getFullYear(), 10);

    try {
      const report = await Pembelian.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: Supplier, as: 'supplier' },
          { model: DetailPembelian, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC'], ['created_at', 'ASC']]
      });

      res.render('admin_umkm/laporan/pembelian', {
        title: 'Laporan Pembelian',
        report,
        bulan,
        tahun,
        months: indoMonths,
        years: LaporanController.getYearsRange()
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat laporan pembelian', error: err });
    }
  }

  static async pembelianExportPdf(req, res) {
    const umkmId = req.session.user.umkm_id;
    const bulan = parseInt(req.query.bulan || new Date().getMonth() + 1, 10);
    const tahun = parseInt(req.query.tahun || new Date().getFullYear(), 10);
    const namaBulan = indoMonths[bulan];

    try {
      const umkm = await Umkm.findByPk(umkmId);
      const report = await Pembelian.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: Supplier, as: 'supplier' },
          { model: DetailPembelian, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC']]
      });

      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=laporan_pembelian_${umkm.nama_umkm.replace(/\s+/g, '_')}_${namaBulan}_${tahun}.pdf`);

      doc.pipe(res);

      doc.fontSize(16).text(umkm.nama_umkm, { align: 'center' });
      doc.fontSize(10).text(umkm.alamat || '', { align: 'center' });
      doc.fontSize(10).text('Telp: ' + (umkm.telepon || '-'), { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(14).text(`LAPORAN RESTOK & PEMBELIAN - ${namaBulan.toUpperCase()} ${tahun}`, { align: 'center', underline: true });
      doc.moveDown(2);

      let grandTotal = 0;
      const rows = [];
      report.forEach((purchase, index) => {
        grandTotal += parseFloat(purchase.total_harga);
        const itemNames = purchase.details.map(d => `${d.barang?.nama_barang} (${d.qty}x)`).join(', ');
        rows.push([
          String(index + 1),
          purchase.tanggal,
          purchase.no_faktur,
          purchase.supplier?.nama_supplier || '-',
          purchase.user?.name || '-',
          itemNames,
          formatRupiah(purchase.total_harga)
        ]);
      });

      rows.push(['', '', '', '', '', 'Total Pengeluaran', formatRupiah(grandTotal)]);

      const table = {
        headers: ['No', 'Tanggal', 'No Faktur', 'Supplier', 'Pegawai', 'Barang (Qty)', 'Subtotal'],
        rows: rows
      };

      await doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
        prepareRow: (row, i) => doc.font('Helvetica').fontSize(8)
      });

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Gagal mengekspor PDF laporan pembelian.');
    }
  }

  static async pembelianExportExcel(req, res) {
    const umkmId = req.session.user.umkm_id;
    const bulan = parseInt(req.query.bulan || new Date().getMonth() + 1, 10);
    const tahun = parseInt(req.query.tahun || new Date().getFullYear(), 10);
    const namaBulan = indoMonths[bulan];

    try {
      const umkm = await Umkm.findByPk(umkmId);
      const report = await Pembelian.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: Supplier, as: 'supplier' },
          { model: DetailPembelian, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC']]
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Laporan Pembelian');

      sheet.addRow([umkm.nama_umkm]).font = { bold: true, size: 14 };
      sheet.addRow([umkm.alamat || '']);
      sheet.addRow([`Laporan Restok & Pembelian: ${namaBulan} ${tahun}`]).font = { italic: true };
      sheet.addRow([]);

      const headers = ['No', 'Tanggal', 'No Faktur', 'Supplier', 'Pegawai', 'Detail Barang Restok', 'Total Harga (IDR)'];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      let grandTotal = 0;
      report.forEach((purchase, index) => {
        grandTotal += parseFloat(purchase.total_harga);
        const itemNames = purchase.details.map(d => `${d.barang?.nama_barang} (${d.qty} ${d.barang?.satuan || 'pcs'})`).join(', ');
        const row = sheet.addRow([
          index + 1,
          purchase.tanggal,
          purchase.no_faktur,
          purchase.supplier?.nama_supplier || '-',
          purchase.user?.name || '-',
          itemNames,
          parseFloat(purchase.total_harga)
        ]);
        row.getCell(7).numFmt = '#,##0';
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      const totalRow = sheet.addRow(['', '', '', '', '', 'Total Pengeluaran', grandTotal]);
      totalRow.font = { bold: true };
      totalRow.getCell(7).numFmt = '#,##0';
      totalRow.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      sheet.columns.forEach(col => {
        let maxLen = 0;
        col.eachCell({ includeEmpty: true }, cell => {
          const cellLen = cell.value ? String(cell.value).length : 0;
          if (cellLen > maxLen) maxLen = cellLen;
        });
        col.width = maxLen < 12 ? 12 : maxLen + 4;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=laporan_pembelian_${umkm.nama_umkm.replace(/\s+/g, '_')}_${namaBulan}_${tahun}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Gagal mengekspor Excel laporan pembelian.');
    }
  }
}

export default LaporanController;
