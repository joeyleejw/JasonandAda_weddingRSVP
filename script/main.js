function matchRowHeights() {
   const form = document.getElementById("rsvp-form");
   if (!form) return;

   // 1. Reset inline heights across all targeted elements so natural height is recalculated
   const elementsToReset = form.querySelectorAll(
      ".row label, .row input:not([type='checkbox']):not([type='hidden']), .row select, .row .input-phone-number, .row #babychair-wrapper"
   );
   elementsToReset.forEach((el) => {
      el.style.height = ""; // Reset inline height completely
   });

   // 2. Loop through form grid rows
   const rows = form.querySelectorAll(".row");

   rows.forEach((row) => {
      const labels = row.querySelectorAll(":scope > div > label");
      // Target input wrappers and controls
      const inputs = row.querySelectorAll(
         ":scope > div > input:not([type='checkbox']):not([type='hidden']), :scope > div > select, :scope > div > .input-phone-number, :scope > div > #babychair-wrapper"
      );

      const equalize = (elements) => {
         if (elements.length <= 1) return;

         let maxHeight = 0;
         elements.forEach((el) => {
            // Measure natural outer height
            const h = el.offsetHeight;
            if (h > maxHeight) maxHeight = h;
         });

         if (maxHeight > 0) {
            elements.forEach((el) => {
               el.style.height = `${maxHeight}px`;
               // If it's a wrapper (like #babychair-wrapper), force inner select to 100% height
               const select = el.querySelector("select");
               if (select) select.style.height = "100%";
            });
         }
      };

      equalize(labels);
      equalize(inputs);
   });
}

// Recalculate on window resize
window.addEventListener("resize", matchRowHeights);

// Observe DOM updates inside the form (e.g., dynamic guest fields added/removed)
document.addEventListener("DOMContentLoaded", () => {
   const form = document.getElementById("rsvp-form");
   if (form) {
      const formObserver = new MutationObserver(() => matchRowHeights());
      formObserver.observe(form, { childList: true, subtree: true });
   }
   matchRowHeights();
});

document.addEventListener("DOMContentLoaded", () => {
   const observerOptions = {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.1
   };

   const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
         if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
         } else {
            // Removes class when element leaves viewport so it re-animates on scroll back
            entry.target.classList.remove("is-visible");
         }
      });
   }, observerOptions);

   document.querySelectorAll(".fade-in-section").forEach((el) => {
      scrollObserver.observe(el);
   });
});