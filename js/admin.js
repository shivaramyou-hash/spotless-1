console.log("admin.js loaded");

// ================================
// SUPABASE SAFE INIT (NO REDECLARE)
// ================================
const SUPABASE_URL = "https://hufqhcirhlbyslmexvgw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnFoY2lyaGxieXNsbWV4dmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzIwNjEsImV4cCI6MjA4MTY0ODA2MX0.wGklNcQiLAPrmZTyNYWzJxy4YJvZ239umL5HJU0kVQI";

// ✅ reuse client if already created
window.supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ NEVER name this variable `supabase`
const supabaseClient = window.supabaseClient;

// ================================
// GLOBAL STATE
// ================================
let allRows = [];

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Admin DOM loaded");

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  console.log("Session:", session);

  if (!session) {
    window.location.href = "../login.html";
    return;
  }

  // Logout
  document.getElementById("logoutBtn").onclick = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "../login.html";
  };

  fetchData();
});

// ================================
// FETCH DATA
// ================================
async function fetchData() {
  console.log("Fetching data...");

  const { data, error } = await supabaseClient
    .from("contact_form")
    .select("*")
    .order("created_on", { ascending: false });

  console.log("API result:", data, error);

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  allRows = data || [];
  updateCounts();
  renderTable();
}

// ================================
// UPDATE TOP COUNTS
// ================================
function updateCounts() {
  document.getElementById("totalContacts").textContent = allRows.length;

  document.getElementById("initiatedCount").textContent = allRows.filter(
    (r) => r.status === "Initiated"
  ).length;

  document.getElementById("pendingCount").textContent = allRows.filter(
    (r) => r.status === "Pending"
  ).length;

  document.getElementById("inProgressCount").textContent = allRows.filter(
    (r) => r.status === "In Progress"
  ).length;

  document.getElementById("completedCount").textContent = allRows.filter(
    (r) => r.status === "Completed"
  ).length;
}

// ================================
// RENDER TABLE
// ================================
function renderTable() {
  const tbody = document.getElementById("contactTableBody");
  tbody.innerHTML = "";

  if (!allRows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading">No records found</td></tr>`;
    return;
  }

  allRows.forEach((row) => {
    const statusClass = row.status.toLowerCase().replace(" ", "-");

    tbody.innerHTML += `
      <tr>
        <td class="contact-info">
          <strong>${row.name}</strong>
          <div>${row.email}</div>
          <div>${row.phone || "-"}</div>
        </td>

        <td>${row.services || "-"}</td>

        <td class="message">${row.message || "-"}</td>

        <td>
          <span class="status-badge status-${statusClass}">
            ${row.status}
          </span>
        </td>

        <td>${new Date(row.created_on).toLocaleString()}</td>

        <td>
          <div class="actions">
            <span class="action-pill initiated"
              onclick="updateStatus('${row.id}', 'Initiated')">
              Initiated
            </span>

            <span class="action-pill pending"
              onclick="updateStatus('${row.id}', 'Pending')">
              Pending
            </span>

            <span class="action-pill in-progress"
              onclick="updateStatus('${row.id}', 'In Progress')">
              In Progress
            </span>

            <span class="action-pill completed"
              onclick="updateStatus('${row.id}', 'Completed')">
              Completed
            </span>

            <span class="action-pill delete"
              onclick="deleteRow('${row.id}')">
              Delete
            </span>
          </div>
        </td>
      </tr>
    `;
  });
}

// ================================
// UPDATE STATUS
// ================================
async function updateStatus(id, status) {
  console.log("Updating status:", id, status);

  const { error } = await supabaseClient
    .from("contact_form")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Update error:", error);
    return;
  }

  fetchData();
}

// ================================
// DELETE ROW
// ================================
async function deleteRow(id) {
  if (!confirm("Delete this record?")) return;

  const { error } = await supabaseClient
    .from("contact_form")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    return;
  }

  fetchData();
}
