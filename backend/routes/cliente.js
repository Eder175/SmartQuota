const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

/**
 * Banco em memória (mantido)
 */
const clientes = [];

// Util: normalizar e-mail
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Util: validar payload básico
function validarPayload(body) {
  const erros = [];
  if (!body || typeof body !== 'object') {
    erros.push('Payload inválido');
    return erros;
  }
  if (!body.nome || !String(body.nome).trim()) erros.push('Nome é obrigatório');
  if (!body.email || !String(body.email).trim()) erros.push('Email é obrigatório');
  if (!body.telefone || !String(body.telefone).trim()) erros.push('Telefone é obrigatório');
  if (!body.senha || !String(body.senha).trim()) erros.push('Senha é obrigatória');
  if (!body.moeda || !String(body.moeda).trim()) erros.push('Moeda é obrigatória');

  const e = body.endereco || {};
  if (!e.rua || !String(e.rua).trim()) erros.push('Rua é obrigatória');
  if (!e.numero || !String(e.numero).trim()) erros.push('Número é obrigatório');
  if (!e.cidade || !String(e.cidade).trim()) erros.push('Cidade é obrigatória');
  if (!e.estado || !String(e.estado).trim()) erros.push('Estado/Província é obrigatório');
  if (!e.pais || !String(e.pais).trim()) erros.push('País é obrigatório');

  return erros;
}

// Rate limiter para cadastro
const cadastroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    const reset = req.rateLimit.resetTime
      ? Math.max(1, Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000))
      : 60;
    res.set('Retry-After', reset);
    return res.status(429).json({
      error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.',
      retryAfterSeconds: reset,
    });
  },
});

// Fallback local de transporter
let fallbackTransporter;
function getMailer(req) {
  if (req.mailer) return req.mailer;
  if (!fallbackTransporter) {
    fallbackTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    console.warn('⚠️ Usando transporter local em routes/cliente.js');
  }
  return fallbackTransporter;
}

// Links de confirmação
function gerarLinkConfirmacaoPorEmail(email) {
  const emailEnc = encodeURIComponent(email);
  return `http://localhost:${process.env.PORT || 3001}/cliente/confirmar?email=${emailEnc}`;
}
function gerarLinkConfirmacaoPorToken(email) {
  const token = Buffer.from(normalizeEmail(email)).toString('base64url');
  return `http://localhost:${process.env.PORT || 3001}/cliente/confirmar?token=${token}`;
}

// Envio de e-mail
async function enviarEmailConfirmacao(req, cliente) {
  const mailer = getMailer(req);
  const linkEmail = gerarLinkConfirmacaoPorEmail(cliente.email);
  const linkToken = gerarLinkConfirmacaoPorToken(cliente.email);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2>Olá ${cliente.nome},</h2>
      <p>Obrigado por se cadastrar no <strong>SmartQuota</strong>.</p>
      <p>Clique no botão abaixo para confirmar seu email:</p>
      <p>
        <a href="${linkEmail}" style="display:inline-block;background:#0078D4;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none" target="_blank" rel="noopener">
          Confirmar Cadastro
        </a>
      </p>
      <p style="margin-top:12px">Se preferir, você também pode usar este link alternativo:</p>
      <p><a href="${linkToken}" target="_blank" rel="noopener">${linkToken}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="font-size:12px;color:#666">Se você não solicitou este cadastro, ignore este email.</p>
    </div>
  `;

  const mailOptions = {
    from: `"SmartQuota" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: 'Confirmação de Cadastro - SmartQuota',
    html,
  };

  return getMailer(req).sendMail(mailOptions);
}

/**
 * POST /cliente
 */
router.post('/', cadastroLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const erros = validarPayload(body);
    if (erros.length) return res.status(400).json({ error: erros.join('; ') });

    const emailNorm = normalizeEmail(body.email);
    const existe = clientes.find((c) => normalizeEmail(c.email) === emailNorm);
    if (existe) return res.status(409).json({ error: 'Email já cadastrado.' });

    const senhaHash = await bcrypt.hash(String(body.senha).trim(), 10);
    const e = body.endereco || {};
    const cliente = {
      nome: String(body.nome).trim(),
      email: emailNorm,
      telefone: String(body.telefone).trim(),
      endereco: {
        rua: String(e.rua || '').trim(),
        numero: String(e.numero || '').trim(),
        cidade: String(e.cidade || '').trim(),
        estado: String(e.estado || '').trim(),
        pais: String(e.pais || '').trim(),
      },
      senha: senhaHash,
      moeda: String(body.moeda).trim(),
      confirmado: false,
      criadoEm: new Date().toISOString(),
    };

    clientes.push(cliente);

    let emailStatus = 'sent';
    try {
      await enviarEmailConfirmacao(req, cliente);
      console.log('📧 Email de confirmação enviado para:', cliente.email);
    } catch (err) {
      emailStatus = 'failed';
      console.error('❌ Erro ao enviar email:', err.message);
    }

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso! Verifique seu email para confirmar.',
      emailStatus,
      cliente: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        moeda: cliente.moeda,
        confirmado: cliente.confirmado,
        criadoEm: cliente.criadoEm,
      },
    });
  } catch (err) {
    console.error('🔥 Erro no POST /cliente:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar.' });
  }
});

/**
 * GET /cliente/confirmar
 * - Suporta ?email=... e ?token=...
 * - CONFIRMA e REDIRECIONA para o login.html com ?confirmed=1
 */
router.get('/confirmar', (req, res) => {
  try {
    let email = req.query.email;

    if (!email && req.query.token) {
      try {
        email = Buffer.from(String(req.query.token), 'base64url').toString('utf8');
      } catch {}
    }

    if (!email) {
      return res.status(400).send('<h2>Requisição inválida: email ou token ausente.</h2>');
    }

    const emailNorm = normalizeEmail(email);
    const cliente = clientes.find((c) => normalizeEmail(c.email) === emailNorm);

    if (!cliente) {
      return res.status(404).send('<h2>Cliente não encontrado.</h2>');
    }

    cliente.confirmado = true;

    // URL do frontend (ajuste se seu frontend servir em outra porta)
    const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:3000';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SmartQuota - Email confirmado</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; background:#f9fafb; }
          .card { max-width: 720px; margin: 40px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.06); background:#fff; }
          .title { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
          .muted { color: #6b7280; }
          .badge { display:inline-block; background:#10b981; color:#fff; padding:4px 10px; border-radius:999px; font-size:12px; margin-left:8px; }
          .btn { display:inline-block; margin-top:16px; background:#0078D4; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">Email confirmado com sucesso para ${cliente.nome.split(' ')[0]}! <span class="badge">OK</span></div>
          <div class="muted">Você será redirecionado para a página de login em instantes...</div>
          <a class="btn" id="loginLink" href="${FRONTEND_BASE}/login.html?confirmed=1">Ir para o login agora</a>
        </div>
        <script>
          setTimeout(function(){
            window.location.href = "${FRONTEND_BASE}/login.html?confirmed=1";
          }, 1800);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('🔥 Erro no GET /cliente/confirmar:', err);
    res.status(500).send('<h2>Erro interno ao confirmar.</h2>');
  }
});

/**
 * GET /cliente/:email — debug
 */
router.get('/:email', (req, res) => {
  const emailNorm = normalizeEmail(req.params.email);
  const cliente = clientes.find((c) => normalizeEmail(c.email) === emailNorm);
  if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json({ cliente });
});

module.exports = router;
module.exports.getClientesRef = () => clientes;