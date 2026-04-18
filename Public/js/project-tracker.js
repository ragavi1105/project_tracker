async function saveDates() {
  const startDate = document.getElementById('startDate').value;
  const reqDate   = document.getElementById('reqDate').value;
  const projectId = document.getElementById('projectId').textContent.trim();

  try {
    const res = await fetch('/api/project/save-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, startDate, reqDate })
    });
    if (!res.ok) throw new Error('Failed');
    showMsg('savedDatesMsg');
  } catch {
    alert('Could not save dates. Please try again.');
  }
}

// ── Save People ──
async function savePeople() {
  const projectId = document.getElementById('projectId').textContent.trim();
  const payload = {
    projectId,
    projectManager:  document.getElementById('pmSelect').value,
    qualityManager:  document.getElementById('qmSelect').value,
    projectEngineer: document.getElementById('peSelect').value,
    engineer:        document.getElementById('engSelect').value
  };

  try {
    const res = await fetch('/api/project/save-people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed');
    showMsg('savedPeopleMsg');
  } catch {
    alert('Could not save team. Please try again.');
  }
}

// ── Show success message, auto-hide after 3s ──
function showMsg(id) {
  const el = document.getElementById(id);
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Find Project ──
function findProject() {
  const q = prompt('Enter Project ID or name:');
  if (!q || !q.trim()) return;
  window.location.href = `/project-tracker/po?id=${encodeURIComponent(q.trim())}`;
}

// ── Load project on page load ──
async function loadProject() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'AM110-AP';

  try {
    const res = await fetch(`/api/project/${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('projectId').textContent     = data.projectId    || '';
    document.getElementById('projectStatus').textContent = data.status       || '';
    document.getElementById('createdAt').textContent     = data.createdAt    || '';
    document.getElementById('startDate').value           = data.startDate    || '';
    document.getElementById('reqDate').value             = data.reqDate      || '';
    document.getElementById('userName').textContent      = data.user?.name   || 'User';

    setSelectValue('pmSelect',  data.projectManager);
    setSelectValue('qmSelect',  data.qualityManager);
    setSelectValue('peSelect',  data.projectEngineer);
    setSelectValue('engSelect', data.engineer);
  } catch (e) {
    console.error('Load project failed:', e);
  }
}

function setSelectValue(id, value) {
  if (!value) return;
  const el = document.getElementById(id);
  if (!el) return;
  [...el.options].forEach(o => { o.selected = o.value === value || o.text === value; });
}

document.addEventListener('DOMContentLoaded', loadProject);

// ── Popup from right ──
function viewPart(btn) {
  const row = btn.closest("tr");

  const partNumber = row.children[1].innerText;
  const partName = row.children[2].innerText;
  const qty = row.children[3].innerText;
  const status = row.children[4].innerText;

  const content = `
    <p><b>Part Number:</b> ${partNumber}</p>
    <p><b>Part Name:</b> ${partName}</p>
    <p><b>Order Quantity:</b> ${qty}</p>
    <p><b>Status:</b> ${status}</p>
  `;

  document.getElementById("viewContent").innerHTML = content;

  document.getElementById("viewPanel").classList.add("active");
  document.getElementById("overlay").classList.add("active"); 
}

function closePanel() {
  document.getElementById("viewPanel").classList.remove("active");
  document.getElementById("overlay").classList.remove("active"); 
}
