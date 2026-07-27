#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, '../database/leads.json');

// Criar leads vazio
fs.writeFileSync(leadsPath, JSON.stringify([], null, 2));
console.log('✅ Dados resetados com sucesso!');
console.log('📊 Total de leads: 0');
