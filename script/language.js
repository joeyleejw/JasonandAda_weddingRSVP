let currentLang = "en";
try {
   currentLang = localStorage.getItem("lang") || "en";
} catch {
   // localStorage can be blocked (private mode, some in-app browsers) — fall back to English
}

// Wrap runs of Chinese characters in a span so they can be styled separately
window.formatZH = function (text) {
   if (typeof text !== "string") return text;
   return text.replace(/([\u4e00-\u9fa5]+)/g, '<span class="zh-text">$1</span>');
};

// Fill every [data-i18n] element and [data-i18n-placeholder] field.
// innerHTML is used so translation strings can contain <br> and other tags.
function applyTranslations(lang) {
   const dict = translations[lang];
   if (!dict) return;

   document.querySelectorAll("[data-i18n]").forEach((el) => {
      const text = dict[el.getAttribute("data-i18n")];
      if (text) el.innerHTML = lang === "zh" ? formatZH(text) : text;
   });

   document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const text = dict[el.getAttribute("data-i18n-placeholder")];
      if (text) el.placeholder = text;
   });
}

function setLanguage(lang) {
   currentLang = lang;

   // Re-render dynamic guest inputs so their titles get translated
   // (renderGuestNames also calls applyTranslations)
   if (typeof renderGuestNames === "function") {
      renderGuestNames();
   } else {
      applyTranslations(lang);
   }

   if (typeof updateBabyChairFontSize === "function") {
      updateBabyChairFontSize();
   }

   const langLabel = document.getElementById("current-lang-label");
   if (langLabel) langLabel.textContent = lang.toUpperCase();

   try {
      localStorage.setItem("lang", lang);
   } catch {}
   document.documentElement.lang = lang;

   if (typeof matchRowHeights === "function") {
      setTimeout(matchRowHeights, 50);
   }
}

// Apply the saved language on initial load
setLanguage(currentLang);