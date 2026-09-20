let currentLang = localStorage.getItem('lang') || 'en';

function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) el.placeholder = translations[lang][key];
  });
}

function setLanguage(lang) {
  currentLang = lang;
  applyTranslations(lang);
  document.getElementById('current-lang-label').textContent = lang.toUpperCase();
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
}

// Load saved language on page load
applyTranslations(currentLang);