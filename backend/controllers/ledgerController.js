const pool = require('../db');

const getAll = async (req, res) => {
  const { company_id } = req.query;
  const result = await pool.query(
    'SELECT l.*, g.name as group_name FROM ledgers l LEFT JOIN ledger_groups g ON l.group_id=g.id WHERE l.company_id=$1 ORDER BY l.name',
    [company_id]
  );
  res.json(result.rows);
};

const create = async (req, res) => {
  const {
    company_id, group_id, name, ledger_type,
    gstin, phone, address, opening_balance, balance_type
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ledgers 
        (company_id, group_id, name, ledger_type, gstin, phone, address, opening_balance, balance_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) 
       RETURNING *`,
      [
        company_id,
        group_id || null,     
        name,
        ledger_type || 'CUSTOMER',
        gstin || null,        
        phone || null,         
        address || null,      
        opening_balance || 0,
        balance_type || 'DR'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('CREATE LEDGER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { name, ledger_type, gstin, phone, address } = req.body;
  const result = await pool.query(
    'UPDATE ledgers SET name=$1, ledger_type=$2, gstin=$3, phone=$4, address=$5 WHERE id=$6 RETURNING *',
    [name, ledger_type, gstin, phone, address, id]
  );
  res.json(result.rows[0]);
};

const remove = async (req, res) => {
  await pool.query('DELETE FROM ledgers WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
};

module.exports = { getAll, create, update, remove };