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
	for (let i = 1; i <= guestCount; i++) {
		const select = document.getElementById(`dietary-select-${i}`);
		meals.push(`Guest ${i}: ${select ? select.value : "Non-Halal"}`);
	}
	return meals.join(", ");
}

// "Bringing children?" checkbox — shows/hides the whole children block
hasChildrenCheckbox.addEventListener("change", (e) => {
	const checked = e.target.checked;
	childrenWrapper.style.display = checked ? "block" : "none";

	if (checked) {
		childrenInput.disabled = false;
		childrenInput.value = childrenInput.value || 1;
		renderBabyChairOptions(); // was: toggleBabyChair()
	} else {
		childrenInput.value = 0;
		childrenInput.disabled = true;
		babychairSelect.innerHTML = `<option value="0" data-i18n="formBabyChairNo">No</option>`;
		babychairWrapper.style.display = "none";
		applyTranslations(currentLang);
	}

	// Initial state on load:
	childrenInput.disabled = true;
	renderBabyChairOptions(); // was: toggleBabyChair()
});

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
	document.getElementById("guestnames-hidden").value = attending === "yes" ? Array.from(document.querySelectorAll(".guest-name-input")).map((input) => input.value).join(", ") : "";

	document.getElementById("meals-hidden").value = attending === "yes" ? buildMealsString(parseInt(guestsInput.value) || 1) : "";
	document.getElementById("children-hidden").value = attending === "yes" ? childrenInput.value : "";

	document.getElementById("babychair-hidden").value = attending === "yes" ? babychairSelect.value : "0";

	document.getElementById("message-hidden").value = attending === "no" ? document.getElementById("message").value : "";

	formSubmitted = true;
});

function handleSubmitResponse() {
	if (formSubmitted) {
		document.getElementById("status-message").textContent = "Thank you! Your RSVP has been received.";
		document.getElementById("rsvp-form").reset();
		attendingFields.style.display = "none";
		regretsField.style.display = "none";
		childrenWrapper.style.display = "none";
		babychairWrapper.style.display = "none";
		babychairCountWrapper.style.display = "none";
		childrenInput.disabled = true;
		guestNamesContainer.innerHTML = "";
		formSubmitted = false;
	}
}
