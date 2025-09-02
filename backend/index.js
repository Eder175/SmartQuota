// backend/index.js (sugestão melhorada)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const openBrowser = async (url) => {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const open = await import('open');
    open.default(url);
  } catch (e) {
    console.warn('⚠️ Não foi possível abrir o navegador automaticamente:', e.message);
  }
};

const clienteRoutes = require('./routes/cliente');
const authRoutes = require('./routes/auth');
const financeiroRoutes = require('./routes/financeiro');

const app = express();
const port = process.env.PORT || 3001;

/* SMTP */
const requiredEnv = ['EMAIL_USER', 'EMAIL_PASS'];
const missing = requiredEnv.filter((k) => !process.env[k] || !String(process.env[k]).trim());
if (missing.length) {
  console.warn('⚠️ Variáveis de ambiente ausentes:', missing.join(', '));
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: String(process.env.EMAIL_SECURE || 'true') === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

(async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP pronto para enviar');
  } catch (err) {
    console.error('❌ Falha ao conectar no SMTP:', err.message);
  }
})();

/* Middlewares */
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS com origem da .env (FRONTEND_BASE) ou aberto em dev
const frontendBase = process.env.FRONTEND_BASE || null;
const corsOptions = {
  origin: frontendBase || (process.env.NODE_ENV === 'development' ? true : false),
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting básico
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Injeta transporter
app.use((req, res, next) => {
  req.mailer = transporter;
  next();
});

/* Rotas */
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: '🚀 SmartQuota API está online!', timestamp: new Date().toISOString() });
});
app.use('/cliente', clienteRoutes);
app.use('/auth', authRoutes);
app.use('/financeiro', financeiroRoutes);

/* 404 */
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl, timestamp: new Date().toISOString() });
});

/* Erro */
app.use((err, req, res, next) => {
  console.error('🔥 Erro interno:', err.stack || err);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Erro interno do servidor' });
  } else {
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message || String(err) });
  }
});

/* Start */
app.listen(port, () => {
  console.log(`✅ SmartQuota Backend rodando na porta ${port} — ${new Date().toLocaleString()}`);
  if (process.env.NODE_ENV !== 'production') {
    openBrowser(`http://localhost:${port}`).catch(()=>{});
  }
});

// opcional: lidar com rejeições não tratadas
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // opcional: process.exit(1);
});