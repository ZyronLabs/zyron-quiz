const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.post('/login', adminController.login);
router.get('/verify', adminController.verify);
router.post('/logout', adminController.logout);
router.post('/reset', adminController.resetDados);

module.exports = router;
