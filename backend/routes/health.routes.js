const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
    // Verificar se o arquivo leads.json existe
    const leadsPath = process.env.NODE_ENV === 'production' 
        ? '/data/leads.json' 
        : path.join(__dirname, '../database/leads.json');
    
    let leadsCount = 0;
    let fileExists = false;
    
    try {
        if (fs.existsSync(leadsPath)) {
            fileExists = true;
            const data = fs.readFileSync(leadsPath, 'utf8');
            const leads = JSON.parse(data);
            leadsCount = leads.length;
        }
    } catch (e) {
        // Ignorar
    }

    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
            path: leadsPath,
            exists: fileExists,
            leads: leadsCount
        },
        uptime: process.uptime()
    });
});

module.exports = router;
