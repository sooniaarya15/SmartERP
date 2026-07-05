const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/ledger-groups', require('./routes/ledgerGroups'));
app.use('/api/ledgers', require('./routes/ledgers'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/vouchers', require('./routes/vouchers'));


app.get('/', (req, res) => res.json({ message: 'SmartERP API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const pool = require('./db');

pool.query('SELECT NOW()')
  .then(res => console.log("DB Connected:", res.rows[0]))
  .catch(err => console.error("DB Error:", err));

