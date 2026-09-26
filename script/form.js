// =============================================================
// RSVP form: dynamic fields, validation, submission,
// confirmation modal, shareable card image and calendar file
// =============================================================

// ---------- State ----------
let lastSubmission = {};
let formSubmitted = false;
let cardBlobPromise = null; // pre-rendered confirmation card image (PNG)
let closedWithX = false;

// ---------- Element references ----------
const rsvpForm = document.getElementById("rsvp-form");
const nameInput = document.getElementById("name");
const invitedBySelect = document.getElementById("invitedBy");
const attendingSelect = document.getElementById("attending");
const attendingFields = document.getElementById("attending-fields");
const regretsField = document.getElementById("regrets-field");
const phoneInput = document.getElementById("phone");
const phoneError = document.getElementById("phone-error");
const guestsInput = document.getElementById("guests");
const guestNamesContainer = document.getElementById("guest-names-fields");
const hasChildrenCheckbox = document.getElementById("has-children");
const childrenWrapper = document.getElementById("children-wrapper");
const childrenInput = document.getElementById("children");
const babychairWrapper = document.getElementById("babychair-wrapper");
const babychairSelect = document.getElementById("babychair");
const messageInput = document.getElementById("message");
const modalEl = document.getElementById("confirmationModal");

// ---------- Constants ----------
const VENUE_MAPS = {
   googleMaps: "https://maps.google.com/?q=Xin+Cuisine+Chinese+Restaurant+Concorde+Hotel+Kuala+Lumpur",
   waze: "https://waze.com/ul?q=Concorde+Hotel+Kuala+Lumpur",
};

const SHARE_TITLE = "Jason & Ada's Wedding RSVP";

const MEAL_KEYS = {
   "Non-Halal": "formMealNonHalal",
   Halal: "formMealHalal",
   Vegetarian: "formMealVegetarian",
};

// =============================================================
// Helpers
// =============================================================

// Translate a key (returns HTML: Chinese text is wrapped by formatZH)
function t(key) {
   const raw = translations[currentLang]?.[key] || translations.en[key] || key;
   return currentLang === "zh" ? formatZH(raw) : raw;
}

// Plain-text translation (no HTML), for share text, alerts, etc.
function tPlain(key) {
   return translations[currentLang]?.[key] || translations.en[key] || key;
}

// Escape anything a guest typed before it goes into HTML
function escapeHTML(value) {
   const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
   return String(value ?? "").replace(/[&<>"']/g, (c) => map[c]);
}

// Guest-typed text, escaped, with Chinese styling applied when needed
function displayText(value) {
   const safe = escapeHTML(value);
   return currentLang === "zh" ? formatZH(safe) : safe;
}

function refreshRowHeights() {
   if (typeof matchRowHeights === "function") matchRowHeights();
}

function setHidden(id, value) {
   document.getElementById(id).value = value;
}

function getGuestCount() {
   return Math.max(1, parseInt(guestsInput.value, 10) || 1);
}

function getChildrenCount() {
   return Math.max(0, parseInt(childrenInput.value, 10) || 0);
}

// =============================================================
// Attending: Yes / No sections
// =============================================================

attendingSelect.addEventListener("change", () => {
   const value = attendingSelect.value;
   attendingFields.style.display = value === "yes" ? "block" : "none";
   regretsField.style.display = value === "no" ? "block" : "none";

   if (value !== "yes") {
      guestNamesContainer.innerHTML = "";
      guestsInput.value = 1;
      resetChildren();
   }
});

// =============================================================
// Guest 2+ name and meal fields
// =============================================================

function renderGuestNames() {
   const count = getGuestCount();

   // Keep what was already typed/selected when the guest count changes
   const previousNames = Array.from(guestNamesContainer.querySelectorAll(".guest-name-input"), (el) => el.value);
   const previousMeals = Array.from(guestNamesContainer.querySelectorAll(".dietary-select"), (el) => el.value);

   let html = "";
   for (let i = 2; i <= count; i++) {
      const savedName = escapeHTML(previousNames[i - 2] || "");
      const savedMeal = previousMeals[i - 2] || "";
      const selected = (meal) => (savedMeal === meal ? "selected" : "");

      html += `
         <div class="mb-3">
            <h3 class="mb-2">${t("formGuestTitle").replace("{n}", i)}</h3>
            <div class="row">
               <div class="col-6">
                  <label data-i18n="formGuestsName"></label>
                  <input type="text" class="guest-name-input" data-guest="${i}" value="${savedName}" required>
               </div>
               <div class="col-6">
                  <label data-i18n="formMealLabel"></label>
                  <select class="dietary-select" id="dietary-select-${i}" data-guest="${i}">
                     <option value="Select" data-i18n="formMealSelect"></option>
                     <option value="Non-Halal" ${selected("Non-Halal")} data-i18n="formMealNonHalal"></option>
                     <option value="Halal" ${selected("Halal")} data-i18n="formMealHalal"></option>
                     <option value="Vegetarian" ${selected("Vegetarian")} data-i18n="formMealVegetarian"></option>
                  </select>
               </div>
            </div>
         </div>`;
   }

   guestNamesContainer.innerHTML = html;
   applyTranslations(currentLang);
   refreshRowHeights();
}

// Meal choice for every guest, as [{ name, meal }]
function getGuestMeals() {
   const mealOf = (select) => (select && select.value !== "Select" ? select.value : "None");
   const meals = [{ name: nameInput.value.trim() || "Guest 1", meal: mealOf(document.getElementById("dietary-select-1")) }];

   for (let i = 2; i <= getGuestCount(); i++) {
      const input = guestNamesContainer.querySelector(`.guest-name-input[data-guest="${i}"]`);
      meals.push({
         name: input?.value.trim() || `Guest ${i}`,
         meal: mealOf(document.getElementById(`dietary-select-${i}`)),
      });
   }
   return meals;
}

// =============================================================
// Phone number
// =============================================================

// 11 digits → 6012-345 6789, 12 digits → 6011-1234 5678
function formatPhone(digits) {
   if (digits.length <= 4) return digits;
   const midLength = digits.length === 12 ? 4 : 3;
   const mid = digits.slice(4, 4 + midLength);
   const rest = digits.slice(4 + midLength);
   return `${digits.slice(0, 4)}-${mid}${rest ? " " + rest : ""}`;
}

function isValidPhone() {
   const length = phoneInput.value.replace(/\D/g, "").length;
   return length === 11 || length === 12;
}

phoneInput.addEventListener("input", () => {
   phoneInput.value = formatPhone(phoneInput.value.replace(/\D/g, "").slice(0, 12));
   if (isValidPhone()) phoneError.style.display = "none";
});

// =============================================================
// Children and baby chairs
// =============================================================

function resetChildren() {
   hasChildrenCheckbox.checked = false;
   childrenInput.value = 0;
   childrenInput.disabled = true;
   childrenWrapper.style.display = "none";
   babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo"></option>`;
   babychairWrapper.style.display = "none";
   applyTranslations(currentLang);
   refreshRowHeights();
}

// Chinese-only font sizing for the baby chair select
function updateBabyChairFontSize() {
   if (currentLang !== "zh") {
      babychairSelect.style.fontSize = "";
      return;
   }
   babychairSelect.style.fontSize = babychairSelect.value === "0" ? "1.5rem" : "1rem";
}

function renderBabyChairOptions() {
   const kids = getChildrenCount();
   const previousValue = babychairSelect.value;

   let options = `<option value="0" data-i18n="formBabyChairNo"></option>`;
   for (let i = 1; i <= kids; i++) options += `<option value="${i}">${i}</option>`;
   babychairSelect.innerHTML = options;

   const stillValid = previousValue && Number(previousValue) <= kids;
   babychairSelect.value = stillValid ? previousValue : "0";
   babychairWrapper.style.display = kids > 0 ? "block" : "none";

   applyTranslations(currentLang);
   updateBabyChairFontSize();
   refreshRowHeights();
}

hasChildrenCheckbox.addEventListener("change", () => {
   if (!hasChildrenCheckbox.checked) {
      resetChildren();
      return;
   }
   childrenWrapper.style.display = "block";
   childrenInput.disabled = false;
   if (getChildrenCount() === 0) childrenInput.value = 1;
   renderBabyChairOptions();
});

childrenInput.addEventListener("input", renderBabyChairOptions);

babychairSelect.addEventListener("change", () => {
   updateBabyChairFontSize();
   setTimeout(refreshRowHeights, 10);
});

// =============================================================
// Validation and submission
// =============================================================

function fail(message, focusEl) {
   if (message) alert(message);
   focusEl?.focus();
   return false;
}

function validateForm(attending) {
   if (!nameInput.value.trim()) return fail("Please enter your name.", nameInput);
   if (!invitedBySelect.value) return fail("Please let us know which side you're invited by.", invitedBySelect);
   if (!attending) return fail("Please let us know if you'll be attending.", attendingSelect);

   if (attending === "yes") {
      if (!isValidPhone()) {
         phoneError.style.display = "block";
         return fail(null, phoneInput);
      }

      const guest1Select = document.getElementById("dietary-select-1");
      if (!guest1Select.value || guest1Select.value === "Select") {
         return fail("Please select a meal preference.", guest1Select);
      }

      const emptyName = Array.from(guestNamesContainer.querySelectorAll(".guest-name-input")).find((el) => !el.value.trim());
      if (emptyName) return fail("Please fill in all guest names.", emptyName);
   }

   return true;
}

rsvpForm.addEventListener("submit", (e) => {
   const attending = attendingSelect.value;
   if (!validateForm(attending)) {
      e.preventDefault();
      return;
   }

   const isYes = attending === "yes";
   const phoneDigits = phoneInput.value.replace(/\D/g, "");
   const guestNames = isYes
      ? Array.from(guestNamesContainer.querySelectorAll(".guest-name-input"), (el) => el.value.trim())
      : [];
   const meals = isYes ? getGuestMeals() : [];

   lastSubmission = {
      name: nameInput.value.trim(),
      attending,
      guests: isYes ? String(getGuestCount()) : "",
      guestNames: guestNames.join(", "),
      children: isYes ? String(getChildrenCount()) : "0",
      babychair: isYes ? babychairSelect.value : "0",
      meals,
      message: attending === "no" ? messageInput.value.trim() : "",
   };

   // Copy values into the hidden fields that get posted to Google Sheets
   setHidden("name-hidden", lastSubmission.name);
   setHidden("invitedBy-hidden", invitedBySelect.value);
   setHidden("phone-hidden", isYes && phoneDigits ? "+" + phoneDigits : "");
   setHidden("attending-hidden", attending);
   setHidden("guests-hidden", lastSubmission.guests);
   setHidden("guestnames-hidden", lastSubmission.guestNames);
   setHidden("meals-hidden", meals.map((m) => `${m.name}: ${m.meal}`).join(", "));
   setHidden("children-hidden", isYes ? lastSubmission.children : "");
   setHidden("babychair-hidden", lastSubmission.babychair);
   setHidden("message-hidden", lastSubmission.message);

   const submitBtn = rsvpForm.querySelector('button[type="submit"]');
   submitBtn.disabled = true;
   submitBtn.innerHTML = t("buttonSubmitting");

   formSubmitted = true;
});

// Runs when Google Apps Script responds inside the hidden iframe
function handleSubmitResponse() {
   if (!formSubmitted) return;
   formSubmitted = false;

   const submitBtn = rsvpForm.querySelector('button[type="submit"]');
   submitBtn.disabled = false;
   submitBtn.innerHTML = t("buttonSubmit");

   buildConfirmationModal(lastSubmission);

   // Render the card image as soon as the modal is visible, so Share is instant
   cardBlobPromise = null;
   modalEl.addEventListener("shown.bs.modal", () => getCardBlob().catch(() => {}), { once: true });

   bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: "static", // clicking outside won't close it
      keyboard: false, // Esc won't close it
   }).show();

   resetForm();
}

function resetForm() {
   rsvpForm.reset();
   attendingFields.style.display = "none";
   regretsField.style.display = "none";
   phoneError.style.display = "none";
   guestNamesContainer.innerHTML = "";
   resetChildren();
}

// =============================================================
// Confirmation modal
// =============================================================

function translateMeal(meal) {
   return t(MEAL_KEYS[meal] || "mealNone");
}

function summaryRow(labelKey, valueHtml) {
   return `
      <div class="d-flex justify-content-between py-2 summary-row">
         <div class="col"><span class="summary-label fw-bold">${t(labelKey)}</span></div>
         <div class="col-7 text-end"><span class="summary-value">${valueHtml}</span></div>
      </div>`;
}

function buildConfirmationModal(data) {
   const isYes = data.attending === "yes";
   let rows = "";

   if (isYes) {
      rows += summaryRow("summaryLabelAttending", t("formAttendyes"));
      rows += summaryRow("summaryLabelGuests", displayText(data.guests));
      if (data.guestNames) rows += summaryRow("summaryLabelGuestNames", displayText(data.guestNames));
      if (parseInt(data.children, 10) > 0) rows += summaryRow("summaryLabelChildren", displayText(data.children));
      if (data.babychair !== "0") rows += summaryRow("summaryLabelBabyChairs", displayText(data.babychair));

      const mealBadges = data.meals
         .map((m) => `<span class="meal-badge">${displayText(m.name)}: ${translateMeal(m.meal)}</span>`)
         .join("");

      rows += `
         <div class="py-3 summary-row mb-2">
            <span class="summary-label fw-bold">${t("summaryLabelMeals")}</span>
            <div class="mt-2 d-flex gap-2 flex-wrap">${mealBadges}</div>
         </div>`;
   } else {
      rows += summaryRow("summaryLabelAttending", t("formAttendno"));
      rows += summaryRow("summaryLabelMessage", displayText(data.message) || "—");
   }

   document.getElementById("modal-summary-container").innerHTML =
      `<h6 class="mb-2">${displayText(data.name)}, ${t("thankingRSVP")}</h6>${rows}`;

   // Confirmation card (the shared image): directions and parking, for attendees only.
   // No loading="lazy" here: the card sits off-screen and lazy images may never load.
   document.getElementById("card-details").innerHTML = isYes
      ? `
         <h6 data-i18n="gettingThere" class="mb-1"></h6>
         <div class="d-flex align-items-start location gap-2 mb-3">
            <img src="Assets/maps.avif" alt="Map">
            <div>
               <span data-i18n="locationTitle"></span>
               <p class="small" data-i18n="locationFullAddress"></p>
            </div>
         </div>
         <div>
            <img src="Assets/parking-map.avif" alt="Parking map" class="w-100 mb-2">
            <ol class="parking-steps small">
               <li data-i18n="modalParkingStep1"></li>
               <li data-i18n="modalParkingStep2"></li>
               <li data-i18n="modalParkingStep3"></li>
            </ol>
         </div>`
      : "";

   applyTranslations(currentLang);

   const shareText = buildShareText();
   document.getElementById("share-response-btn").onclick = (e) => {
      e.preventDefault();
      shareSummary(shareText);
   };
}

// Plain-text version of the summary, plus venue links, for sharing
function buildShareText() {
   const lines = Array.from(document.querySelectorAll("#modal-summary-container .summary-row"), (row) => {
      const label = row.querySelector(".summary-label")?.innerText.trim();
      const value =
         row.querySelector(".summary-value")?.innerText.trim() ||
         Array.from(row.querySelectorAll(".meal-badge"), (badge) => badge.innerText.trim()).join(", ");
      return `${label}: ${value}`;
   });

   return `${lines.join("\n")}\n\n📍 ${tPlain("shareVenueLocation")}:\nGoogle Maps: ${VENUE_MAPS.googleMaps}\n\nWaze: ${VENUE_MAPS.waze}`;
}

// =============================================================
// Confirmation card image and sharing
// =============================================================

// html2canvas ignores CSS `filter`, so apply each image's filter to its pixels in the clone
function bakeFilteredImages(clonedDoc) {
   const originals = document.querySelectorAll("#confirmation-card img");
   const clones = clonedDoc.querySelectorAll("#confirmation-card img");

   originals.forEach((img, i) => {
      const filter = getComputedStyle(img).filter;
      if (!filter || filter === "none" || !img.complete || !img.naturalWidth) return;

      try {
         const canvas = document.createElement("canvas");
         canvas.width = img.naturalWidth;
         canvas.height = img.naturalHeight;
         const ctx = canvas.getContext("2d");

         if ("filter" in ctx) {
            // Chrome, Firefox, newer Safari: apply the exact same CSS filter
            ctx.filter = filter;
            ctx.drawImage(img, 0, 0);
         } else {
            // Older Safari fallback: paint every visible pixel white
            ctx.drawImage(img, 0, 0);
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
         }

         clones[i].src = canvas.toDataURL("image/png");
         clones[i].style.filter = "none";
      } catch (err) {
         console.warn("Could not bake filter for image:", img.src, err);
      }
   });
}

function captureCard() {
   return html2canvas(document.getElementById("confirmation-card"), {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (clonedDoc) => {
         const clonedCard = clonedDoc.getElementById("confirmation-card");
         clonedCard.style.position = "static";
         clonedCard.style.left = "0";
         bakeFilteredImages(clonedDoc);
      },
   });
}

function renderCardBlob() {
   const imgs = Array.from(document.querySelectorAll("#confirmation-card img"));
   return Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => {}))))
      .then(captureCard)
      .then(
         (canvas) =>
            new Promise((resolve, reject) =>
               canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))), "image/png"),
            ),
      );
}

function getCardBlob() {
   if (!cardBlobPromise) cardBlobPromise = renderCardBlob();
   return cardBlobPromise;
}

async function shareSummary(summaryText) {
   try {
      const blob = await getCardBlob();
      const file = new File([blob], "RSVP-Confirmation.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
         await navigator.share({ files: [file], title: SHARE_TITLE, text: summaryText });
      } else if (navigator.share) {
         await navigator.share({ title: SHARE_TITLE, text: summaryText });
      } else {
         await navigator.clipboard.writeText(summaryText);
         alert("Copied to clipboard — you can now paste and share it.");
      }
   } catch (err) {
      if (err.name !== "AbortError") console.error("Share failed:", err); // AbortError = guest closed the share sheet
   }
}

// =============================================================
// Add to Calendar (.ics with reminders)
// =============================================================

function downloadICSFile() {
   const event = {
      title: "Jason & Ada's Wedding",
      description: "Join us in celebrating the wedding of Jason and Ada!",
      location: "Xin Cuisine Chinese Restaurant, Concorde Hotel",
      startDate: "20261212T190000", // adjust event start date/time as needed
      endDate: "20261212T220000",
   };

   const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

   const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jason and Ada Wedding RSVP//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:jason-ada-wedding-20261212@rsvp",
      `DTSTAMP:${stamp}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      `DTSTART:${event.startDate}`,
      `DTEND:${event.endDate}`,
      "STATUS:CONFIRMED",

      // Reminder 1: 1 week before
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Jason & Ada's Wedding is in 1 week!",
      "TRIGGER:-P7D",
      "END:VALARM",

      // Reminder 2: 1 day before
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Jason & Ada's Wedding is tomorrow!",
      "TRIGGER:-P1D",
      "END:VALARM",

      "END:VEVENT",
      "END:VCALENDAR",
   ].join("\r\n");

   const url = URL.createObjectURL(new Blob([icsData], { type: "text/calendar;charset=utf-8" }));
   const link = document.createElement("a");
   link.href = url;
   link.download = "Jason-Ada-Wedding.ics";
   document.body.appendChild(link);
   link.click();
   link.remove();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =============================================================
// Event wiring and initial state
// =============================================================

document.querySelector('iframe[name="hidden-iframe"]').addEventListener("load", handleSubmitResponse);

guestsInput.addEventListener("input", renderGuestNames);

document.getElementById("add-calendar-btn")?.addEventListener("click", (e) => {
   e.preventDefault();
   downloadICSFile();
});

// The modal only closes via the X; closing it refreshes the page
modalEl.querySelector(".btn-close").addEventListener("click", () => {
   closedWithX = true;
});
modalEl.addEventListener("hidden.bs.modal", () => {
   if (closedWithX) window.location.reload();
});

childrenInput.disabled = true;
renderGuestNames();
renderBabyChairOptions();