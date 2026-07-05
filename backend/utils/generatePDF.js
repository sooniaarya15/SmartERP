const PDFDocument = require('pdfkit');

const generateInvoicePDF = (voucher, res) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${voucher.voucher_number}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice No: ${voucher.voucher_number}`);
  doc.text(`Date: ${voucher.date}`);
  doc.text(`Party: ${voucher.party_name}`);
  doc.moveDown();

  voucher.items.forEach(item => {
    doc.text(`${item.item_name}  x${item.quantity}  @${item.rate}  =  ₹${item.amount}`);
  });

  doc.moveDown();
  doc.text(`Subtotal: ₹${voucher.subtotal}`, { align: 'right' });
  doc.text(`GST: ₹${voucher.gst_amount}`, { align: 'right' });
  doc.fontSize(14).text(`Total: ₹${voucher.total_amount}`, { align: 'right' });
  doc.end();
};

module.exports = generateInvoicePDF;