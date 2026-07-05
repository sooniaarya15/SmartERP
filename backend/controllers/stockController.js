const pool = require('../db');

// GET all stock items for a company
const getAll = async (req, res) => {
  const { company_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM stock_items WHERE company_id=$1 ORDER BY name',
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET STOCK ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET single stock item by id
const getOne = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stock_items WHERE id=$1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Stock item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET STOCK ONE ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// CREATE new stock item
const create = async (req, res) => {
  const {
    company_id,
    name,
    sku,
    unit,
    gst_percent,
    purchase_price,
    selling_price,
    opening_stock
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO stock_items
        (company_id, name, sku, unit, gst_percent, purchase_price, selling_price, opening_stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        company_id,
        name,
        sku || null,
        unit || 'PCS',
        gst_percent || 18,
        purchase_price || 0,
        selling_price || 0,
        opening_stock || 0
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('CREATE STOCK ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE existing stock item
const update = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    sku,
    unit,
    gst_percent,
    purchase_price,
    selling_price,
    opening_stock
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE stock_items
       SET name=$1, sku=$2, unit=$3, gst_percent=$4,
           purchase_price=$5, selling_price=$6, opening_stock=$7
       WHERE id=$8
       RETURNING *`,
      [name, sku, unit, gst_percent, purchase_price, selling_price, opening_stock, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Stock item not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('UPDATE STOCK ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE stock item
const remove = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM stock_items WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Stock item not found' });

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE STOCK ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };