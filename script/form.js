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
const babychairCountWrapper = document.getElementById("babychair-count-wrapper");
const babychairCount = document.getElementById("babychair-count");

document.querySelector('iframe[name="hidden-iframe"]').addEventListener("load", handleSubmitResponse);

// Show/hide Yes/No sections
attendingSelect.addEventListener("change", (e) => {
	const isYes = e.target.value === "yes";
	attendingFields.style.display = isYes ? "block" : "none";
	regretsField.style.display = e.target.value === "no" ? "block" : "none";
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
		guestNamesContainer.innerHTML += `
    <div class="mb-3">
    <h3>Guest ${i}</h3>
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

	applyTranslations(currentLang); // re-translate the newly injected elements
}

guestsInput.addEventListener("input", renderGuestNames);
renderGuestNames(); // run once on load

const phoneInput = document.getElementById("phone");

phoneInput.addEventListener("input", (e) => {
	let digits = e.target.value.replace(/\D/g, ""); // strip anything non-numeric
	digits = digits.substring(0, 11); // 60 + 9-digit number = 11 digits max

	let formatted = "";
	if (digits.length > 0) formatted += digits.substring(0, 4); // "6012"
	if (digits.length > 4) formatted += "-" + digits.substring(4, 7); // "-242"
	if (digits.length > 7) formatted += " " + digits.substring(7, 11); // " 8188"

	e.target.value = formatted;
});

const phoneError = document.getElementById("phone-error");

function isValidPhone() {
	const digits = phoneInput.value.replace(/\D/g, "");
	// Malaysian mobile: 60 + 9 digits (11 total) or 60 + 10 digits for 011-prefix numbers (12 total)
	return digits.length === 11 || digits.length === 12;
}

// Clear the error as soon as they fix it, so it doesn't stay stuck red
phoneInput.addEventListener("input", () => {
	if (isValidPhone()) phoneError.style.display = "none";
});

// Build the per-guest meal string for submission
function buildMealsString(guestCount) {
  const meals = [];
  const normalizeMeal = (value) => (!value || value === "Select") ? "None" : value;

  const guest1Name = document.getElementById("name").value || "Guest 1";
  const guest1Select = document.getElementById("dietary-select-1");
  meals.push(`${guest1Name}: ${normalizeMeal(guest1Select ? guest1Select.value : "")}`);

  for (let i = 2; i <= guestCount; i++) {
    const nameInput = document.querySelector(`.guest-name-input[data-guest="${i}"]`);
    const select = document.getElementById(`dietary-select-${i}`);
    const guestName = (nameInput && nameInput.value) ? nameInput.value : `Guest ${i}`;
    meals.push(`${guestName}: ${normalizeMeal(select ? select.value : "")}`);
  }

  return meals.join(", ");
}

// "Bringing children?" checkbox — shows/hides the whole children block
hasChildrenCheckbox.addEventListener("change", (e) => {
	const checked = e.target.checked;
	childrenWrapper.style.display = checked ? "block" : "none";

	if (checked) {
		childrenInput.disabled = false;
		// Only set to 1 when the field was previously unset or 0
		if (!childrenInput.value || parseInt(childrenInput.value, 10) === 0) childrenInput.value = 1;
		renderBabyChairOptions(); // was: toggleBabyChair()
	} else {
		childrenInput.value = 0;
		childrenInput.disabled = true;
		babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo">No</option>`;
		babychairWrapper.style.display = "none";
		applyTranslations(currentLang);
	}
});

// Initial state on load:
childrenInput.disabled = true;
renderBabyChairOptions(); // was: toggleBabyChair()

// Baby chair question only when children > 0
function renderBabyChairOptions() {
	const kids = parseInt(childrenInput.value) || 0;
	const previousValue = babychairSelect.value;

	babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo">No</option>`;

	for (let i = 1; i <= kids; i++) {
		babychairSelect.innerHTML += `<option value="${i}">${i}</option>`;
	}

	// Keep the previous selection if it's still valid, otherwise reset to "No"
	const stillValid = Array.from(babychairSelect.options).some((opt) => opt.value === previousValue);
	babychairSelect.value = stillValid ? previousValue : "0";

	babychairWrapper.style.display = kids > 0 ? "block" : "none";

	applyTranslations(currentLang); // re-translate the "No" option's data-i18n
}

childrenInput.addEventListener("input", renderBabyChairOptions);

// Single submit handler
document.getElementById("rsvp-form").addEventListener("submit", (e) => {
	if (!isValidPhone()) {
		e.preventDefault();
		phoneError.style.display = "block";
		phoneInput.focus();
		return;
	}

	const attending = attendingSelect.value;

	document.getElementById("name-hidden").value = document.getElementById("name").value;
	document.getElementById("phone-hidden").value = "+" + phoneInput.value.replace(/\D/g, "");
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

	// Snapshot for the confirmation modal
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

	// Show immediate feedback instead of letting the user wonder if anything happened
	const submitBtn = e.target.querySelector('button[type="submit"]');
	submitBtn.disabled = true;
	submitBtn.textContent = "Submitting...";

	formSubmitted = true;
});

function handleSubmitResponse() {
	if (formSubmitted) {
		const submitBtn = document.querySelector('#rsvp-form button[type="submit"]');
		submitBtn.disabled = false;
		submitBtn.textContent = "Submit RSVP";

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

function buildConfirmationModal(data) {
	let summary = `${data.name}, thank you for your RSVP!\n\n`;
	let cardHtml = `<strong>${data.name}</strong><br>`;

	if (data.attending === "yes") {
		summary += `Attending: Yes\nGuests: ${data.guests}\n`;
		cardHtml += `Attending: Yes<br>Guests: ${data.guests}<br>`;
		if (data.guestNames) {
			summary += `Guest Names: ${data.guestNames}\n`;
			cardHtml += `Guest Names: ${data.guestNames}<br>`;
		}
		if (parseInt(data.children) > 0) {
			summary += `Children: ${data.children}\n`;
			cardHtml += `Children: ${data.children}<br>`;
		}
		if (data.babychair !== "0") {
			summary += `Baby Chairs: ${data.babychair}\n`;
			cardHtml += `Baby Chairs: ${data.babychair}<br>`;
		}
		// Render meals as bullet list for readability
		const mealsArray = data.meals ? data.meals.split(", ") : [];
		summary += `Meals:\n` + mealsArray.map(m => `- ${m}`).join("\n") + "\n";
		cardHtml += `Meals:<br><ul class="meal-list">` + mealsArray.map(m => `<li>${m}</li>`).join("") + `</ul>`;
	} else {
		summary += `Attending: No\nMessage: ${data.message}\n`;
		cardHtml += `Attending: No<br>Message: ${data.message}`;
	}

	document.getElementById("modal-summary-text").innerText = summary;
	document.getElementById("card-details").innerHTML = cardHtml;

	document.getElementById("download-response-btn").onclick = downloadCardAsImage;
	document.getElementById("share-response-btn").onclick = () => shareSummary(summary);
	document.getElementById("add-calendar-btn").href = buildCalendarLink();
}

function downloadCardAsImage() {
	html2canvas(document.getElementById("confirmation-card"), {
		backgroundColor: null,
		scale: 2, // sharper output for retina screens
	}).then((canvas) => {
		const link = document.createElement("a");
		link.download = "rsvp-confirmation.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
	});
}

function shareSummary(summary) {
	html2canvas(document.getElementById("confirmation-card"), { backgroundColor: null, scale: 2 }).then((canvas) =>
		canvas.toBlob((blob) => {
			const file = new File([blob], "RSVP-Confirmation.png", { type: "image/png" });
			if (navigator.canShare && navigator.canShare({ files: [file] })) {
				navigator.share({ files: [file], title: "Jason & Ada's Wedding RSVP", text: summary });
			} else if (navigator.share) {
				navigator.share({ title: "Jason & Ada's Wedding RSVP", text: summary });
			} else {
				navigator.clipboard.writeText(summary);
				alert("Copied to clipboard — you can now paste and share it.");
			}
		}),
	);
}

function buildCalendarLink() {
	const startDate = "20261212T180000"; // adjust to actual banquet start time
	const endDate = "20261212T220000"; // adjust to actual end time
	const details = encodeURIComponent("Jason & Ada's Wedding Banquet");
	const location = encodeURIComponent("Venue Name, Full Address");
	return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Jason+%26+Ada%27s+Wedding&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}
