function setLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) el.placeholder = translations[lang][key];
  });

  document.getElementById('current-lang-label').textContent = lang.toUpperCase();
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  // Re-render dynamic content so it isn't stuck in the old language
  if (typeof updateMealSummary === 'function') updateMealSummary();
  if (typeof renderGuestNames === 'function') renderGuestNames();
}

// Load saved language immediately when this file runs
const savedLang = localStorage.getItem('lang') || 'en';
setLanguage(savedLang);