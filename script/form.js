let lastSubmission = {};
let formSubmitted = false;

// Element references
const attendingSelect = document.getElementById("attending");
const attendingFields = document.getElementById("attending-fields");
const regretsField = document.getElementById("regrets-field");
const guestsInput = document.getElementById("guests");
const guestNamesContainer = document.getElementById("guest-names-fields");
const hasChildrenCheckbox = document.getElementById("has-children");
const childrenWrapper = document.getElementById("children-wrapper");
const childrenInput = document.getElementById("children");
const babychairWrapper = document.getElementById("babychair-wrapper");
const babychairSelect = document.getElementById("babychair");

// Venue location links
const VENUE_MAPS = {
   googleMaps: "https://maps.google.com/?q=Xin+Cuisine+Chinese+Restaurant+Concorde+Hotel+Kuala+Lumpur",
   waze: "https://waze.com/ul?q=Concorde+Hotel+Kuala+Lumpur",
};

document.querySelector('iframe[name="hidden-iframe"]').addEventListener("load", handleSubmitResponse);

// Show/hide Yes/No sections
attendingSelect.addEventListener("change", (e) => {
   const isYes = e.target.value === "yes";
   attendingFields.style.display = isYes ? "block" : "none";
   regretsField.style.display = e.target.value === "no" ? "block" : "none";

   if (!isYes) {
      guestNamesContainer.innerHTML = "";
      guestsInput.value = 1;
      hasChildrenCheckbox.checked = false;
      childrenInput.value = 0;
      childrenInput.disabled = true;
      childrenWrapper.style.display = "none";
      babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo">No</option>`;
      babychairWrapper.style.display = "none";
      applyTranslations(currentLang);
   }
});

// Guest 2+ name + meal preference fields
function renderGuestNames() {
   const count = parseInt(guestsInput.value) || 1;
   const previousNames = Array.from(document.querySelectorAll(".guest-name-input")).map((input) => input.value);
   const previousMeals = Array.from(document.querySelectorAll(".dietary-select"))
      .filter((sel) => sel.dataset.guest !== "1")
      .map((sel) => sel.value);

   guestNamesContainer.innerHTML = "";

   for (let i = 2; i <= count; i++) {
      const savedName = previousNames[i - 2] || "";
      const savedMeal = previousMeals[i - 2] || "";
      const guestTitle = t("formGuestTitle").replace("{n}", i);

      guestNamesContainer.innerHTML += `
    <div class="mb-3">
    <h3>${guestTitle}</h3>
    <div class="row">
    <div class="col-6">
      <label data-i18n="formGuestsName"></label>
      <input type="text" class="guest-name-input" data-guest="${i}" value="${savedName}" required>
      </div>

      <div class="col-6">
      <label data-i18n="formMealLabel"></label>
      <select class="dietary-select" id="dietary-select-${i}" data-guest="${i}">
        <option value="Select" data-i18n="formMealSelect"></option>
        <option value="Non-Halal" ${savedMeal === "Non-Halal" ? "selected" : ""} data-i18n="formMealNonHalal"></option>
        <option value="Halal" ${savedMeal === "Halal" ? "selected" : ""} data-i18n="formMealHalal"></option>
        <option value="Vegetarian" ${savedMeal === "Vegetarian" ? "selected" : ""} data-i18n="formMealVegetarian"></option>
      </select>
      </div>
      </div>
      </div>
    `;
   }

   applyTranslations(currentLang);
   if (typeof matchRowHeights === "function") {
      matchRowHeights();
   }
}

guestsInput.addEventListener("input", renderGuestNames);
renderGuestNames();

const phoneInput = document.getElementById("phone");

phoneInput.addEventListener("input", (e) => {
   let digits = e.target.value.replace(/\D/g, "");
   digits = digits.substring(0, 11);

   let formatted = "";
   if (digits.length > 0) formatted += digits.substring(0, 4);
   if (digits.length > 4) formatted += "-" + digits.substring(4, 7);
   if (digits.length > 7) formatted += " " + digits.substring(7, 11);

   e.target.value = formatted;
});

const phoneError = document.getElementById("phone-error");

function isValidPhone() {
   const digits = phoneInput.value.replace(/\D/g, "");
   return digits.length === 11 || digits.length === 12;
}

phoneInput.addEventListener("input", () => {
   if (isValidPhone()) phoneError.style.display = "none";
});

function buildMealsString(guestCount) {
   const meals = [];
   const normalizeMeal = (value) => (!value || value === "Select" ? "None" : value);

   const guest1Name = document.getElementById("name").value || "Guest 1";
   const guest1Select = document.getElementById("dietary-select-1");
   meals.push(`${guest1Name}: ${normalizeMeal(guest1Select ? guest1Select.value : "")}`);

   for (let i = 2; i <= guestCount; i++) {
      const nameInput = document.querySelector(`.guest-name-input[data-guest="${i}"]`);
      const select = document.getElementById(`dietary-select-${i}`);
      const guestName = nameInput && nameInput.value ? nameInput.value : `Guest ${i}`;
      meals.push(`${guestName}: ${normalizeMeal(select ? select.value : "")}`);
   }

   return meals.join(", ");
}

hasChildrenCheckbox.addEventListener("change", (e) => {
   const checked = e.target.checked;
   childrenWrapper.style.display = checked ? "block" : "none";

   if (checked) {
      childrenInput.disabled = false;
      if (!childrenInput.value || parseInt(childrenInput.value, 10) === 0) childrenInput.value = 1;
      renderBabyChairOptions();
   } else {
      childrenInput.value = 0;
      childrenInput.disabled = true;
      babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo">No</option>`;
      babychairWrapper.style.display = "none";
      applyTranslations(currentLang);
   }
});

childrenInput.disabled = true;
renderBabyChairOptions();

babychairSelect.addEventListener("change", (e) => {
   if (currentLang === "zh") {
      e.target.style.fontSize = e.target.value === "0" ? "1.5rem" : "1rem";
   } else {
      e.target.style.fontSize = "";
   }

   if (typeof matchRowHeights === "function") {
      setTimeout(matchRowHeights, 10);
   }
});

function renderBabyChairOptions() {
   const kids = parseInt(childrenInput.value) || 0;
   const previousValue = babychairSelect.value;

   babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo">${t("formBabyChairNo")}</option>`;

   for (let i = 1; i <= kids; i++) {
      babychairSelect.innerHTML += `<option value="${i}">${i}</option>`;
   }

   const stillValid = Array.from(babychairSelect.options).some((opt) => opt.value === previousValue);
   babychairSelect.value = stillValid ? previousValue : "0";

   babychairWrapper.style.display = kids > 0 ? "block" : "none";

   applyTranslations(currentLang);

   if (currentLang === "zh") {
      babychairSelect.style.fontSize = babychairSelect.value === "0" ? "1.5rem" : "1rem";
   }

   if (typeof matchRowHeights === "function") {
      matchRowHeights();
   }
}

childrenInput.addEventListener("input", renderBabyChairOptions);

document.getElementById("rsvp-form").addEventListener("submit", (e) => {
   const nameValue = document.getElementById("name").value.trim();
   const invitedByValue = document.getElementById("invitedBy").value;
   const attending = attendingSelect.value;

   if (!nameValue) {
      e.preventDefault();
      alert("Please enter your name.");
      return;
   }

   if (!invitedByValue) {
      e.preventDefault();
      alert("Please let us know which side you're invited by.");
      return;
   }

   if (!attending) {
      e.preventDefault();
      alert("Please let us know if you'll be attending.");
      return;
   }

   if (attending === "yes") {
      if (!isValidPhone()) {
         e.preventDefault();
         phoneError.style.display = "block";
         phoneInput.focus();
         return;
      }

      const guest1Select = document.getElementById("dietary-select-1");
      const guest1Meal = guest1Select ? guest1Select.value : "";
      if (!guest1Meal || guest1Meal === "Select") {
         e.preventDefault();
         alert("Please select a meal preference.");
         return;
      }

      const guestNameInputs = document.querySelectorAll(".guest-name-input");
      for (const input of guestNameInputs) {
         if (!input.value.trim()) {
            e.preventDefault();
            alert("Please fill in all guest names.");
            input.focus();
            return;
         }
      }
   }

   document.getElementById("name-hidden").value = document.getElementById("name").value;
   document.getElementById("invitedBy-hidden").value = document.getElementById("invitedBy").value;
   const phoneDigits = phoneInput.value.replace(/\D/g, "");
   document.getElementById("phone-hidden").value = attending === "yes" && phoneDigits ? "+" + phoneDigits : "";
   document.getElementById("attending-hidden").value = attending;
   document.getElementById("guests-hidden").value = attending === "yes" ? guestsInput.value : "";
   document.getElementById("guestnames-hidden").value =
      attending === "yes"
         ? Array.from(document.querySelectorAll(".guest-name-input"))
              .map((input) => input.value)
              .join(", ")
         : "";

   document.getElementById("meals-hidden").value = attending === "yes" ? buildMealsString(parseInt(guestsInput.value) || 1) : "";
   document.getElementById("children-hidden").value = attending === "yes" ? childrenInput.value : "";

   document.getElementById("babychair-hidden").value = attending === "yes" ? babychairSelect.value : "0";

   document.getElementById("message-hidden").value = attending === "no" ? document.getElementById("message").value : "";

   lastSubmission = {
      name: document.getElementById("name").value,
      attending: attending,
      guests: attending === "yes" ? guestsInput.value : "",
      guestNames:
         attending === "yes"
            ? Array.from(document.querySelectorAll(".guest-name-input"))
                 .map((i) => i.value)
                 .join(", ")
            : "",
      children: attending === "yes" ? childrenInput.value : "0",
      babychair: attending === "yes" ? babychairSelect.value : "0",
      meals: attending === "yes" ? buildMealsString(parseInt(guestsInput.value) || 1) : "",
      message: attending === "no" ? document.getElementById("message").value : "",
   };

   const submitBtn = e.target.querySelector('button[type="submit"]');
   submitBtn.disabled = true;
   submitBtn.innerHTML = t("buttonSubmitting");

   formSubmitted = true;
});

function handleSubmitResponse() {
   if (formSubmitted) {
      const submitBtn = document.querySelector('#rsvp-form button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = t("buttonSubmit");

      buildConfirmationModal(lastSubmission);
      const modal = new bootstrap.Modal(document.getElementById("confirmationModal"));
      modal.show();

      document.getElementById("rsvp-form").reset();
      attendingFields.style.display = "none";
      regretsField.style.display = "none";
      childrenWrapper.style.display = "none";
      babychairWrapper.style.display = "none";
      guestNamesContainer.innerHTML = "";
      childrenInput.disabled = true;
      formSubmitted = false;
   }
}

function t(key) {
   const raw = (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
   return currentLang === "zh" ? formatZH(raw) : raw;
}

function translateMealValue(rawValue) {
   switch (rawValue) {
      case "Non-Halal":
         return t("formMealNonHalal");
      case "Halal":
         return t("formMealHalal");
      case "Vegetarian":
         return t("formMealVegetarian");
      default:
         return t("mealNone");
   }
}

function buildConfirmationModal(data) {
   const summaryContainer = document.getElementById("modal-summary-container");
   const cardDetails = document.getElementById("card-details");

   const summaryRow = (labelKey, value) => `
   <div class="d-flex justify-content-between py-2 summary-row">
   <div class="col">
   <span class="summary-label fw-bold">${t(labelKey)}</span>
   </div>
   <div class="col-7 text-end">
   <span class="summary-value">${value}</span>
   </div>
   </div>
	`;

   let modalRowsHtml = "";

   if (data.attending === "yes") {
      modalRowsHtml += summaryRow("summaryLabelAttending", t("formAttendyes"));
      modalRowsHtml += summaryRow("summaryLabelGuests", data.guests);
      if (data.guestNames) {
         modalRowsHtml += summaryRow("summaryLabelGuestNames", data.guestNames);
      }
      if (parseInt(data.children) > 0) {
         modalRowsHtml += summaryRow("summaryLabelChildren", data.children);
      }
      if (data.babychair !== "0") {
         modalRowsHtml += summaryRow("summaryLabelBabyChairs", data.babychair);
      }

      const mealsArray = data.meals ? data.meals.split(", ") : [];
      const mealBadges = mealsArray
         .map((m) => {
            const separatorIndex = m.indexOf(": ");
            let guestName = separatorIndex > -1 ? m.slice(0, separatorIndex) : m;
            const rawMealValue = separatorIndex > -1 ? m.slice(separatorIndex + 2) : "";

            if (currentLang === "zh") {
               guestName = formatZH(guestName);
            }

            return `<span class="meal-badge">${guestName}: ${translateMealValue(rawMealValue)}</span>`;
         })
         .join("");
      const mealsBlock = `
			<div class="py-3 summary-row mb-2">
				<span class="summary-label fw-bold">${t("summaryLabelMeals")}</span>
				<div class="mt-2 d-flex gap-2 flex-wrap">${mealBadges}</div>
			</div>
		`;
      modalRowsHtml += mealsBlock;
   } else {
      modalRowsHtml += summaryRow("summaryLabelAttending", t("formAttendno"));
      modalRowsHtml += summaryRow("summaryLabelMessage", data.message || "—");
   }

   const displayName = currentLang === "zh" ? formatZH(data.name) : data.name;
   const thankYouHeading = `<h6 class="mb-2">${displayName}, ${t("thankingRSVP")}</h6>`;

   // Populate modal summary with full submission details
   summaryContainer.innerHTML = `${thankYouHeading}${modalRowsHtml}`;

   // Populate confirmation card: Parking Info only
   let cardHtml = "";
   if (data.attending === "yes") {
      cardHtml = `
         <h6 data-i18n="gettingThere" class="mb-1"></h6>
<div class="d-flex align-items-start location gap-2 mb-3">
    <img loading="lazy" src="Assets/maps.avif" alt="Map">
    <div>
        <span data-i18n="locationTitle"></span>
        <p class="small" data-i18n="locationFullAddress"></p>
    </div>
</div>

    <div>
        <img src="Assets/parking-map.avif" alt="Map" class="w-100 mb-2" />
        <ol class="parking-steps small">
            <li>${t("modalParkingStep1")}</li>
            <li>${t("modalParkingStep2")}</li>
            <li>${t("modalParkingStep3")}</li>
        </ol>
    </div>
		`;
   }
   cardDetails.innerHTML = cardHtml;
   applyTranslations(currentLang);

   // Build plain-text summary + location links for sharing
   const plainSummary = Array.from(document.querySelectorAll("#modal-summary-container .summary-row"))
      .map((row) => {
         const label = row.querySelector(".summary-label")?.innerText.trim();
         const value =
            row.querySelector(".summary-value")?.innerText.trim() ||
            Array.from(row.querySelectorAll(".meal-badge"))
               .map((b) => b.innerText)
               .join(", ");
         return `${label}: ${value}`;
      })
      .join("\n");

   const shareTextWithLocation = `${plainSummary}\n\n📍 Venue Location:\nGoogle Maps: ${VENUE_MAPS.googleMaps}\nWaze: ${VENUE_MAPS.waze}`;

   document.getElementById("download-response-btn").onclick = downloadCardAsImage;
   document.getElementById("share-response-btn").onclick = () => shareSummary(shareTextWithLocation);

   const googleMapsBtn = document.getElementById("open-google-maps-btn");
   const wazeBtn = document.getElementById("open-waze-btn");
   if (googleMapsBtn && wazeBtn) {
      const showMapButtons = data.attending === "yes";
      googleMapsBtn.style.display = showMapButtons ? "inline-block" : "none";
      wazeBtn.style.display = showMapButtons ? "inline-block" : "none";
      googleMapsBtn.href = VENUE_MAPS.googleMaps;
      wazeBtn.href = VENUE_MAPS.waze;
   }
}

function downloadCardAsImage() {
   html2canvas(document.getElementById("confirmation-card"), {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (clonedDoc) => {
         const clonedCard = clonedDoc.getElementById("confirmation-card");
         clonedCard.style.position = "static";
         clonedCard.style.left = "0";
      },
   }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "rsvp-confirmation.png";
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
   });
}

// Share confirmation card image along with details & location links
function shareSummary(summaryText) {
   const card = document.getElementById("confirmation-card");

   html2canvas(card, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (clonedDoc) => {
         const clonedCard = clonedDoc.getElementById("confirmation-card");
         clonedCard.style.position = "static";
         clonedCard.style.left = "0";
      },
   }).then((canvas) =>
      canvas.toBlob(
         (blob) => {
            const file = new File([blob], "RSVP-Confirmation.png", { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
               navigator.share({ files: [file], title: "Jason & Ada's Wedding RSVP", text: summaryText });
            } else if (navigator.share) {
               navigator.share({ title: "Jason & Ada's Wedding RSVP", text: summaryText });
            } else {
               navigator.clipboard.writeText(summaryText);
               alert("Copied to clipboard — you can now paste and share it.");
            }
         },
         "image/png",
         1.0,
      ),
   );
}

// Function to generate and download .ics file with reminders
function downloadICSFile() {
   const event = {
      title: "Jason & Ada's Wedding",
      description: "Join us in celebrating the wedding of Jason and Ada!",
      location: "Xin Cuisine Chinese Restaurant, Concorde Hotel",
      startDate: "20261212T190000", // Adjust event start date/time as needed
      endDate: "20261212T220000",
   };

   const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jason and Ada Wedding RSVP//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      `DTSTART:${event.startDate}`,
      `DTEND:${event.endDate}`,
      "STATUS:CONFIRMED",

      // Reminder 1: 1 week before (7 days)
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

   const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
   const link = document.createElement("a");
   link.href = window.URL.createObjectURL(blob);
   link.setAttribute("download", "Jason-Ada-Wedding.ics");
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

// Attach ICS download listener on DOM load
document.addEventListener("DOMContentLoaded", () => {
   const calendarBtn = document.getElementById("add-calendar-btn");
   if (calendarBtn) {
      calendarBtn.addEventListener("click", (e) => {
         e.preventDefault();
         downloadICSFile();
      });
   }
});
