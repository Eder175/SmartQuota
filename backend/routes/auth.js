// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Importa a referência ao array de clientes do cliente.js
// (Na próxima tarefa vamos expor getClientesRef no cliente.js)
const { getClientesRef } = require('./cliente');

// Configurações JWT (use .env se tiver; senão, fallback seguro para dev)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-smartquota';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ADIÇÃO: Rate limiter para login (já estava)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // até 50 logins por IP nessa janela
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    const reset = req.rateLimit.resetTime
      ? Math.max(1, Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000))
      : 60;
    res.set('Retry-After', reset);
    return res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente mais tarde.',
      retryAfterSeconds: reset,
    });
  },
});

// ADIÇÃO: Rate limiter para rota de esqueci/senha (proteção básica)
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 6, // 6 pedidos por IP por hora
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.set('Retry-After', 3600);
    return res.status(429).json({
      error: 'Muitas solicitações de recuperação. Tente novamente mais tarde.'
    });
  }
});

// Gera token JWT
function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Util: gerar id (simples)
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Verificador simples de token (temporário; Tarefa 3 cria middleware dedicado)
function verificarToken(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');
    if (!token || (scheme && scheme.toLowerCase() !== 'bearer')) {
      return res.status(401).json({ error: 'Token ausente ou esquema inválido' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// ---------- ROTA: check-email (GET) ----------
/*
  Uso: GET /auth/check-email?email=xxx
  Retorna { exists: true } ou { exists: false }
  Se a rota não existir no backend, o frontend ignora (comportamento já implementado).
*/
router.get('/check-email', (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email obrigatório' });

    const clientes = getClientesRef();
    const found = clientes.some(c => String(c.email || '').toLowerCase() === email);
    return res.json({ exists: !!found });
  } catch (err) {
    console.error('Erro em GET /auth/check-email:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---------- POST /auth/login  (mantido e melhorado mensagens) ----------
router.post('/login', loginLimiter, async (req, res) => {
  try {
    // aceita { email, senha } ou { email, password }
    const body = req.body || {};
    const email = body.email;
    const senha = body.senha || body.password;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const clientes = getClientesRef(); // array em memória compartilhado
    const cliente = clientes.find(c => String(c.email).toLowerCase() === emailNorm);

    if (!cliente) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaSalva = cliente.senha || '';
    let ok = false;
    try {
      if (senhaSalva.startsWith('$2')) {
        ok = await bcrypt.compare(senha, senhaSalva); // senha com hash
      } else {
        ok = senha === senhaSalva; // temporário até aplicarmos hash no cadastro
      }
    } catch (bcryptErr) {
      console.warn('Erro ao comparar senha:', bcryptErr);
      ok = false;
    }

    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Opcional: exigir confirmação de e-mail
    // if (!cliente.confirmado) return res.status(403).json({ error: 'Confirme seu e-mail.' });

    const token = gerarToken({ sub: emailNorm, nome: cliente.nome, uid: cliente.id || genId() });
    return res.json({
      ok: true,
      token,
      user: {
        nome: cliente.nome,
        email: cliente.email,
        confirmado: !!cliente.confirmado,
      },
    });
  } catch (err) {
    console.error('🔥 Erro em POST /auth/login:', err);
    return res.status(500).json({ error: 'Erro interno ao autenticar.' });
  }
});

// ---------- GET /auth/me ----------
router.get('/me', verificarToken, (req, res) => {
  try {
    const emailNorm = String(req.user.sub || '').toLowerCase();
    const clientes = getClientesRef();
    const cliente = clientes.find(c => String(c.email).toLowerCase() === emailNorm);
    if (!cliente) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json({
      user: {
        nome: cliente.nome,
        email: cliente.email,
        confirmado: !!cliente.confirmado,
        moeda: cliente.moeda || 'EUR',
        locale: cliente.locale || null
      },
    });
  } catch (err) {
    console.error('🔥 Erro em GET /auth/me:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---------- POST /auth/forgot ----------
/*
  Fluxo:
   - Recebe { email }
   - Gera token temporário e guarda em cliente.resetToken + resetTokenExpiry
   - Loga o link de reset no console (para testes)
   - Retorna mensagem genérica para não vazar se o email existe ou não
*/
router.post('/forgot', forgotLimiter, (req, res) => {
  try {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email obrigatório' });

    const clientes = getClientesRef();
    const cliente = clientes.find(c => String(c.email).toLowerCase() === email);

    // Gerar token independente do cliente existir para evitar enumeração
    const token = genId();
    const expiryMs = 1000 * 60 * 60; // 1 hora

    if (cliente) {
      cliente.resetToken = token;
      cliente.resetTokenExpiry = Date.now() + expiryMs;
      // Opcional: persistir no banco real quando migrar
    }

    // Loga link (em produção, enviar por email via nodemailer)
    const resetLinkFrontend = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset.html?token=${token}`;
    console.info('Password reset link (dev) ->', resetLinkFrontend);

    // Resposta genérica (para segurança)
    return res.json({
      ok: true,
      message: 'Se o email existir, enviamos instruções para redefinir a senha.'
    });
  } catch (err) {
    console.error('Erro em POST /auth/forgot:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---------- GET /auth/reset (valida token) ----------
/*
  Uso: GET /auth/reset?token=xxx
  Retorna { valid: true, email } se existir e não expirou (apenas para frontend validar)
*/
router.get('/reset', (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).json({ error: 'Token é obrigatório' });

    const clientes = getClientesRef();
    const cliente = clientes.find(c => c.resetToken === token && (c.resetTokenExpiry || 0) > Date.now());
    if (!cliente) return res.status(404).json({ valid: false, error: 'Token inválido ou expirado' });

    return res.json({ valid: true, email: cliente.email });
  } catch (err) {
    console.error('Erro em GET /auth/reset:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;