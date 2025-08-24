// backend/routes/financeiro.js
const express = require('express');
const router = express.Router();

// Middleware de autenticação (usa mesmo padrão do seu auth.js)
const jwt = require('jsonwebtoken');

// Ajuste se sua env variável tiver outro nome
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Moedas suportadas globalmente
const MOEDAS_SUPORTADAS = {
  'EUR': { nome: 'Euro', simbolo: '€', locale: 'pt-PT' },
  'USD': { nome: 'Dólar Americano', simbolo: '$', locale: 'en-US' },
  'BRL': { nome: 'Real Brasileiro', simbolo: 'R$', locale: 'pt-BR' },
  'GBP': { nome: 'Libra Esterlina', simbolo: '£', locale: 'en-GB' },
  'JPY': { nome: 'Iene Japonês', simbolo: '¥', locale: 'ja-JP' }
};

// Armazenamento em memória:
// Estrutura: store[userId][ano][mes] = { ganhos: [...], despesas: [], moeda: 'EUR' }
const store = Object.create(null);

// Helper para extrair userId do token
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // seu token provavelmente tem { id, email, ... }
    req.userId = decoded.id || decoded.userId || decoded.sub;
    if (!req.userId) {
      return res.status(401).json({ message: 'Invalid token: missing user id' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Normaliza mes/ano e prepara o bucket
function getBucket(userId, ano, mes) {
  if (!store[userId]) store[userId] = Object.create(null);
  if (!store[userId][ano]) store[userId][ano] = Object.create(null);
  if (!store[userId][ano][mes]) {
    store[userId][ano][mes] = { 
      ganhos: [], 
      despesas: [], 
      moeda: 'EUR' // moeda padrão
    };
  }
  return store[userId][ano][mes];
}

// GET /financeiro/moedas - Lista moedas suportadas
router.get('/moedas', authMiddleware, (req, res) => {
  return res.json({ moedas: MOEDAS_SUPORTADAS });
});

// GET /financeiro?mes=MM&ano=YYYY
router.get('/', authMiddleware, (req, res) => {
  const userId = req.userId;
  const mes = (req.query.mes || '').padStart(2, '0');
  const ano = String(req.query.ano || '');

  if (!mes || !ano) {
    return res.status(400).json({ message: 'Parâmetros mes e ano são obrigatórios' });
  }

  const bucket = getBucket(userId, ano, mes);
  return res.json({
    mes,
    ano,
    moeda: bucket.moeda,
    ganhos: bucket.ganhos,
    despesas: bucket.despesas
  });
});

// PUT /financeiro/renda  body: { mes, ano, ganhos: [{id,descricao,valor}], moeda?: 'EUR' }
router.put('/renda', authMiddleware, (req, res) => {
  const userId = req.userId;
  let { mes, ano, ganhos, moeda } = req.body || {};
  mes = String(mes || '').padStart(2, '0');
  ano = String(ano || '');

  if (!mes || !ano || !Array.isArray(ganhos)) {
    return res.status(400).json({ message: 'Informe mes, ano e array de ganhos' });
  }

  // Validar moeda se fornecida
  if (moeda && !MOEDAS_SUPORTADAS[moeda]) {
    return res.status(400).json({ message: 'Moeda não suportada' });
  }

  // saneamento
  ganhos = ganhos.map(g => ({
    id: String(g.id || genId()),
    descricao: String(g.descricao || ''),
    valor: Number(g.valor || 0)
  }));

  const bucket = getBucket(userId, ano, mes);
  bucket.ganhos = ganhos;
  if (moeda) bucket.moeda = moeda;

  return res.json({ ok: true, ganhos: bucket.ganhos, moeda: bucket.moeda });
});

// PUT /financeiro/despesas  body: { mes, ano, despesas: [{id,categoria,descricao,valor}], moeda?: 'EUR' }
router.put('/despesas', authMiddleware, (req, res) => {
  const userId = req.userId;
  let { mes, ano, despesas, moeda } = req.body || {};
  mes = String(mes || '').padStart(2, '0');
  ano = String(ano || '');

  if (!mes || !ano || !Array.isArray(despesas)) {
    return res.status(400).json({ message: 'Informe mes, ano e array de despesas' });
  }

  // Validar moeda se fornecida
  if (moeda && !MOEDAS_SUPORTADAS[moeda]) {
    return res.status(400).json({ message: 'Moeda não suportada' });
  }

  // saneamento
  despesas = despesas.map(d => ({
    id: String(d.id || genId()),
    categoria: String(d.categoria || 'Outros'),
    descricao: String(d.descricao || ''),
    valor: Number(d.valor || 0)
  }));

  const bucket = getBucket(userId, ano, mes);
  bucket.despesas = despesas;
  if (moeda) bucket.moeda = moeda;

  return res.json({ ok: true, despesas: bucket.despesas, moeda: bucket.moeda });
});

// PUT /financeiro/moeda  body: { mes, ano, moeda: 'USD' }
router.put('/moeda', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { mes, ano, moeda } = req.body || {};
  
  if (!mes || !ano || !moeda) {
    return res.status(400).json({ message: 'Informe mes, ano e moeda' });
  }

  if (!MOEDAS_SUPORTADAS[moeda]) {
    return res.status(400).json({ message: 'Moeda não suportada' });
  }

  const bucket = getBucket(userId, String(ano), String(mes).padStart(2, '0'));
  bucket.moeda = moeda;

  return res.json({ ok: true, moeda: bucket.moeda });
});

// DELETE /financeiro/despesas/:id?mes=MM&ano=YYYY
router.delete('/despesas/:id', authMiddleware, (req, res) => {
  const userId = req.userId;
  const id = String(req.params.id || '');
  const mes = String(req.query.mes || '').padStart(2, '0');
  const ano = String(req.query.ano || '');

  if (!id || !mes || !ano) {
    return res.status(400).json({ message: 'Informe id, mes e ano' });
  }
  
  const bucket = getBucket(userId, ano, mes);
  const before = bucket.despesas.length;
  bucket.despesas = bucket.despesas.filter(d => String(d.id) !== id);
  const removed = before - bucket.despesas.length;

  return res.json({ ok: true, removed });
});

// GET /financeiro/resumo?mes=MM&ano=YYYY
router.get('/resumo', authMiddleware, (req, res) => {
  const userId = req.userId;
  const mes = String(req.query.mes || '').padStart(2, '0');
  const ano = String(req.query.ano || '');

  if (!mes || !ano) {
    return res.status(400).json({ message: 'Parâmetros mes e ano são obrigatórios' });
  }

  const bucket = getBucket(userId, ano, mes);
  const totalGanhos = bucket.ganhos.reduce((s, g) => s + Number(g.valor || 0), 0);
  const totalDespesas = bucket.despesas.reduce((s, d) => s + Number(d.valor || 0), 0);
  const saldo = totalGanhos - totalDespesas;

  return res.json({ 
    mes, 
    ano, 
    moeda: bucket.moeda,
    totalGanhos, 
    totalDespesas, 
    saldo 
  });
});

// util
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

module.exports = router;