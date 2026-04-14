console.log("contact.js loaded");

// ================================
// SUPABASE INIT
// ================================
const SUPABASE_URL = "https://hufqhcirhlbyslmexvgw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnFoY2lyaGxieXNsbWV4dmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzIwNjEsImV4cCI6MjA4MTY0ODA2MX0.wGklNcQiLAPrmZTyNYWzJxy4YJvZ239umL5HJU0kVQI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;

console.log("Supabase initialized ✅");

// ================================
// ROBOT CHECK LOGIC (MODAL VERSION)
// ================================
let isVerified = false;

function initRobotCheck() {
  const robotCheckbox = document.getElementById("robot-checkbox");
  const modal = document.getElementById("captcha-modal");
  const closeBtn = document.getElementById("close-modal");

  if (!robotCheckbox || !modal) return;

  // Click on checkbox
  robotCheckbox.addEventListener("click", async () => {
    if (isVerified) return;

    robotCheckbox.classList.add("loading");
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    robotCheckbox.classList.remove("loading");
    robotCheckbox.classList.add("verified");
    isVerified = true;
    
    console.log("User verified as human ✅");

    // After brief delay, close modal and submit form
    setTimeout(() => {
        closeModal();
        const contactForm = document.querySelector(".mil-hero-form-frame form");
        if (contactForm) {
            // Trigger actual submission logic
            performActualSubmission(contactForm);
        }
    }, 800);
  });

  // Close modal logic
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function openModal() {
  const modal = document.getElementById("captcha-modal");
  if (modal) modal.classList.add("show");
}

function closeModal() {
  const modal = document.getElementById("captcha-modal");
  if (modal) modal.classList.remove("show");
}

function resetRobotCheck() {
  const robotCheckbox = document.getElementById("robot-checkbox");
  if (robotCheckbox) {
    robotCheckbox.classList.remove("verified", "loading");
  }
  isVerified = false;
}

// ================================
// SUBMIT HANDLER
// ================================
async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const phone = document.getElementById("user-phone").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    showToast("Please fill all required fields", "error");
    return;
  }

  if (!isVerified) {
    // Show modal instead of submitting
    openModal();
    return;
  }

  // If already verified (unlikely flow but safe), just perform submission
  performActualSubmission(e.target);
}

// Split logic to allow triggering from modal
async function performActualSubmission(formElement) {
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const phone = document.getElementById("user-phone").value.trim();
  const message = document.getElementById("message").value.trim();
  const serviceInput = document.querySelector("input[name='select']:checked");
  const services = serviceInput ? serviceInput.value : null;

  const submitBtn = formElement.querySelector("button[type='submit']");
  submitBtn.classList.add("loading");

  // 🟢 Wake up DB/functions
  try {
    await fetch(
      "https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/keep-alive",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      }
    );
  } catch (err) {
    console.warn("Keep-alive trigger failed", err);
  }

  const { error } = await supabaseClient.from("contact_form").insert([
    {
      name,
      email,
      phone,
      services,
      message,
    },
  ]);

  if (!error) {
    showToast("✅ Request submitted successfully!", "success");
    // 🔔 Notify
    fetch(
      "https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/send-contact-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "contact",
          name,
          email,
          phone,
          services,
          message,
        }),
      }
    );
    formElement.reset();
    resetRobotCheck();
  } else {
    console.error(error);
    showToast("Failed to submit request", "error");
  }

  submitBtn.classList.remove("loading");
}

// ================================
// CALLBACK FORM HANDLER
// ================================
async function handleCallbackSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("user-name-2").value.trim();
  const phone = document.getElementById("user-phone-2").value.trim();

  if (!name || !phone) {
    showToast("Please enter name and phone", "error");
    return;
  }

  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.classList.add("loading");

  // 🟢 Wake up DB/functions
  try {
    await fetch(
      "https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/keep-alive",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      }
    );
  } catch (err) {
    console.warn("Keep-alive trigger failed, proceeding anyway", err);
  }

  const { error } = await supabaseClient.from("call_back").insert([
    {
      name,
      phone,
    },
  ]);

  if (!error) {
    showToast("📞 We will call you back shortly!", "success");
    fetch(
      "https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/send-contact-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "callback",
          name,
          phone,
        }),
      }
    );
    e.target.reset();
  } else {
    console.error(error);
    showToast("Failed to submit callback request", "error");
  }

  submitBtn.classList.remove("loading");
}

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", () => {
  // Contact form
  const contactForm = document.querySelector(".mil-hero-form-frame form");
  if (contactForm) {
    contactForm.addEventListener("submit", handleSubmit);
  }

  // Callback form
  const callbackForm = document.getElementById("callbackForm");
  if (callbackForm) {
    callbackForm.addEventListener("submit", handleCallbackSubmit);
  }

  // Robot Check
  initRobotCheck();
});

// ================================
// TOAST FUNCTION
// ================================
function showToast(message, type = "success") {
  let toast = document.getElementById("toast");
  
  if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
