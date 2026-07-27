const fs = require('fs');
const path = require('path');

class LoggerService {
  constructor() {
    this.logPath = path.join(__dirname, '../logs/app.log');
    this.errorPath = path.join(__dirname, '../logs/errors.log');
    this.debugMode = process.env.NODE_ENV !== 'production';
    
    // Criar diretório de logs se não existir
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Log geral
  info(message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: message,
      data: data
    };
    this._write(entry);
    console.log(`ℹ️ ${message}`);
  }

  // Log de erro
  error(message, error = null, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: message,
      error: error ? {
        message: error.message || error,
        stack: error.stack || null,
        code: error.code || null
      } : null,
      data: data
    };
    this._write(entry, true);
    console.error(`❌ ${message}`);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }

  // Log de warn
  warn(message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: message,
      data: data
    };
    this._write(entry);
    console.warn(`⚠️ ${message}`);
  }

  // Log de debug (apenas desenvolvimento)
  debug(message, data = null) {
    if (!this.debugMode) return;
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message: message,
      data: data
    };
    this._write(entry);
    console.log(`🐛 ${message}`);
  }

  // Escrever no arquivo
  _write(entry, isError = false) {
    try {
      const filePath = isError ? this.errorPath : this.logPath;
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filePath, line);
    } catch (err) {
      // Se falhar ao escrever no arquivo, log no console
      console.error('❌ Falha ao escrever log:', err.message);
    }
  }

  // Obter logs recentes
  getLogs(limit = 100, type = 'all') {
    try {
      const filePath = type === 'error' ? this.errorPath : this.logPath;
      if (!fs.existsSync(filePath)) return [];
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });
      return logs.slice(-limit);
    } catch (error) {
      return [];
    }
  }

  // Limpar logs
  clearLogs() {
    try {
      if (fs.existsSync(this.logPath)) {
        fs.writeFileSync(this.logPath, '');
      }
      if (fs.existsSync(this.errorPath)) {
        fs.writeFileSync(this.errorPath, '');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Middleware para Express
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Log da requisição
      this.debug(`📥 ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.method !== 'GET' ? req.body : undefined
      });

      // Interceptar resposta
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - start;
        const status = res.statusCode;
        
        // Log da resposta
        if (status >= 400) {
          logger.error(`❌ ${req.method} ${req.url} → ${status} (${duration}ms)`, null, {
            status,
            duration,
            response: data
          });
        } else {
          logger.debug(`✅ ${req.method} ${req.url} → ${status} (${duration}ms)`, { status, duration });
        }
        
        return originalSend.call(this, data);
      };

      next();
    };
  }
}

// Singleton
const logger = new LoggerService();
module.exports = logger;
