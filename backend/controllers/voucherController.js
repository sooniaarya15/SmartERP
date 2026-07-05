const pool = require('../db');

const create = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      company_id, voucher_type, date,
      party_ledger_id, items, notes
    } = req.body;

    // Auto voucher number
    const count = await client.query(
      'SELECT COUNT(*) FROM vouchers WHERE company_id=$1 AND voucher_type=$2',
      [company_id, voucher_type]
    );
    const prefix = voucher_type === 'SALE' ? 'INV' : 'PUR';
    const num = `${prefix}-${String(Number(count.rows[0].count) + 1).padStart(4, '0')}`;

    const subtotal   = items.reduce((s, i) => s + Number(i.amount), 0);
    const gst_amount = items.reduce((s, i) => s + Number(i.gst_amount), 0);
    const total      = subtotal + gst_amount;

    // Voucher header insert
    const voucher = await client.query(
      `INSERT INTO vouchers
        (company_id, voucher_type, voucher_number, date, party_ledger_id,
         subtotal, gst_amount, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [company_id, voucher_type, num, date, party_ledger_id,
       subtotal, gst_amount, total, notes]
    );

    // Line items insert
    for (const item of items) {
      await client.query(
        `INSERT INTO voucher_items
          (voucher_id, stock_item_id, quantity, rate, gst_percent, gst_amount, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [voucher.rows[0].id, item.stock_item_id, item.quantity,
         item.rate, item.gst_percent, item.gst_amount, item.amount]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(voucher.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CREATE VOUCHER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const getAll = async (req, res) => {
  const { company_id, voucher_type } = req.query;
  try {
    const result = await pool.query(
      `SELECT v.*, l.name as party_name
       FROM vouchers v
       LEFT JOIN ledgers l ON v.party_ledger_id = l.id
       WHERE v.company_id=$1
       ${voucher_type ? 'AND v.voucher_type=$2' : ''}
       ORDER BY v.date DESC`,
      voucher_type ? [company_id, voucher_type] : [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET VOUCHERS ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const voucher = await pool.query(
      `SELECT v.*, l.name as party_name
       FROM vouchers v
       LEFT JOIN ledgers l ON v.party_ledger_id = l.id
       WHERE v.id=$1`,
      [req.params.id]
    );
    if (voucher.rows.length === 0)
      return res.status(404).json({ error: 'Voucher not found' });

    const items = await pool.query(
      `SELECT vi.*, s.name as item_name
       FROM voucher_items vi
       LEFT JOIN stock_items s ON vi.stock_item_id = s.id
       WHERE vi.voucher_id=$1`,
      [req.params.id]
    );

    res.json({ ...voucher.rows[0], items: items.rows });
  } catch (err) {
    console.error('GET VOUCHER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { create, getAll, getOne };