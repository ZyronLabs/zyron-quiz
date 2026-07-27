const express = require('express');
const router = express.Router();
const leadService = require('../services/lead.service');

router.get('/refresh', async (req, res) => {
    try {
        const stats = await leadService.getStats();
        const leads = await leadService.getAllLeads();
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            stats: stats,
            total: leads.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
