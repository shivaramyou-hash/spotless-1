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
// AUTO-FILL FROM URL PARAMS
// ================================
function autoFillFromQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const fields = {
    'user-name': document.getElementById('user-name'),
    'user-email': document.getElementById('user-email'),
    'user-tel': document.getElementById('user-phone'),
    'message': document.getElementById('message')
  };

  // Fill text fields
  for (const [key, element] of Object.entries(fields)) {
    if (element && urlParams.has(key)) {
      element.value = urlParams.get(key);
    }
  }

  // Fill service selection
  if (urlParams.has('select')) {
    const serviceValue = urlParams.get('select');
    const radio = document.querySelector(`input[name="select"][value="${serviceValue}"]`);
    if (radio) {
      radio.checked = true;
      const selectedValueSpan = document.querySelector('.mil-selected-value');
      if (selectedValueSpan) {
          selectedValueSpan.textContent = serviceValue;
      }
    }
  }

  // IMPORTANT: Clean the URL immediately after filling to prevent state issues 
  if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log("URL parameters cleared ✅");
  }
}

// ================================
// ROBOT CHECK LOGIC (MODAL VERSION)
// ================================
let isVerified = false;

function initRobotCheck() {
  const robotCheckbox = document.getElementById("robot-checkbox");
  const modal = document.getElementById("captcha-modal");
  const closeBtn = document.getElementById("close-modal");

  if (!robotCheckbox || !modal) return;

  robotCheckbox.addEventListener("click", async (e) => {
    e.preventDefault(); // Extra safeguard
    if (isVerified) return;

    robotCheckbox.classList.add("loading");
    await new Promise(resolve => setTimeout(resolve, 1500));

    robotCheckbox.classList.remove("loading");
    robotCheckbox.classList.add("verified");
    isVerified = true;
    
    setTimeout(() => {
        closeModal();
        const contactForm = document.getElementById("contact-form-element");
        if (contactForm) {
            performActualSubmission(contactForm);
        }
    }, 800);
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
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
  // CRITICAL: Prevent ANY default browser action immediately
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const phone = document.getElementById("user-phone").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    showToast("Please fill all required fields", "error");
    return false; // Stop form
  }

  if (!isVerified) {
    openModal();
    return false; // Stop form
  }

  performActualSubmission(e.target);
  return false; // Final safeguard
}

async function performActualSubmission(formElement) {
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const phone = document.getElementById("user-phone").value.trim();
  const message = document.getElementById("message").value.trim();
  const serviceInput = document.querySelector("input[name='select']:checked");
  const services = serviceInput ? serviceInput.value : null;

  const submitBtn = formElement.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.classList.add("loading");

  try {
    await fetch("https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/keep-alive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });
  } catch (err) {}

  const { error } = await supabaseClient.from("contact_form").insert([
    { name, email, phone, services, message },
  ]);

  if (!error) {
    showToast("✅ Request submitted successfully!", "success");
    fetch("https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/send-contact-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type: "contact", name, email, phone, services, message }),
    });
    formElement.reset();
    resetRobotCheck();
    const selectedValueSpan = document.querySelector('.mil-selected-value');
    if (selectedValueSpan) selectedValueSpan.textContent = "Services";
  } else {
    showToast("Failed to submit request", "error");
  }

  if (submitBtn) submitBtn.classList.remove("loading");
}

// ================================
// CALLBACK FORM HANDLER
// ================================
async function handleCallbackSubmit(e) {
  if (e) e.preventDefault();

  const name = document.getElementById("user-name-2").value.trim();
  const phone = document.getElementById("user-phone-2").value.trim();

  if (!name || !phone) {
    showToast("Please enter name and phone", "error");
    return;
  }

  const submitBtn = e.target.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.classList.add("loading");
 // Wake up DB
  try {
    await fetch("https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/keep-alive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });
  } catch (err) {
      console.warn("Keep-alive trigger failed", err);
  }
  
  const { error } = await supabaseClient.from("call_back").insert([{ name, phone }]);

  if (!error) {
    showToast("📞 We will call you back shortly!", "success");
    fetch("https://hufqhcirhlbyslmexvgw.supabase.co/functions/v1/send-contact-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type: "callback", name, phone }),
    });
    e.target.reset();
  }

  if (submitBtn) submitBtn.classList.remove("loading");
}

// ================================
// DOM READY & INITIALIZATION
// ================================
function init() {
  console.log("Initializing contact scripts...");

  const contactForm = document.getElementById("contact-form-element");
  if (contactForm) {
    contactForm.addEventListener("submit", handleSubmit);
    // Extra safeguard: inline handler override
    contactForm.onsubmit = (e) => {
        handleSubmit(e);
        return false; 
    };
  }

  const callbackForm = document.getElementById("callbackForm");
  if (callbackForm) {
    callbackForm.addEventListener("submit", handleCallbackSubmit);
    callbackForm.onsubmit = (e) => {
        handleCallbackSubmit(e);
        return false;
    };
  }

  initRobotCheck();
  autoFillFromQueryParams();
}

// Handle both normal load and Swup transitions
document.addEventListener("DOMContentLoaded", init);
if (window.swup) {
    document.addEventListener("swup:contentReplaced", init);
}
// Final fallback for swup versions
document.addEventListener("swup:pageView", init);
