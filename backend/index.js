// backend/index.js
require('dotenv').config(); // Carrega variáveis de ambiente ANTES de usar
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const nodemailer = require('nodemailer');

// Importação dinâmica do 'open' para evitar erro de exportação em ESM
const openBrowser = async (url) => {
  try {
    const open = await import('open');
    open.default(url);
  } catch (e) {
    console.warn('⚠️ Não foi possível abrir o navegador automaticamente:', e.message);
  }
};

// Rotas
const clienteRoutes = require('./routes/cliente');
const authRoutes = require('./routes/auth');
const financeiroRoutes = require('./routes/financeiro'); // ADICIONADO: importar financeiro

const app = express();
const port = process.env.PORT || 3001;

/* ===========================
   SMTP (Gmail App Password)
   =========================== */
const requiredEnv = ['EMAIL_USER', 'EMAIL_PASS'];
const missing = requiredEnv.filter((k) => !process.env[k] || !String(process.env[k]).trim());
if (missing.length) {
  console.warn('⚠️ Variáveis de ambiente ausentes:', missing.join(', '));
  console.warn('   Configure seu .env com EMAIL_USER e EMAIL_PASS (App Password do Gmail).');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: String(process.env.EMAIL_SECURE || 'true') === 'true', // 465 = secure true
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password de 16 caracteres, sem espaços
  },
});

// Testa conexão SMTP ao subir
(async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP pronto para enviar (', transporter.options.host, transporter.options.port, 'secure=', transporter.options.secure, ')');
  } catch (err) {
    console.error('❌ Falha ao conectar no SMTP:', err.message);
    // Dica comum para Gmail
    console.error('   Dica: use App Password de 16 caracteres (sem espaços) e secure=true/port=465.');
  }
})();

/* ===========================
   Middlewares globais
   =========================== */
app.use(express.json({ limit: '1mb' })); // JSON
app.use(cors()); // CORS aberto (ajuste se precisar)
app.use(helmet()); // Segurança
app.use(morgan('dev')); // Logs HTTP

// Injeta o transporter no request para uso nas rotas
app.use((req, res, next) => {
  req.mailer = transporter;
  next();
});

/* ===========================
   Rotas
   =========================== */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '🚀 SmartQuota API está online!',
    timestamp: new Date().toISOString(),
  });
});

// Todas as rotas de cliente em /cliente
app.use('/cliente', clienteRoutes);
// Rotas de autenticação em /auth
app.use('/auth', authRoutes);
// ADICIONADO: Rotas de financeiro em /financeiro
app.use('/financeiro', financeiroRoutes);

/* ===========================
   404 e Erros
   =========================== */
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('🔥 Erro interno:', err.stack || err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: err.message || String(err),
    timestamp: new Date().toISOString(),
  });
});

/* ===========================
   Start do servidor
   =========================== */
app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`✅ SmartQuota Backend rodando na porta ${port} — ${new Date().toLocaleString()}`);
  openBrowser(url); // Abre o navegador automaticamente
});