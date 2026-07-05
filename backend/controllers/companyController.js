const pool = require('../db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE user_id=$1 ORDER BY created_at',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const count = await pool.query(
      'SELECT COUNT(*) FROM companies WHERE user_id=$1',
      [req.user.id]
    );
    if (Number(count.rows[0].count) >= 5)
      return res.status(400).json({ error: 'Maximum 5 companies allowed' });

    const { name, gstin, address, state, financial_year_start } = req.body;
    const result = await pool.query(
      `INSERT INTO companies (user_id, name, gstin, address, state, financial_year_start)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, name, gstin, address, state, financial_year_start]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, gstin, address, state, financial_year_start } = req.body;
    const result = await pool.query(
      `UPDATE companies SET name=$1, gstin=$2, address=$3, state=$4,
       financial_year_start=$5 WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name, gstin, address, state, financial_year_start, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM companies WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, create, update, remove };