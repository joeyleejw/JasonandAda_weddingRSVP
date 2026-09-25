let currentLang = localStorage.getItem("lang") || "en";

window.formatZH = function (text) {
   if (typeof text !== "string") return text;
   return text.replace(/([\u4e00-\u9fa5]+)/g, '<span class="zh-text">$1</span>');
};

function applyTranslations(lang) {
   document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
         const rawText = translations[lang][key];
         // If language is ZH, auto-wrap Chinese characters and use innerHTML
         if (lang === "zh") {
            el.innerHTML = formatZH(rawText);
         } else {
            el.textContent = rawText;
         }
      }
   });

   document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang] && translations[lang][key]) {
         el.placeholder = translations[lang][key];
      }
   });
}

function setLanguage(lang) {
   currentLang = lang;

   // Re-render dynamic guest inputs so their titles get translated
   if (typeof renderGuestNames === "function") {
      renderGuestNames();
   } else {
      applyTranslations(lang);
   }

   const langLabel = document.getElementById("current-lang-label");
   if (langLabel) {
      langLabel.textContent = lang.toUpperCase();
   }

   localStorage.setItem("lang", lang);
   document.documentElement.lang = lang;

   if (typeof matchRowHeights === "function") {
      setTimeout(matchRowHeights, 50);
   }
}

// Sync dropdown and apply translations on initial load
setLanguage(currentLang);
