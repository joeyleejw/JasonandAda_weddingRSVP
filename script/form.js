let formSubmitted = false;

// Element references (all at top level so every function can reach them)
const attendingSelect       = document.getElementById("attending");
const attendingFields       = document.getElementById("attending-fields");
const regretsField          = document.getElementById("regrets-field");
const guestsInput           = document.getElementById("guests");
const childrenInput         = document.getElementById("children");
const babychairWrapper      = document.getElementById("babychair-wrapper");
const babychairSelect       = document.getElementById("babychair");
const babychairCountWrapper = document.getElementById("babychair-count-wrapper");
const babychairCount        = document.getElementById("babychair-count");
const mealVegetarian        = document.getElementById("meal-vegetarian");
const mealHalal             = document.getElementById("meal-halal");
const mealSummary           = document.getElementById("meal-summary");
const mealError             = document.getElementById("meal-error");

document.querySelector('iframe[name="hidden-iframe"]')
  .addEventListener("load", handleSubmitResponse);

// Show/hide Yes/No sections
attendingSelect.addEventListener("change", (e) => {
  const isYes = e.target.value === "yes";
  attendingFields.style.display = isYes ? "block" : "none";
  regretsField.style.display = e.target.value === "no" ? "block" : "none";
});

const guestNamesContainer = document.getElementById("guest-names-fields");

function renderGuestNames() {
  const count = parseInt(guestsInput.value) || 1;
  const previousValues = Array.from(document.querySelectorAll(".guest-name-input"))
    .map(input => input.value);

  guestNamesContainer.innerHTML = "";

  for (let i = 2; i <= count; i++) {
    const savedValue = previousValues[i - 2] || "";
    guestNamesContainer.innerHTML += `
      <label>Guest ${i} Name</label>
      <input type="text" class="guest-name-input" data-guest="${i}" value="${savedValue}" required>
    `;
  }
}

guestsInput.addEventListener("input", renderGuestNames);
renderGuestNames(); // run once on load

// Baby chair question only when children > 0
function toggleBabyChair() {
  const kids = parseInt(childrenInput.value) || 0;
  babychairWrapper.style.display = kids > 0 ? "block" : "none";

  if (kids === 0) {
    babychairSelect.value = "no";
    babychairCountWrapper.style.display = "none";
    babychairCount.disabled = true;
  } else {
    babychairSelect.disabled = false;
  }

  babychairCount.max = kids || 1; // avoid max=0 entirely
}
childrenInput.addEventListener("input", toggleBabyChair);

babychairSelect.addEventListener("change", () => {
  const showCount = babychairSelect.value === "yes";
  babychairCountWrapper.style.display = showCount ? "block" : "none";
  babychairCount.disabled = !showCount;
});

// Live meal tally
function updateMealLimits() {
  const guests     = parseInt(guestsInput.value) || 0;
  const vegetarian = parseInt(mealVegetarian.value) || 0;
  const halal      = parseInt(mealHalal.value) || 0;

  // Each field's max = guests minus whatever the OTHER field currently holds
  mealVegetarian.max = Math.max(guests - halal, 0);
  mealHalal.max      = Math.max(guests - vegetarian, 0);

  // If a value now exceeds its new max (e.g. guest count just went down), clamp it
  if (vegetarian > mealVegetarian.max) mealVegetarian.value = mealVegetarian.max;
  if (halal > mealHalal.max) mealHalal.value = mealHalal.max;
}

function updateMealSummary() {
  updateMealLimits();

  const guests     = parseInt(guestsInput.value) || 0;
  const vegetarian = parseInt(mealVegetarian.value) || 0;
  const halal      = parseInt(mealHalal.value) || 0;
  const specified  = vegetarian + halal;
  const regular    = guests - specified;

  if (specified > guests) {
    mealError.textContent = `You've entered ${specified} meal preferences but only ${guests} guest(s).`;
    mealError.style.display = "block";
    mealSummary.textContent = "";
  } else {
    mealError.style.display = "none";
    mealSummary.textContent = `${regular} regular, ${vegetarian} vegetarian, ${halal} halal — total ${guests}`;
  }
}

guestsInput.addEventListener("input", updateMealSummary);
document.querySelectorAll(".meal-count").forEach((input) => {
  input.addEventListener("input", updateMealSummary);
});
updateMealSummary();
toggleBabyChair();

// Single submit handler
document.getElementById("rsvp-form").addEventListener("submit", (e) => {
  const attending = attendingSelect.value;

  if (attending === "yes") {
    const guests     = parseInt(guestsInput.value) || 0;
    const vegetarian = parseInt(mealVegetarian.value) || 0;
    const halal      = parseInt(mealHalal.value) || 0;
    if (vegetarian + halal > guests) {
      e.preventDefault();
      mealError.style.display = "block";
      return;
    }
  }

  document.getElementById("name-hidden").value  = document.getElementById("name").value;
  document.getElementById("phone-hidden").value = "+60" + document.getElementById("phone").value;
  document.getElementById("attending-hidden").value = attending;
  document.getElementById("guests-hidden").value   = attending === "yes" ? guestsInput.value : "";
  document.getElementById("guestnames-hidden").value = attending === "yes"
  ? Array.from(document.querySelectorAll(".guest-name-input")).map(input => input.value).join(", ")
  : "";
  document.getElementById("children-hidden").value = attending === "yes" ? childrenInput.value : "";

  document.getElementById("babychair-hidden").value =
    (attending === "yes" && babychairSelect.value === "yes") ? babychairCount.value : "0";

  if (attending === "yes") {
    const guests     = parseInt(guestsInput.value) || 0;
    const vegetarian = parseInt(mealVegetarian.value) || 0;
    const halal      = parseInt(mealHalal.value) || 0;
    const regular    = guests - vegetarian - halal;
    document.getElementById("meals-hidden").value =
      `Regular: ${regular}, Vegetarian: ${vegetarian}, Halal: ${halal}`;
  } else {
    document.getElementById("meals-hidden").value = "";
  }

  document.getElementById("message-hidden").value =
    attending === "no" ? document.getElementById("message").value : "";

  formSubmitted = true;
});

function handleSubmitResponse() {
  if (formSubmitted) {
    document.getElementById("status-message").textContent =
      "Thank you! Your RSVP has been received.";
    document.getElementById("rsvp-form").reset();
    attendingFields.style.display = "none";
    regretsField.style.display = "none";
    babychairWrapper.style.display = "none";
    babychairCountWrapper.style.display = "none";
    updateMealSummary();
    formSubmitted = false;
  }
}