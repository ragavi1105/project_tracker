// ================= ELEMENTS =================

const sidebar  = document.getElementById("sidebar");
const menuBtn  = document.getElementById("menuBtn");
const links    = document.querySelectorAll(".sidebar a");

// ================= SECTION NAVIGATION =================

function showSection(event, sectionId) {
  if (event) event.preventDefault();

  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  links.forEach(link => link.classList.remove("active"));

  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";

  const activeLink = document.querySelector(`.sidebar a[data-section="${sectionId}"]`);
  if (activeLink) activeLink.classList.add("active");

  window.history.pushState({ section: sectionId }, "", `/project-management/${sectionId}`);
  window.scrollTo({ top: 0, behavior: "instant" });

  if (window.innerWidth <= 768) sidebar.classList.remove("show");
}

links.forEach(link => {
  link.addEventListener("click", (e) => {
    showSection(e, link.dataset.section);
  });
});

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebar.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("show");
  }
});

window.addEventListener("popstate", (event) => {
  showSection(null, event.state?.section || "dashboard");
});

// ================= DOM READY =================

window.addEventListener("DOMContentLoaded", async () => {

  const pathParts = window.location.pathname.split("/");
  const sectionId = pathParts[pathParts.length - 1] || "dashboard";

  showSection(null, sectionId);
  
  await loadProducts();
  await loadClientCodes();
  await loadDashboardCounts();
  await loadStageDashboard();
  await loadTotalProjectsCount();
  await loadLiveProjectsCount();
  await loadCompletedProjectsCount();
  await loadPendingProjectsCount();
  await loadCriticalCount();
  await loadNextWeekDueCount(); 
  await loadThisWeekDueCount();
  //await applyDashboardFilters();
  await loadStageAlerts();
  if (typeof loadProjectIds === "function") await loadProjectIds();
  // Build the OTD pie chart from API data
  if (typeof buildPieChart === "function") await buildPieChart();

  console.log("Before Build Dashboard");

const cf = document.getElementById("dashManagerCategoryFilter");

if (cf) {
  cf.innerHTML = `
    <option value="">All Categories</option>
    <option value="Project Manager">Project Manager</option>
    <option value="Quality Manager">Quality Manager</option>
    <option value="Development Manager">Development Manager</option>
  `;
}

await buildDashboard(allProducts);

  // show critical table by default without scrolling
  const tableWrapper = document.getElementById("dashboardProjectTable");
  const tbody = document.getElementById("dashboardProjectTableBody");
  const titleEl = document.getElementById("drillTableTitle");

  titleEl.textContent = "Critical Projects";

  const res = await fetch("/api/dashboard/critical-projects");
  const data = await res.json();

  tbody.innerHTML = data.length === 0
    ? `<tr><td colspan="6" class="empty-state">No Critical Projects</td></tr>`
    : data.map((item, i) => `
      <tr>
      <td>${String(i + 1).padStart(2, '0')}</td>
        <td title="${item.project_id || ""}">${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}</td>
        <td title="${item.part_number || ""}">${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}</td>
        <td>${item.required_date ? new Date(item.required_date).toLocaleDateString("en-GB") : "-"}</td>
        <td>${item.quantity}</td>
        <td>
          <a href="/project-tracker/${item.id || item.purchase_order_id}" target="_blank" style="color:#005e64;">
            <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
          </a>
        </td>
      </tr>
    `).join("");

  tableWrapper.style.display = "block";
  document.getElementById("logoCard").style.display = "none";

});

// ================= PRODUCTS TABLE =================

let allProducts = [];
let productsPage = 1;
const PRODUCTS_INITIAL = 250;
const PRODUCTS_MORE =50;

async function loadProducts() {
  const tbody = document.getElementById("productsBody");

  try {
    const response = await fetch("/api/project-management/products");

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allProducts = data;
    populateFilters(data);

    productsPage=1;
    renderProductsPaged();

  } catch (error) {
    console.error("Failed to load products:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Failed to load products. Please try again.</td></tr>`;
  }

  }

    function renderProductsPaged() {
      const limit = productsPage === 1
        ? PRODUCTS_INITIAL
        : PRODUCTS_INITIAL + (productsPage - 1) * PRODUCTS_MORE;
      const sliced = allProducts.slice(0, limit);
      const showing = Math.min(limit, allProducts.length);
      renderProducts(sliced, showing);
    }

    function loadMoreProducts() {
      productsPage++;
      renderProductsPaged();
    }

function renderProducts(data, showing) {

  const tbody = document.getElementById("productsBody");

  // PRODUCTS PAGE COUNTS
  const productCountSpan =
    document.getElementById("productCountSpan");

  const showingSpan =
    document.getElementById("showingCount");

  const totalProductsSpan =
    document.getElementById("totalCountProducts");

  // DASHBOARD COUNT
  const dashboardTotalCount =
    document.getElementById("totalCount");

  const shownNow = showing ?? data.length;
  productCountSpan.textContent = allProducts.length;
  showingSpan.textContent = shownNow;

  totalProductsSpan.textContent =
    allProducts.length;

  dashboardTotalCount.textContent =
    allProducts.length;

    const loadMoreContainer = document.getElementById("loadMoreContainer");
    if (loadMoreContainer) {
      loadMoreContainer.style.display = shownNow < allProducts.length ? "block" : "none";
    }

  // EMPTY STATE
  if (data.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          No products found.
        </td>
      </tr>
    `;

    return;
  }

  // TABLE ROWS
  tbody.innerHTML = data.map((item, index) => `
    <tr>
      <td>${index + 1}</td>

      <td>
        ${new Date(item.po_reference_date)
          .toLocaleDateString("en-GB")}
      </td>

      <td title="${item.po_reference_name || ''}" style="cursor:pointer;">
  ${
    item.po_reference_name
      ? item.po_reference_name.length > 15
        ? item.po_reference_name.substring(0, 15) + "..."
        : item.po_reference_name
      : "-"
  }
</td>

      <td title="${item.po_reference || ''}" style="cursor:pointer;">
  ${
    item.po_reference
      ? item.po_reference.length > 20
        ? item.po_reference.substring(0, 20) + "..."
        : item.po_reference
      : "-"
  }
</td>



      <td>${item.quantity ?? "-"}</td>
      <td>${item.aging ?? "-"}</td>

      <td>
        <span class="status-badge status-${(item.status || 'pending').toLowerCase().replace(/\s+/g, '-')}" >
          ${item.status || "Pending"}
        </span>
      </td>

      <td>
        <a href="/project-tracker/${item.purchase_order_id}"
           target="_blank"
           class="tracker-link">
          Go To
          <i class="fa-solid fa-angles-right"></i>

        </a>
      </td>
    </tr>
  `).join("");

}

// ================= SEARCH + FILTERS =================
document.getElementById("searchInput")
.addEventListener("input", function () {
  const query = this.value.trim().toLowerCase();
  applyFilters();

  if (!query) {

    document.querySelectorAll(".col-indicator")
      .forEach(el => el.style.visibility = "hidden");

    return;
  }

  highlightSearchColumns(query);

});


// Status Filter
document.getElementById("statusFilter")
.addEventListener("change", applyFilters);


// Manager Filter
document.getElementById("managerFilter")
.addEventListener("change", applyFilters);

document.getElementById("aging")
  .addEventListener("change", applyFilters);

document.getElementById("engineerFilter")
  .addEventListener("change", applyFilters);



//search column indicators
function highlightSearchColumns(query) {

  const poIndicator =
    document.querySelector(
      "#th-po-ref .col-indicator"
    );
  const projectIndicator =
    document.querySelector(
      "#th-project-id .col-indicator"
    );
  poIndicator.style.visibility = "hidden";
  projectIndicator.style.visibility = "hidden";

  if (!query.trim()) return;

  let poMatched = false;
  let projectMatched = false;

  allProducts.forEach(item => {

    const poRef =
      (item.po_reference || "")
        .toLowerCase();

    const projectId =
      (item.po_reference_name || "")
        .toLowerCase();

    if (poRef.includes(query)) {
      poMatched = true;
    }

    if (projectId.includes(query)) {
      projectMatched = true;
    }

  });

  // Show indicators
  if (poMatched) {
    poIndicator.style.visibility =
      "visible";
  }

  if (projectMatched) {
    projectIndicator.style.visibility =
      "visible";
  }

}

// ================= PART BANK =================

let partCache         = [];
let filteredPartCache = [];
let inputCache        = {};
let isUserEditing     = false;
let blurTimeout       = null;

function renderPartBank() {
  const tbody = document.getElementById("partBankBody");
  tbody.innerHTML = "";

  if (filteredPartCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No parts found.</td></tr>`;
    return;
  }

  filteredPartCache.forEach(item => {
    const tr = document.createElement("tr");
    tr.dataset.partId = item.id;

    const savedInputs = inputCache[item.id] || ["", "", ""];

    const partNum = (item.part_number  || "-").length > 15
      ? item.part_number.substring(0, 15) + "…"
      : (item.part_number || "-");

    const prodName = (item.product_name || "-").length > 20
      ? item.product_name.substring(0, 20) + "…"
      : (item.product_name || "-");

    tr.innerHTML = `
      <td title="${item.part_number  || ""}">${partNum}</td>
      <td title="${item.product_name || ""}">${prodName}</td>
      <td>${item.quantity ?? "-"}</td>
      <td><input type="number" class="part-list-row-input" value="${savedInputs[0]}" /></td>
      <td><input type="number" class="part-list-row-input" value="${savedInputs[1]}" /></td>
      <td><input type="number" class="part-list-row-input" value="${savedInputs[2]}" /></td>
      <td><button class="update-btn">Update</button></td>
      <td><i class="fa-solid fa-list"></i></td>
    `;

    tbody.appendChild(tr);
  });
}

document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("part-list-row-input")) return;
  const row    = e.target.closest("tr");
  const partId = row?.dataset.partId;
  if (!partId) return;
  const inputs = row.querySelectorAll(".part-list-row-input");
  inputCache[partId] = [inputs[0].value, inputs[1].value, inputs[2].value];
});

document.addEventListener("focusin", (e) => {
  if (e.target.classList.contains("part-list-row-input")) {
    clearTimeout(blurTimeout);
    isUserEditing = true;
  }
});

document.addEventListener("focusout", (e) => {
  if (e.target.classList.contains("part-list-row-input")) {
    blurTimeout = setTimeout(() => { isUserEditing = false; }, 200);
  }
});

// ================= DASHBOARD COUNTS =================
async function loadDashboardCounts() {
  try {
    const response = await fetch("/api/dashboard-counts");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (document.getElementById("totalPOs"))
      document.getElementById("totalPOs").textContent = data.totalPOs ?? 0;
    if (document.getElementById("totalParts"))
      document.getElementById("totalParts").textContent = data.totalParts ?? 0;
  } catch (err) {
    console.error("Failed to load dashboard counts:", err);
  }
}

// ================= DASHBOARD CARDS & ACCORDION =================

async function buildDashboard(products) {
   console.log("BUILD DASHBOARD CALLED");
  const cf = document.getElementById("dashManagerCategoryFilter");
  const mf = document.getElementById("dashManagerFilter");
  console.log("CF:", cf);
  console.log("MF:", mf);
  // manager-role categories we expose
  const categories = [
    { key: 'pm', label: 'Project Manager' },
    { key: 'qm', label: 'Quality Manager' },
    { key: 'dm', label: 'Development Manager' }
  ];
  // fetch users and build role mappings
  let users = [];
  const userRoleMap = {}; // name -> [roles]
  try {
    const res = await fetch('/api/users');
    users = await res.json();
  } catch (err) {
    console.error('Failed to load users for dashboard managers', err);
    users = [];
  }
  users.forEach(u => {
    const rolesStr = (u.roles || '').toString();
    const tokens = rolesStr.split(/[,\s]+/).map(r => r.trim().toLowerCase()).filter(Boolean);
    userRoleMap[u.name] = tokens;
  });
  // build category -> manager name map
  const categoryManagerMap = {
    'Project Manager': users.filter(u => (userRoleMap[u.name] || []).includes('pm')).map(u => u.name),
    'Quality Manager': users.filter(u => (userRoleMap[u.name] || []).includes('qm')).map(u => u.name),
    'Development Manager': users.filter(u => (userRoleMap[u.name] || []).includes('dm')).map(u => u.name)
  };

  cf.innerHTML = `<option value="">All Categories</option>`;
  Object.keys(categoryManagerMap).forEach(cat => cf.innerHTML += `<option value="${cat}">${cat}</option>`);
  console.log("Category Dropdown HTML:", cf.innerHTML);
  function populateDashManagers(category) {
    mf.innerHTML = `<option value="">All Managers</option>`;
    const managers = category ? (categoryManagerMap[category] || []) : Object.values(categoryManagerMap).flat();
    // dedupe
    const seen = new Set();
    managers.forEach(m => { if (!seen.has(m)) { seen.add(m); mf.innerHTML += `<option value="${m}">${m}</option>`; } });
  }

  populateDashManagers("");
  cf.addEventListener("change", () => {
    populateDashManagers(cf.value);
    mf.value = "";
  });

  // store role map globally for filter use
  window._dashboardUserRoleMap = userRoleMap;
  renderDashboardCards(products);
}


function renderDashboardCards(products) {

  const n = s => (s || "").toLowerCase().trim();

  const live = products.filter(
    p => [
      "rm stage",
      "manufacturing",
      "inspection",
      "dispatch"
    ].includes(n(p.status))
  );

  const completed = products.filter(
    p => n(p.status) === "completed"
  );

  const pending = products.filter(
    p => n(p.status) === "pending"
  );

  window._dashGroups = {
    live,
    completed,
    pending
  };
}

function openAccordion(status) {
  const acc     = document.getElementById(`acc-${status}`);
  const body    = document.getElementById(`acc-body-${status}`);
  const trigger = document.querySelector(`.acc-trigger[data-status="${status}"]`);
  const data    = (window._dashGroups || {})[status] || [];

  body.innerHTML = data.length === 0
    ? `<p class="acc-empty">No projects found.</p>`
    : `<table class="acc-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Project ID</th>
            <th>PO Reference</th>
            <th> Created at </th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.po_reference_name || "-"}</td>
              <td>${p.po_reference     || "-"}</td>
              <td>${p.created_at     ? new Date(p.created_at).toLocaleDateString("en-GB") : "-"}</td>
              <td>${p.quantity         ?? "-"}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;

  acc.style.display = "block";
  if (trigger) trigger.classList.add("active");
}

function closeAccordion(status) {
  const acc     = document.getElementById(`acc-${status}`);
  const trigger = document.querySelector(`.acc-trigger[data-status="${status}"]`);
  if (acc)     acc.style.display = "none";
  if (trigger) trigger.classList.remove("active");
}

document.addEventListener("click", (e) => {

  const trigger = e.target.closest(".acc-trigger");
  if (trigger) {
    const status = trigger.dataset.status;
    const isOpen = trigger.classList.contains("active");
    // close all
    ["live", "completed", "pending"].forEach(closeAccordion);
    if (!isOpen) openAccordion(status);
    return;
  }

  const closeBtn = e.target.closest(".acc-close");
  if (closeBtn) closeAccordion(closeBtn.dataset.status);

});

// ================= USER DROPDOWN =================

const userToggle   = document.getElementById("userToggle");
const userInfo = document.querySelector(".user-info");

userToggle.addEventListener("click", (e) => {

  if(window.innerWidth <= 480){

    e.stopPropagation();

    userInfo.classList.toggle("show");
  }

});

document.addEventListener("click", () => {

  if(window.innerWidth <= 480){
    userInfo.classList.remove("show");
  }

});


// ================= FILTERS =================

function populateFilters(data) {
  const statusFilter = document.getElementById("statusFilter");
  const managerFilter = document.getElementById("managerFilter");
   const engineerFilter = document.getElementById("engineerFilter");
  // Remove duplicate values
  const statuses = [...new Set(
    data.map(item => item.status).filter(Boolean)
  )];
const managers = [...new Set(
  data.flatMap(item => [
    item.project_manager,
    item.quality_manager,
    item.development_manager
  ]).filter(Boolean)
)];
const uniqueEngineers = new Map();

data.forEach(item => {

  if (item.engineer) {

    const key = item.engineer.trim().toLowerCase();

    if (!uniqueEngineers.has(key)) {
      uniqueEngineers.set(key, item.engineer.trim());
    }

  }

});
  // Add status options
  statuses.forEach(status => {
    statusFilter.innerHTML += `
      <option value="${status}">
        ${status}
      </option>
    `;
  });
  // Add manager options
  managers.forEach(manager => {
    managerFilter.innerHTML += `
      <option value="${manager}">
        ${manager}
      </option>
    `;
  });
  engineerFilter.innerHTML = `
  <option value="">All Engineers</option>
`;

uniqueEngineers.forEach(name => {
  engineerFilter.innerHTML += `
    <option value="${name}">
      ${name}
    </option>
  `;
});

}

// Main filter logic
function applyFilters() {

  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const manager = document.getElementById("managerFilter").value;
  const agingFilter = document.getElementById("aging").value;
 const engineer = document.getElementById("engineerFilter").value;

  const filtered = allProducts.filter(item => {

    const matchesSearch =
      (item.po_reference || "").toLowerCase().includes(search) ||
      (item.po_reference_name || "").toLowerCase().includes(search);

    const matchesStatus =
      !status || item.status === status;

    const matchesManager =
      !manager || 
      item.project_manager === manager ||
      item.quality_manager === manager ||
      item.development_manager === manager;
    
      const matchesEngineer =
    !engineer ||
    (item.engineer || "")
        .trim()
        .toLowerCase() ===
    engineer.trim().toLowerCase();
      

    const aging = Number(item.aging || 0);

    let matchesAging = true;

    if (agingFilter === "all" || agingFilter === "") {
  matchesAging = true;
}

    if (agingFilter === "0-30") {
      matchesAging = aging >= 0 && aging <= 30;
    }
    else if (agingFilter === "31-60") {
      matchesAging = aging >= 31 && aging <= 60;
    }
    else if (agingFilter === "61-90") {
      matchesAging = aging >= 61 && aging <= 90;
    }
    else if (agingFilter === "90+") {
      matchesAging = aging > 90;
    }

    return (
        matchesSearch &&
  matchesStatus &&
  matchesManager &&
  matchesEngineer &&
  matchesAging
    );

  });

  productsPage = 1;
  renderProducts(filtered, Math.min(PRODUCTS_INITIAL, filtered.length));
}

// =====================================
// SAMPLE COUNTS
// =====================================

const totalProjects = 0; // replace with API value when ready
const liveProjects = 0;
const completedProjects = 0;
const pendingProjects = 0;
// =====================================
// UPDATE DASHBOARD CARDS
// =====================================
document.getElementById("totalCount").innerText = totalProjects;
document.getElementById("liveCount").innerText = liveProjects;
document.getElementById("completedCount").innerText = completedProjects;
document.getElementById("pendingCount").innerText = pendingProjects;

// =====================================
// OTD PERFORMANCE — PIE CHART (dynamic)
// Fetch counts from API and render the chart. Falls back to sample data on error.
// =====================================


async function buildPieChart() {
  const el = document.getElementById("otdPieChart");
  if (!el) return;

  // Destroy existing chart first
  const existingChart = Chart.getChart(el);

  if (existingChart) {
    existingChart.destroy();
  }

  const ctx = el.getContext("2d");

  async function fetchCount(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return 0;

      const data = await res.json();

      if (Array.isArray(data)) return data.length;
      if (typeof data === "object" && data !== null && typeof data.count === "number")
        return data.count;

      return 0;
    } catch (err) {
      console.error("fetchCount error for", url, err);
      return 0;
    }
  }

  const [criticalCount, nextWeekCount, thisWeekCount] = await Promise.all([
    fetchCount('/api/dashboard/critical-projects'),
    fetchCount('/api/dashboard/next-week-dispatch'),
    fetchCount('/api/dashboard/weekly-dispatch-due')
  ]);

  const dataValues = [
    thisWeekCount,
    criticalCount,
    nextWeekCount
  ];

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["This Week Due", "Critical", "Next Week Due"],
      datasets: [{
        data: dataValues,
        backgroundColor: ["#10b981", "#ef4444", "#6366f1"],
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// =====================================
// PIPELINE SECTION CHARTS
// — horizontal bar, 3 bars per section
// — labels: In Progress | Pending | Completed
// =====================================

/*
  Sample data structure per section:
  [ inProgress, pending, completed ]

  Replace these numbers with real API values when ready.
*/

// const pipelineSectionData = {
//   dfmChart:              [12, 8,  10],   // DFM
//   rmChart:               [9,  14, 6],    // Raw Material
//   manufacturingChart:    [18, 5,  15],   // Manufacturing
//   inspectionChart:       [6,  11, 3],    // Inspection
//   dispatchChart:         [4,  16, 2]     // Dispatch
// };

function createSectionBarChart(canvasId, counts) {

  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

new Chart(ctx, {
  type: "bar",

  data: {
    labels: ["In Progress", "Pending", "Completed"],

    datasets: [{
      data: counts,

      backgroundColor: [
        "#005e64",
        "#0f4c81",
        "#4f46e5"
      ],

      borderRadius: 3,
      borderSkipped: false,
      barThickness: 14,
      categoryPercentage: 0.6,
      barPercentage: 0.5
    }]
  },

  options: {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,

    plugins: {

      legend: {
        display: false
      },

      tooltip: {

        titleFont: {
          family: "Poppins",
          size: 11,
          weight: "300"
        },

        bodyFont: {
          family: "Poppins",
          size: 11,
          weight: "300"
        },

        callbacks: {
          label: ctx => "  " + ctx.parsed.x + " projects"
        }
      }
    },

    scales: {
      x: {
        beginAtZero: true,

        grid: {
          color: "rgba(0,0,0,0.04)"
        },

        ticks: {
          stepSize: 5,

          font: {
            family: "Poppins",
            size: 10,
            weight: "300"
          }
        }
      },
      y: {

        grid: {
          display: false
        },

        ticks: {

          font: {
            family: "Poppins",
            size: 11,
            weight: "300"
          }
        }
      }
    }
  }
});

}

// Create a chart for each section
if (typeof pipelineSectionData !== 'undefined') {
  Object.entries(pipelineSectionData).forEach(([id, counts]) => {
    createSectionBarChart(id, counts);
  });
}

// =====================================
// ANIMATED COUNTER FOR CARDS
// =====================================

function animateCount(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let start = 0;
  const duration = 800;
  const step = Math.ceil(target / (duration / 16));
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.innerText = target;
      clearInterval(timer);
    } else {
      el.innerText = start;
    }
  }, 16);
}

// Replace the static assignments above with animated ones
// (comment out or remove the 4 lines that use .innerText = directly)
animateCount("totalCount",     totalProjects);
animateCount("liveCount",      liveProjects);
animateCount("completedCount", completedProjects);
animateCount("pendingCount",   pendingProjects);


const selectBox = document.getElementById("monthSelectBox");
const dropdown = document.getElementById("monthDropdown");

// TOGGLE DROPDOWN
selectBox.addEventListener("click", () => {
  dropdown.classList.toggle("show");
});

// UPDATE SELECTED MONTH TEXT
function updateMonthText() {

  const checked = document.querySelectorAll(
    '#monthDropdown input[type="checkbox"]:checked'
  );

  const values = [...checked].map(cb => cb.value);

  if (values.length > 0) {

    selectBox.innerHTML = `
      ${values.join(", ")}
      <i class="fa-solid fa-chevron-down"></i>
    `;

  } else {

    selectBox.innerHTML = `
      Select Months
      <i class="fa-solid fa-chevron-down"></i>
    `;
  }
}

// EVENT DELEGATION
dropdown.addEventListener("change", (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    updateMonthText();
  }
});

// CLOSE DROPDOWN
window.addEventListener("click", (e) => {
  if (!document.getElementById("monthSelect").contains(e.target)) {
    dropdown.classList.remove("show");
  }

});




async function toggleProjectTable(type) {

  const tableWrapper = document.getElementById("dashboardProjectTable");
  const tbody = document.getElementById("dashboardProjectTableBody");
  const titleEl = document.getElementById("drillTableTitle");

  const titleMap = {
    total: "All Projects",
    live: "Live Projects",
    completed: "Completed Projects",
    pending: "Pending Projects",
    critical: "Critical Projects",
    thisweek: "This Week Due",
    nextweek: "Next Week Due"
  };

  titleEl.textContent = titleMap[type] || "Projects";
  const showTable = () => {
    tableWrapper.style.display = "block";
    document.getElementById("logoCard").style.display = "none";
    setTimeout(() => {
      tableWrapper.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  };

  const showTableNoScroll = () => {
    tableWrapper.style.display = "block";
    document.getElementById("logoCard").style.display = "none";
  };

  // ================= CRITICAL =================
  if (type === "critical") {

    const manager =
  document.getElementById("dashManagerFilter").value;

const clientCode =
  document.getElementById("dashClientCodeFilter").value;

const monthMap = {
  Jan:1, Feb:2, Mar:3, Apr:4,
  May:5, Jun:6, Jul:7, Aug:8,
  Sep:9, Oct:10, Nov:11, Dec:12
};

const selectedMonths = [
  ...document.querySelectorAll(
    '#monthDropdown input[type="checkbox"]:checked'
  )
].map(cb => monthMap[cb.value]);

const query = new URLSearchParams({
  manager,
  clientCode,
  months: selectedMonths.join(',')
});

const res = await fetch(
  `/api/dashboard/critical-projects?${query}`
);
    const data = await res.json();

    tbody.innerHTML = data.length === 0
      ? `
        <tr>
          <td colspan="6" class="empty-state">
            No Critical Projects
          </td>
        </tr>
      `
      : data.map((item, i) => `
        <tr>
        <td>${String(i + 1).padStart(2, '0')}</td>
          <td title="${item.project_id || ""}">
          ${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}
        </td>
        <td title="${item.part_number || ""}">
          ${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}
        </td>
          <td>
            ${item.required_date
              ? new Date(item.required_date).toLocaleDateString("en-GB")
              : "-"}
          </td>
          <td>${item.quantity}</td>
          <td>
            <a href="/project-tracker/${item.id || item.purchase_order_id}"
               target="_blank"
               style="color:#005e64;">
              <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
            </a>
          </td>
        </tr>
      `).join("");
    showTable();
    return;
  }

  // ================= THIS WEEK =================
  if (type === "thisweek") {
   const manager =
  document.getElementById("dashManagerFilter").value;

const clientCode =
  document.getElementById("dashClientCodeFilter").value;

const monthMap = {
  Jan:1, Feb:2, Mar:3, Apr:4,
  May:5, Jun:6, Jul:7, Aug:8,
  Sep:9, Oct:10, Nov:11, Dec:12
};

const selectedMonths = [
  ...document.querySelectorAll(
    '#monthDropdown input[type="checkbox"]:checked'
  )
].map(cb => monthMap[cb.value]);

const query = new URLSearchParams({
  manager,
  clientCode,
  months: selectedMonths.join(',')
});

const res = await fetch(
  `/api/dashboard/weekly-dispatch-due?${query}`
);

    const data = await res.json();
    tbody.innerHTML = data.length === 0
      ? `
        <tr>
          <td colspan="6" class="empty-state">
            No Dispatches Due This Week
          </td>
        </tr>
      `
      : data.map((item, i) => `
        <tr>
          <td>${String(i + 1).padStart(2, "0")}</td>
         <td title="${item.project_id || ""}">
          ${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}
        </td>
        <td title="${item.part_number || ""}">
          ${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}
        </td>
          <td>
            ${item.dispatch_date
              ? new Date(item.dispatch_date).toLocaleDateString("en-GB")
              : "-"}
          </td>
          <td>${item.quantity}</td>
          <td>
            ${item.purchase_order_id
              ? `
                <a href="/project-tracker/${item.purchase_order_id}"
                   target="_blank"
                   style="color:#005e64;">
                  <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
                </a>
              `
              : "-"}
          </td>
        </tr>
      `).join("");

    showTable();
    return;
  }

  // ================= NEXT WEEK =================
  if (type === "nextweek") {
   const manager =
  document.getElementById("dashManagerFilter").value;

const clientCode =
  document.getElementById("dashClientCodeFilter").value;

const monthMap = {
  Jan:1, Feb:2, Mar:3, Apr:4,
  May:5, Jun:6, Jul:7, Aug:8,
  Sep:9, Oct:10, Nov:11, Dec:12
};

const selectedMonths = [
  ...document.querySelectorAll(
    '#monthDropdown input[type="checkbox"]:checked'
  )
].map(cb => monthMap[cb.value]);

const query = new URLSearchParams({
  manager,
  clientCode,
  months: selectedMonths.join(',')
});

const res = await fetch(
  `/api/dashboard/next-week-dispatch?${query}`
);
    const data = await res.json();
    tbody.innerHTML = data.length === 0
      ? `
        <tr>
          <td colspan="6" class="empty-state">
            No Dispatches Due Next Week
          </td>
        </tr>
      `
      : data.map((item, i) => `
        <tr>
          <td>${String(i + 1).padStart(2, "0")}</td>
          <td title="${item.project_id || ""}">${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}</td>
<td title="${item.part_number || ""}">${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}</td>
          <td>
            ${item.dispatch_date
              ? new Date(item.dispatch_date).toLocaleDateString("en-GB")
              : "-"}
          </td>
          <td>${item.quantity}</td>
          <td>
            ${item.purchase_order_id
              ? `
                <a href="/project-tracker/${item.purchase_order_id}"
                   target="_blank"
                   style="color:#005e64;">
                  <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
                </a>
              `
              : "-"}
          </td>
        </tr>
      `).join("");
    showTable();
    return;
  }

  // ================= DEFAULT PROJECT FILTERS =================
const manager =
  document.getElementById("dashManagerFilter").value;

const clientCode =
  document.getElementById("dashClientCodeFilter").value;

const monthMap = {
  Jan:1, Feb:2, Mar:3, Apr:4,
  May:5, Jun:6, Jul:7, Aug:8,
  Sep:9, Oct:10, Nov:11, Dec:12
};

const selectedMonths = [
  ...document.querySelectorAll(
    '#monthDropdown input[type="checkbox"]:checked'
  )
].map(cb => monthMap[cb.value]);

const query = new URLSearchParams({
  manager,
  clientCode,
  months: selectedMonths.join(',')
});
  let filtered = [];

if (type === "total") {
  const res = await fetch(
  `/api/dashboard/all-projects?${query}`
);
  filtered = await res.json();
}
else if (type === "live") {
  const res = await fetch(
  `/api/dashboard/live-projects?${query}`
);
  filtered = await res.json();
}
else if (type === "completed") {
  const res = await fetch(
  `/api/dashboard/completed-projects?${query}`
);
  filtered = await res.json();
}
else if (type === "pending") {
  const res = await fetch(
  `/api/dashboard/pending-projects?${query}`
);
  filtered = await res.json();
}

  tbody.innerHTML = filtered.length === 0
    ? `
      <tr>
        <td colspan="6" class="empty-state">
          No projects found
        </td>
      </tr>
    `
    : filtered.map((item, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, "0")}</td>
        <td title="${item.po_reference_name || ""}">${item.po_reference_name ? item.po_reference_name.substring(0, 10) + "..." : "-"}</td>
        <td title="${item.po_reference || ""}">${item.po_reference ? item.po_reference.substring(0, 12) + "..." : "-"}</td>
        <td>
          ${item.po_reference_date
            ? new Date(item.po_reference_date)
                .toLocaleDateString("en-GB")
            : "-"}
        </td>
        <td>${item.quantity ?? "-"}</td>
        <td>
          ${item.purchase_order_id
            ? `
              <a href="/project-tracker/${item.purchase_order_id}"
                 target="_blank"
                 style="color:#005e64;">
                <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
              </a>
            `
            : "-"}
        </td>
      </tr>
    `).join("");
  showTable();
}

async function loadCriticalCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/critical-projects?${query}`
  );

  const data = await res.json();

  document.getElementById('criticalCount').textContent =
    data.length;
}

async function loadNextWeekDueCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/next-week-dispatch?${query}`
  );

  const data = await res.json();

  document.getElementById(
    'nextWeekDueCount'
  ).textContent = data.length;
}

async function loadThisWeekDueCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/weekly-dispatch-due?${query}`
  );

  const data = await res.json();

  document.getElementById(
    'thisWeekDueCount'
  ).textContent = data.length;
}

async function loadTotalProjectsCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/total-projects-count?${query}`
  );

  const data = await res.json();

  document.getElementById('totalCount').textContent =
    data.count || 0;
}

async function loadLiveProjectsCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/live-projects-count?${query}`
  );

  const data = await res.json();

  document.getElementById('liveCount').textContent =
    data.count || 0;
}
async function loadCompletedProjectsCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/completed-projects-count?${query}`
  );

  const data = await res.json();

  document.getElementById('completedCount').textContent =
    data.count || 0;
}

async function loadPendingProjectsCount(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {

  const query = new URLSearchParams({
    manager,
    category,
    clientCode,
    months: months.join(',')
  });

  const res = await fetch(
    `/api/dashboard/pending-projects-count?${query}`
  );

  const data = await res.json();

  document.getElementById('pendingCount').textContent =
    data.count || 0;
}

async function closeDrillTable() {
  const tableWrapper = document.getElementById("dashboardProjectTable");
  const tbody = document.getElementById("dashboardProjectTableBody");
  const titleEl = document.getElementById("drillTableTitle");

  titleEl.textContent = "Critical Projects";

  const res = await fetch("/api/dashboard/critical-projects");
  const data = await res.json();

  tbody.innerHTML = data.length === 0
    ? `<tr><td colspan="6" class="empty-state">No Critical Projects</td></tr>`
    : data.map((item, i) => `
      <tr>
      <td>${String(i + 1).padStart(2, '0')}</td>
        <td title="${item.project_id || ""}">${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}</td>
        <td title="${item.part_number || ""}">${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}</td>
        <td>${item.required_date ? new Date(item.required_date).toLocaleDateString("en-GB") : "-"}</td>
        <td>${item.quantity}</td>
        <td>
          <a href="/project-tracker/${item.id || item.purchase_order_id}" target="_blank" style="color:#005e64;">
            <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
          </a>
        </td>
      </tr>
    `).join("");

  tableWrapper.style.display = "block";
  document.getElementById("logoCard").style.display = "none";
}

const themeToggle = document.getElementById("themeToggle");
// Default = LIGHT MODE
document.body.classList.remove("dark-mode");
// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  themeToggle.classList.remove("fa-moon");
  themeToggle.classList.add("fa-sun");
}

// Toggle Theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark =
    document.body.classList.contains("dark-mode");
  // Change icon
  if (isDark) {
    themeToggle.classList.remove("fa-moon");
    themeToggle.classList.add("fa-sun");
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.classList.remove("fa-sun");
    themeToggle.classList.add("fa-moon");
    localStorage.setItem("theme", "light");
  }
});



// function refreshDashboard() {
//   const loader = document.getElementById("dashboardLoader");
//   const content = document.getElementById("dashboardContent");
//   const refreshIcon = document.getElementById("dashRefreshIcon");

//   // Hide dashboard
//   content.style.display = "none";

//   // Show loader
//   loader.style.display = "flex";

//   // Rotate icon
//   refreshIcon.classList.add("rotating");

//   // Wait for GIF animation
//   setTimeout(async () => {

//     // Show dashboard
//     content.style.display = "block";

//     // Hide loader
//     loader.style.display = "none";

//     // Stop rotation
//     refreshIcon.classList.remove("rotating");

//     // show critical table without scrolling
//     const tableWrapper = document.getElementById("dashboardProjectTable");
//     const tbody = document.getElementById("dashboardProjectTableBody");
//     const titleEl = document.getElementById("drillTableTitle");

//     titleEl.textContent = "Critical Projects";

//     const res = await fetch("/api/dashboard/critical-projects");
//     const data = await res.json();

//     tbody.innerHTML = data.length === 0
//       ? `<tr><td colspan="6" class="empty-state">No Critical Projects</td></tr>`
//       : data.map((item, i) => `
//         <tr>
//         <td>${String(index + 1).padStart(2, '0')}</td>
//           <td title="${item.project_id || ""}">${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}</td>
//           <td title="${item.part_number || ""}">${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}</td>
//           <td>${item.required_date ? new Date(item.required_date).toLocaleDateString("en-GB") : "-"}</td>
//           <td>${item.quantity}</td>
//           <td>
//             <a href="/project-tracker/${item.id || item.purchase_order_id}" target="_blank" style="color:#005e64;">
//               <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
//             </a>
//           </td>
//         </tr>
//       `).join("");

//     tableWrapper.style.display = "block";
//     document.getElementById("logoCard").style.display = "none";
//   }, 3000);
// }


async function loadStageDashboard(
  manager = '',
  category = '',
  clientCode = '',
  months = []
) {
  try {
    const query = new URLSearchParams({
  manager,
  clientCode,
  months: months.join(',')
});

const res = await fetch(
  `/api/dashboard/stage-summary?${query}`
);
    const data = await res.json();
    console.log(
      "Stage Dashboard Data:",
      data
    );
    data.forEach(item => {
      let chartId = '';
      switch (
        (item.section_title || '').trim()
      ) {
        case 'DFM Checking':
          chartId = 'dfmChart';
          break;

        case 'RM Stage':
          chartId = 'rmChart';
          break;

        case 'Manufacturing':
          chartId = 'manufacturingChart';
          break;

        case 'Inspection':
          chartId = 'inspectionChart';
          break;

        case 'Dispatch':
          chartId = 'dispatchChart';
          break;

        default:
          return;
      }

      const canvas =
        document.getElementById(chartId);

      if (!canvas) return;

      if (Chart.getChart(canvas)) {
        Chart.getChart(canvas).destroy();
      }

      new Chart(canvas, {

        type: "bar",

        data: {

          labels: [
            "In Progress",
            "Pending",
            "Completed"
          ],

          datasets: [{

            label: "",

            data: [

              Number(
                item.in_progress || 0
              ),

              Number(
                item.pending || 0
              ),

              Number(
                item.completed || 0
              )

            ],

            backgroundColor: [

              "#005e64",
              "#0f4c81",
              "#4f46e5"

            ],

            borderRadius: 3,
            borderSkipped: false,
            barThickness: 18

          }]

        },

        options: {

          indexAxis: "y",

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {
              display: false
            }

          },

          scales: {

            x: {

              beginAtZero: true,

              ticks: {
                precision: 0
              }

            },

            y: {

              grid: {
                display: false
              }

            }

          }

        }

      });

    });

  } catch (err) {

    console.error(
      "Dashboard chart load error:",
      err
    );

  }

}
// ── Inventory Page JS ──

let allInventory = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventorySummary();
  await loadInventoryPage();

  // Search
  document.getElementById('inventorySearch')
    ?.addEventListener('input', function () {
      filterInventory(this.value.trim().toLowerCase());
    });

  // Stage filter
  document.getElementById('stageFilter')
    ?.addEventListener('change', function () {
      filterInventory(
        document.getElementById('inventorySearch')?.value.trim().toLowerCase() || ''
      );
    });
});


// ── Summary cards ──
async function loadInventorySummary() {
  try {
    const res  = await fetch('/api/inventory/summary');
    const data = await res.json();

    setEl('invTotalItems',     data.total_items     ?? 0);
    setEl('invTotalStock',     data.total_stock      ?? 0);
    setEl('invTotalDispatched',data.total_dispatched ?? 0);
    setEl('invOutOfStock',     data.out_of_stock     ?? 0);
    setEl('invLowStock',       data.low_stock        ?? 0);
  } catch (err) {
    console.error('Summary error:', err);
  }
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


// ── Main table ──
// ── Inventory Page ──

let inventoryPage    = 1;
const inventoryLimit = 250;
let inventoryTotal   = 0;
let searchTimer      = null;

document.addEventListener('DOMContentLoaded', () => {
  loadInventoryPage();

  document.getElementById('inventorySearch')
    ?.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        inventoryPage = 1;
        loadInventoryPage();
      }, 350);
    });
});


async function loadInventoryPage() {
  const tbody     = document.getElementById('inventoryTableBody');
  const countEl   = document.getElementById('inventoryShowingCount');
  const search    = document.getElementById('inventorySearch')?.value.trim() || '';

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;padding:40px;color:#9ca3af;">
        Loading...
      </td>
    </tr>`;

  try {
    const params = new URLSearchParams({
      search,
      page:  inventoryPage,
      limit: inventoryLimit
    });

    const res  = await fetch(`/api/inventory?${params}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    inventoryTotal = data.total;

    // Update "Showing X of Y"
    const showing = Math.min(
      inventoryPage * inventoryLimit,
      inventoryTotal
    );

    if (countEl) {
      countEl.textContent = `Showing ${showing} of ${inventoryTotal}`;
    }

    renderInventoryTable(data.rows);

  } catch (err) {
    console.error('Inventory load error:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">
          Error: ${err.message}
        </td>
      </tr>`;
  }
}


function renderInventoryTable(rows) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7"
            style="text-align:center;padding:60px;color:#9ca3af;">
          No inventory records found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = rows.map((item, i) => {

    const typeStyles = {
      'Manual Adjustment': { bg: '#d9e2ff', color: '#05199d' },
      'Dispatch':          { bg: '#DCFCE7', color: '#16a34a' },
    };
    const { bg: typeBg, color: typeColor } = typeStyles[item.type] || { bg: '#F3F4F6', color: '#6b7280' };

    const qtyColor =
      item.inventory_qty <= 0  ? '#ef4444' :
      item.inventory_qty <= 5  ? '#f59e0b' : '#16a34a';

    return `
      <tr 
          ${item.purchase_order_id}">

        <td>${String((inventoryPage - 1) * inventoryLimit + i + 1).padStart(2, '0')}</td>

        <td style="font-weight:530;color:var(--primary);">
          ${item.part_number || '-'}
        </td>

        <td title="${item.product_name || ''}" style="cursor:pointer;">
          ${(item.product_name || '-').length > 28
            ? item.product_name.substring(0, 28) + '...'
            : (item.product_name || '-')}
        </td>

        <td>
          <span style="
            background:${typeBg};
            color:${typeColor};
            font-size:13px;
            font-weight:500;
            padding:2px 8px;
            border-radius:4px;">
            ${item.type}
          </span>
        </td>

        <td style="font-weight:500;">
          ${item.project_id || '-'}
        </td>

        <td style="text-align:left;font-weight:5550;color:${qtyColor};font-size:15px;">
          ${item.inventory_qty}
        </td>
     <td>
  <i class="fa-solid fa-pen-to-square"
     title="Adjust Quantity"
     style="font-size:13px;color:#2008bb;cursor:pointer;transition:0.2s;"
     onclick="openAdjustQtyPopup('${item.part_id}', '${item.part_number || ''}', '${item.product_name || ''}', ${item.inventory_qty || 0})"
     onmouseover="this.style.color='#910c74';this.style.transform='scale(1.2)'"
     onmouseout="this.style.color='#2008bb';this.style.transform='scale(1)'">
  </i>
</td>
      
      </tr>
    `;
  }).join('');
}




function populateStageFilter(data) {
  const sel = document.getElementById('stageFilter');
  if (!sel) return;

  const stages = [...new Set(data.map(d => d.current_stage).filter(s => s && s !== '-'))];

  sel.innerHTML = '<option value="">All Stages</option>';
  stages.forEach(s => {
    sel.innerHTML += `<option value="${s}">${s}</option>`;
  });
}


// ── Transaction history popup ──
async function openTransactionHistory(productId, partNumber) {
  const popup   = document.getElementById('txnHistoryPopup');
  const overlay = document.getElementById('txnHistoryOverlay');
  const title   = document.getElementById('txnHistoryTitle');
  const tbody   = document.getElementById('txnHistoryTbody');

  if (!popup) {
    showToast('Transaction history popup not found in HTML', 'error');
    return;
  }

  title.textContent = `Transaction History — ${partNumber}`;
  tbody.innerHTML   = `<tr><td colspan="6" style="text-align:center;padding:20px;">
    <i class="fa-solid fa-spinner fa-spin"></i>
  </td></tr>`;

  popup.style.display   = 'flex';
  overlay.style.display = 'block';

  try {
    const res  = await fetch(`/api/inventory/transactions/${productId}`);
    const data = await res.json();

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#9ca3af;">No transactions found</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((t, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, '0')}</td>
        <td>${t.transaction_type || '-'}</td>
        <td>${t.reason || '-'}</td>
        <td style="color:#ef4444;">${t.old_stock ?? '-'}</td>
        <td style="color:#16a34a;">${t.new_stock ?? '-'}</td>
        <td>${t.user_name || '-'}</td>
        <td>${t.created_at ? new Date(t.created_at).toLocaleString() : '-'}</td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:red;padding:20px;">${err.message}</td></tr>`;
  }
}

function closeTransactionHistory() {
  document.getElementById('txnHistoryPopup').style.display   = 'none';
  document.getElementById('txnHistoryOverlay').style.display = 'none';
}


async function loadClientCodes() {

  try {

    const res = await fetch(
      '/api/dashboard/client-codes'
    );

    const data = await res.json();

    const select =
      document.getElementById(
        'dashClientCodeFilter'
      );

    select.innerHTML =
      '<option value="">Dropdown - Select</option>';

    data.forEach(row => {

      select.innerHTML += `
        <option value="${row.client_code}">
          ${row.client_code}
        </option>
      `;

    });

  } catch (err) {

    console.error(
      'Client code load error:',
      err
    );

  }

}


async function applyDashboardFilters() {

  const manager =
    document.getElementById(
      "dashManagerFilter"
    ).value;

  const category =
    document.getElementById(
      "dashManagerCategoryFilter"
    ).value;

  const clientCode =
    document.getElementById(
      "dashClientCodeFilter"
    ).value;

  const monthMap = {
    Jan:1, Feb:2, Mar:3, Apr:4,
    May:5, Jun:6, Jul:7, Aug:8,
    Sep:9, Oct:10, Nov:11, Dec:12
  };

  const selectedMonths = [
    ...document.querySelectorAll(
      '#monthDropdown input[type="checkbox"]:checked'
    )
  ].map(cb => monthMap[cb.value]);

  await loadTotalProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadLiveProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadCompletedProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadPendingProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadCriticalCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadThisWeekDueCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadNextWeekDueCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadStageDashboard(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await buildPieChart(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  console.log("Dashboard Filter Applied");
}

async function applyDashboardFilterButton() {

  const manager =
    document.getElementById(
      "dashManagerFilter"
    ).value;

  const category =
    document.getElementById(
      "dashManagerCategoryFilter"
    ).value;

  const clientCode =
    document.getElementById(
      "dashClientCodeFilter"
    ).value;

  const monthMap = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12
  };

  const selectedMonths = [
    ...document.querySelectorAll(
      '#monthDropdown input[type="checkbox"]:checked'
    )
  ].map(cb => monthMap[cb.value]);

  await loadTotalProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadLiveProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadCompletedProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadPendingProjectsCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadCriticalCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadThisWeekDueCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadNextWeekDueCount(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadStageDashboard(
    manager,
    category,
    clientCode,
    selectedMonths
  );

  await loadStageAlerts(
  manager,
  category,
  clientCode,
  selectedMonths
);

}


function refreshDashboard() {

  const loader = document.getElementById("dashboardLoader");
  const content = document.getElementById("dashboardContent");
  const refreshIcon = document.getElementById("dashRefreshIcon");

  // Hide dashboard
  content.style.display = "none";

  // Show loader
  loader.style.display = "flex";

  // Rotate icon
  refreshIcon.classList.add("rotating");

  // Wait for GIF animation
  setTimeout(async () => {

    // Show dashboard
    content.style.display = "block";

    // Hide loader
    loader.style.display = "none";

    // Stop rotation
    refreshIcon.classList.remove("rotating");

    // show critical table without scrolling
    const tableWrapper = document.getElementById("dashboardProjectTable");
    const tbody = document.getElementById("dashboardProjectTableBody");
    const titleEl = document.getElementById("drillTableTitle");

    titleEl.textContent = "Critical Projects";

    const res = await fetch("/api/dashboard/critical-projects");
    const data = await res.json();

    tbody.innerHTML = data.length === 0
      ? `<tr><td colspan="6" class="empty-state">No Critical Projects</td></tr>`
      : data.map((item, i) => `
        <tr>
          <td title="${item.project_id || ""}">${item.project_id ? item.project_id.substring(0, 7) + "..." : "-"}</td>
          <td title="${item.part_number || ""}">${item.part_number ? item.part_number.substring(0, 15) + "..." : "-"}</td>
          <td>${item.required_date ? new Date(item.required_date).toLocaleDateString("en-GB") : "-"}</td>
          <td>${item.quantity}</td>
          <td>
            <a href="/project-tracker/${item.id || item.purchase_order_id}" target="_blank" style="color:#005e64;">
              <i class="fa-solid fa-caret-right" style="font-size:16px;"></i>
            </a>
          </td>
        </tr>
      `).join("");

    tableWrapper.style.display = "block";
    document.getElementById("logoCard").style.display = "none";

  }, 3000);

}

// ── Inventory Adjust Qty Popup ──
let _adjustQtyPartId = null;
let _adjustQtyCurrentVal = 0;
function openAdjustQtyPopup(
  partId,
  partNumber,
  partName,
  currentQty
) {
  console.log('partId received =', partId);
_adjustQtyPartId = partId;
console.log('_adjustQtyPartId stored =', _adjustQtyPartId);
  _adjustQtyCurrentVal = parseInt(currentQty) || 0;
  document.getElementById('adjustQtyPartNumber').textContent =
    partNumber || '-';
  document.getElementById('adjustQtyPartName').textContent =
    partName || '-';
  document.getElementById('adjustQtyCurrentDisplay').textContent =
    _adjustQtyCurrentVal;
  document.getElementById('adjustQtyValue').value = '';
  document.getElementById('adjustQtyReason').value = '';
  const remarksEl =
    document.getElementById('adjustQtyRemarks');
  if (remarksEl) {
    remarksEl.value = '';
  }
  const addRadio =
    document.querySelector(
      'input[name="adjustType"][value="add"]'
    );
  if (addRadio) {
    addRadio.checked = true;
  }
  const preview =
    document.getElementById('adjustQtyPreview');
  if (preview) {
    preview.style.display = 'none';
  }
  document.getElementById('adjustQtyPopup').style.display =
    'block';
  document.getElementById('adjustQtyOverlay').style.display =
    'block';
}

function closeAdjustQtyPopup() {

  document.getElementById('adjustQtyPopup').style.display =
    'none';

  document.getElementById('adjustQtyOverlay').style.display =
    'none';

  _adjustQtyPartId = null;
  _adjustQtyCurrentVal = 0;
}

function updateAdjustPreview() {

  const val =
    parseInt(
      document.getElementById('adjustQtyValue').value
    ) || 0;

  const type =
    document.querySelector(
      'input[name="adjustType"]:checked'
    )?.value;

  const preview =
    document.getElementById('adjustQtyPreview');

  const previewVal =
    document.getElementById('adjustQtyPreviewVal');

  let newQty =
    _adjustQtyCurrentVal;

  if (type === 'add') {
    newQty =
      _adjustQtyCurrentVal + val;
  }

  if (type === 'subtract') {
    newQty =
      Math.max(
        0,
        _adjustQtyCurrentVal - val
      );
  }

  if (val > 0) {

    preview.style.display = 'flex';

    previewVal.textContent =
      newQty;

    previewVal.style.color =
      newQty < _adjustQtyCurrentVal
        ? '#dc2626'
        : '#059669';

    preview.style.background =
      newQty < _adjustQtyCurrentVal
        ? '#fef2f2'
        : '#f0fdf4';

    preview.style.borderColor =
      newQty < _adjustQtyCurrentVal
        ? '#fecaca'
        : '#bbf7d0';

  } else {

    preview.style.display = 'none';
  }
}

async function saveAdjustQty() {

  const val =
    parseInt(
      document.getElementById('adjustQtyValue').value
    );

  const reason =
    document.getElementById('adjustQtyReason').value;

  const type =
    document.querySelector(
      'input[name="adjustType"]:checked'
    )?.value;

  if (!reason) {

    showToast(
      'Please select a reason',
      'warning'
    );

    return;
  }

  if (isNaN(val) || val < 0) {

    showToast(
      'Enter a valid quantity',
      'warning'
    );

    return;
  }

  if (!_adjustQtyPartId) {

    showToast(
      'No Part Selected',
      'error'
    );

    return;
  }

  let newQty =
    _adjustQtyCurrentVal;

  if (type === 'add') {
    newQty =
      _adjustQtyCurrentVal + val;
  }

  if (type === 'subtract') {
    newQty =
      Math.max(
        0,
        _adjustQtyCurrentVal - val
      );
  }

  if (type === 'set') {
    newQty = val;
  }
 

  const payload = {

    product_id:
      _adjustQtyPartId,

    old_stock:
      _adjustQtyCurrentVal,

    new_stock:
      newQty,

    reason,
   remarks: document.getElementById('adjustQtyRemarks')?.value?.trim() || null
    
  };

  console.log(
    'Adjustment Payload:',
    payload
  );

  try {

    const res =
      await fetch(
        '/api/inventory/adjustment',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(payload)
        }
      );

    const data =
      await res.json();

    if (!res.ok || !data.success) {

      throw new Error(
        data.error ||
        'Adjustment failed'
      );

    }

    const currentSpan =
      document.getElementById(
        `current-qty-${_adjustQtyPartId}`
      );

    if (currentSpan) {

      currentSpan.textContent =
        newQty;
    }
    _adjustQtyCurrentVal =
      newQty;
    showToast(
      'Inventory adjusted successfully',
      'success'
    );
    closeAdjustQtyPopup();
  }
  catch (err) {
    console.error(err);
    showToast(
      err.message,
      'error'
    );
  }
}

async function openStagePopup(section, type) {

 const manager =
  document.getElementById("dashManagerFilter").value;

const category =
  document.getElementById("dashManagerCategoryFilter").value;

const clientCode =
  document.getElementById("dashClientCodeFilter").value;

const monthMap = {
  Jan:1, Feb:2, Mar:3, Apr:4,
  May:5, Jun:6, Jul:7, Aug:8,
  Sep:9, Oct:10, Nov:11, Dec:12
};

const selectedMonths = [
  ...document.querySelectorAll(
    '#monthDropdown input[type="checkbox"]:checked'
  )
].map(cb => monthMap[cb.value]);

const query = new URLSearchParams({
  section,
  type,
  manager,
  category,
  clientCode,
  months: selectedMonths.join(',')
});

const res = await fetch(
  `/api/dashboard/stage-details?${query}`
);

  const data = await res.json();

  document.getElementById('popupTitle').innerText =
    `${section} - ${type === 'overdue' ? 'Overdue' : 'Next Week'}`;

  const tbody =
    document.getElementById('popupTableBody');

  tbody.innerHTML = data.map((row,i)=>`
<tr>

  <td>${String(i + 1).padStart(2,'0')}</td>

  <td>
    ${row.project_id || '-'}
  </td>

  <td>
    ${row.part_number || '-'}
  </td>

  <td>
    ${
      row.stage_date
      ? new Date(row.stage_date)
          .toLocaleDateString('en-GB')
      : '-'
    }
  </td>

  <td>
    ${row.quantity}
  </td>

  <td>
    <a
      href="/project-tracker/${row.purchase_order_id}"
      target="_blank"
      class="popup-action">

      <i class="fa-solid fa-caret-right"></i>

    </a>
  </td>

</tr>
`).join('');

  document.getElementById('popupOverlay').style.display='block';
  document.getElementById('stagePopup').style.display='block';
}




function closeStagePopup() {

  document.getElementById('popupOverlay').style.display='none';

  document.getElementById('stagePopup').style.display='none';
}

async function loadStageAlerts(
  manager = '',
  category = '',
  clientCode = '',
  selectedMonths = []
) {

  const sections = [

    'DFM Checking',
    'RM Stage',
    'Manufacturing',
    'Inspection',
    'Dispatch'
  ];

  for(const section of sections){

    const overdue =
  await fetch(
    `/api/dashboard/stage-details?section=${encodeURIComponent(section)}&type=overdue&manager=${manager}&clientCode=${clientCode}&months=${selectedMonths.join(',')}`
  ).then(r => r.json());

const nextweek =
  await fetch(
    `/api/dashboard/stage-details?section=${encodeURIComponent(section)}&type=nextweek&manager=${manager}&clientCode=${clientCode}&months=${selectedMonths.join(',')}`
  ).then(r => r.json());

    const prefix = {

      'DFM Checking':'dfm',
      'RM Stage':'rm',
      'Manufacturing':'manufacturing',
      'Inspection':'inspection',
      'Dispatch':'dispatch'

    }[section];

    document.getElementById(`${prefix}Overdue`)
      .textContent =
      `${overdue.length} Overdue`;

    document.getElementById(`${prefix}NextWeek`)
      .textContent =
      `${nextweek.length} Next Week`;
  }
}


function getDashboardFilters() {
  return {
    managerCategory:
      document.getElementById("dashManagerCategoryFilter").value,

    manager:
      document.getElementById("dashManagerFilter").value,

    clientCode:
      document.getElementById("dashClientCodeFilter").value,

    months:
      Array.from(
        document.querySelectorAll(
          "#monthDropdown input:checked"
        )
      ).map(cb => cb.value)
  };
}

function filterByAging() {

  const value = document.getElementById("aging").value;

  let filtered = [...allProducts];

  if (value) {

    filtered = filtered.filter(item => {

      const aging = Number(item.aging || 0);

      switch (value) {

        case "0-30":
          return aging >= 0 && aging <= 30;

        case "31-60":
          return aging >= 31 && aging <= 60;

        case "61-90":
          return aging >= 61 && aging <= 90;

        case "90+":
          return aging > 90;

        default:
          return true;
      }

    });

  }

  renderProducts(filtered, filtered.length);

}




     function showToast(message, type = 'success', duration = 3500) {
      const config = {
        success: {
          bg: 'linear-gradient(135deg, #10b981, #059669)',
          icon: '✔',
          iconBg: 'rgba(255,255,255,0.25)'
        },
        error: {
          bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
          icon: '✖',
          iconBg: 'rgba(255,255,255,0.25)'
        },
        warning: {
          bg: 'linear-gradient(135deg, #64748b, #475569)',
          icon: '<i class="fa-solid fa-exclamation"></i>',
          iconBg: 'rgba(255,255,255,0.25)'
        },
        info: {
          bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          icon: 'ℹ',
          iconBg: 'rgba(255,255,255,0.25)'
        }
      };

      const c = config[type] || config.success;

      const existing = document.getElementById('toastNotification');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.innerHTML = `
        <div style="
          width:34px;height:34px;border-radius:50%;
          background:${c.iconBg};
          display:flex;align-items:center;justify-content:center;
          font-size:16px;font-weight:700;flex-shrink:0;color:#fff;">
          ${c.icon}
        </div>
        <span style="flex:1;font-size:13.5px;font-weight:600;letter-spacing:0.01em;">
          ${message}
        </span>
      `;

      Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        background: c.bg,
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '260px',
        maxWidth: '380px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.12)',
        zIndex: '999999',
        opacity: '0',
        overflow: 'hidden',
        transform: 'translateX(60px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        cursor: 'pointer'
      });

      toast.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        setTimeout(() => toast.remove(), 300);
      });

      document.body.appendChild(toast);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      }));

      const bar = document.createElement('div');
      Object.assign(bar.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        height: '3px',
        width: '100%',
        background: 'rgba(255,255,255,0.45)',
        borderRadius: '0 0 12px 12px',
        transition: `width ${duration}ms linear`
      });
      toast.appendChild(bar);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.width = '0%';
      }));

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }