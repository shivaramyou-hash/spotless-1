console.log("contact.js loaded");

// ================================
// SUPABASE INIT
// ================================
const SUPABASE_URL = "https://hufqhcirhlbyslmexvgw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnFoY2lyaGxieXNsbWV4dmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzIwNjEsImV4cCI6MjA4MTY0ODA2MX0.wGklNcQiLAPrmZTyNYWzJxy4YJvZ239umL5HJU0kVQI";

const supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".mil-hero-form-frame form");
  if (!form) return;

  form.addEventListener("submit", handleSubmit);
});

// ================================
// SUBMIT HANDLER
// ================================
async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const phone = document.getElementById("user-phone").value.trim();
  const message = document.getElementById("message").value.trim();

  const serviceInput = document.querySelector("input[name='select']:checked");
  const services = serviceInput ? serviceInput.value : null;

  if (!name || !email || !message) {
    showToast("Please fill all required fields", "error");
    return;
  }

  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.classList.add("loading");

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
    // 🔔 Trigger notification (fire-and-forget)
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
  }

  submitBtn.classList.remove("loading");

  if (error) {
    console.error(error);
    showToast("Failed to submit request", "error");
    return;
  }

  showToast("✅ Request submitted successfully!", "success");
  e.target.reset();
}

// ================================
// CALLBACK FORM HANDLER (WITH ANIMATION)
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

  // ✅ ADD SAME LOADING ANIMATION
  submitBtn.classList.add("loading");

  const { error } = await supabaseClient.from("call_back").insert([
    {
      name,
      phone,
    },
  ]);

  if (!error) {
    showToast("📞 We will call you back shortly!", "success");
    // 🔔 Fire notification (no blocking)
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
  }

  // ✅ REMOVE ANIMATION
  submitBtn.classList.remove("loading");

  if (error) {
    console.error(error);
    showToast("Failed to submit callback request", "error");
    return;
  }

  e.target.reset();
}

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  // Contact form
  const contactForm = document.querySelector(".mil-hero-form-frame form");
  if (contactForm) {
    contactForm.addEventListener("submit", handleSubmit);
    console.log("Contact form handler attached");
  }

  // Callback form ✅ FIX
  const callbackForm = document.getElementById("callbackForm");
  if (callbackForm) {
    callbackForm.addEventListener("submit", handleCallbackSubmit);
    console.log("Callback form handler attached");
  }
});

// ================================
// TOAST FUNCTION
// ================================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
