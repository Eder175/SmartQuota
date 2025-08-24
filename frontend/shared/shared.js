// frontend/shared/shared.js

// Configurações gerais
export const API_BASE_URL = 'http://localhost:3001';

// Autenticação
export function getToken() {
  return localStorage.getItem('smartquota_token');
}

export function setToken(token) {
  localStorage.setItem('smartquota_token', token);
}

export function clearAuth() {
  localStorage.removeItem('smartquota_token');
}

export function requireAuthOrRedirect(loginPath = 'login.html') {
  const token = getToken();
  if (!token) {
    window.location.href = loginPath;
    return null;
  }
  return token;
}

export async function fetchMe() {
  const token = requireAuthOrRedirect();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Unauthorized');
    const data = await res.json();
    return data.user;
  } catch (err) {
    clearAuth();
    window.location.href = 'login.html';
    return null;
  }
}

// Wrapper de fetch com JSON + Bearer + tratamento de erro
export async function fetchJSON(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    let errorPayload = {};
    try { errorPayload = await res.json(); } catch (_) {}
    const err = new Error(errorPayload.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = errorPayload;
    throw err;
  }

  // Tentar json; se vazio, retornar null
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

// Tema
export function loadTheme() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', isDark);
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = isDark ? 'fas fa-sun mr-3' : 'fas fa-moon mr-3';
}

export function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = isDark ? 'fas fa-sun mr-3' : 'fas fa-moon mr-3';
}

// i18n básico
const i18nTranslations = {
  pt: {
    finances: 'Minhas Finanças',
    month: 'Mês',
    year: 'Ano',
    income: 'Ganhos',
    addIncome: 'Adicionar ganho',
    expenses: 'Despesas',
    addExpense: 'Adicionar despesa',
    category: 'Categoria',
    description: 'Descrição',
    amount: 'Montante',
    actions: 'Ações',
    delete: 'Excluir',
    totalIncome: 'Total de Ganhos',
    totalExpenses: 'Total de Despesas',
    balance: 'Saldo',
    save: 'Salvar',
  },
  en: {
    finances: 'My Finances',
    month: 'Month',
    year: 'Year',
    income: 'Income',
    addIncome: 'Add income',
    expenses: 'Expenses',
    addExpense: 'Add expense',
    category: 'Category',
    description: 'Description',
    amount: 'Amount',
    actions: 'Actions',
    delete: 'Delete',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    balance: 'Balance',
    save: 'Save',
  }
};

export function detectBrowserLanguage(supported = ['pt', 'en'], fallback = 'pt') {
  const saved = localStorage.getItem('lang');
  if (saved && supported.includes(saved)) return saved;
  const lang = (navigator.language || 'pt').split('-')[0];
  return supported.includes(lang) ? lang : fallback;
}

export function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  applyTranslations(lang);
}

export function applyTranslations(lang) {
  const dict = i18nTranslations[lang] || i18nTranslations.pt;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) langSelect.value = lang;
}

// Utilidade de moeda
export function formatCurrency(value, currency = 'EUR', locale = 'pt-PT') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));
  } catch {
    // fallback simples
    const symbols = { EUR: '€', USD: '$', GBP: '£', BRL: 'R$' };
    const sym = symbols[currency] || '';
    return `${sym}${Number(value || 0).toFixed(2)}`;
  }
}

// Navegação e logout
export function setupCommonUI() {
  // Toggle tema
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja sair?')) {
        clearAuth();
        window.location.href = 'login.html';
      }
    });
  }
  // Idioma
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  loadTheme();
  const lang = detectBrowserLanguage();
  setLanguage(lang);
}