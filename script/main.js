// Equalise label and control heights across the columns of each form row,
// so side-by-side fields line up even when one label wraps onto two lines.
function matchRowHeights() {
   const form = document.getElementById("rsvp-form");
   if (!form) return;

   // 1. Clear previous inline heights so natural heights can be measured again
   form
      .querySelectorAll(
         ".row label, .row input:not([type='checkbox']):not([type='hidden']), .row select, .row .input-phone-number, .row #babychair-wrapper",
      )
      .forEach((el) => {
         el.style.height = "";
      });

   // 2. Match heights row by row
   const equalize = (elements) => {
      if (elements.length <= 1) return;

      const maxHeight = Math.max(...Array.from(elements, (el) => el.offsetHeight));
      if (maxHeight <= 0) return;

      elements.forEach((el) => {
         el.style.height = `${maxHeight}px`;
         // Wrappers (e.g. #babychair-wrapper): make the inner select fill the wrapper
         const select = el.querySelector("select");
         if (select) select.style.height = "100%";
      });
   };

   form.querySelectorAll(".row").forEach((row) => {
      equalize(row.querySelectorAll(":scope > div > label"));
      equalize(
         row.querySelectorAll(
            ":scope > div > input:not([type='checkbox']):not([type='hidden']), :scope > div > select, :scope > div > .input-phone-number, :scope > div > #babychair-wrapper",
         ),
      );
   });
}

// Batch repeated calls (resize, DOM changes) into one per animation frame
let rowHeightsQueued = false;
function scheduleRowHeights() {
   if (rowHeightsQueued) return;
   rowHeightsQueued = true;
   requestAnimationFrame(() => {
      rowHeightsQueued = false;
      matchRowHeights();
   });
}

// Fade sections in as they scroll into view (and re-animate when scrolling back)
function initFadeIns() {
   const scrollObserver = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
         });
      },
      { root: null, rootMargin: "0px 0px -40px 0px", threshold: 0.1 },
   );

   document.querySelectorAll(".fade-in-section").forEach((el) => scrollObserver.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
   const form = document.getElementById("rsvp-form");
   if (form) {
      // Re-match heights when fields are added/removed (guest fields, baby chair options)
      new MutationObserver(scheduleRowHeights).observe(form, { childList: true, subtree: true });
   }

   window.addEventListener("resize", scheduleRowHeights);
   matchRowHeights();
   initFadeIns();
});