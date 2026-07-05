const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { create, getAll, getOne } = require('../controllers/voucherController');

router.get('/',     auth, getAll);
router.get('/:id',  auth, getOne);
router.post('/',    auth, create);

module.exports = router;