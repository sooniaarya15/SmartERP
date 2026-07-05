const pool = require('../db');

const getAll = async (req, res) => {
  const { company_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM ledger_groups WHERE company_id=$1 ORDER BY name',
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET GROUPS ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  const { company_id, name, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO ledger_groups (company_id, name, type) VALUES ($1,$2,$3) RETURNING *',
      [company_id, name, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('CREATE GROUP ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, create };