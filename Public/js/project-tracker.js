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

    // ── Build a table row ──
    function buildRow(stageName, verifiers, isDefault = false) {
      const opts = verifiers.map(v => `<option>${v}</option>`).join('');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" value="${stageName}" placeholder="Stage name" /></td>
        <td><input type="date" /></td>
        <td><input type="date" /></td>
          <td><input type="number" class="inward" placeholder="In Qty" /></td>
            <td><input type="number" class="inward" placeholder="Out Qty" /></td>
        <td>
          <div class="upload-cell">
            <label class="stage-upload-trigger" style="cursor:pointer;color:#3b82f6;font-size:18px;display:inline-flex;align-items:center;gap:5px;">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span class="file-count">0</span>
            </label>
          </div>
        </td>
        <td>
          <select>${opts}</select>
        </td>
        <td>
  <div class="remarks-field">
    <input type="text" class="remarks-input" placeholder="Comment" readonly />
    <i class="fa-regular fa-comment-dots remarks-icon"></i>
  </div>
</td>
        <td>
          <div class="status-icons">
            <i class="fa-solid fa-floppy-disk" title="Save"></i>
            <i class="fa-solid fa-circle-exclamation" title="Alert"></i>
            ${isDefault 
        ? `<i class="fa-regular fa-circle-xmark disabled" title="Cannot delete"></i>` 
        : `<i class="fa-regular fa-circle-xmark" title="Remove" onclick="removeRow(this)"></i>`
      }
          </div>
        </td>
      `;
      return tr;
    }

    // ── Add row to a tbody ──
    function addRow(tbodyId, verifiers) {
      const tbody = document.getElementById(tbodyId);
      tbody.appendChild(buildRow('', verifiers));
    }

    // ── Remove a row ──
    function removeRow(icon) {
  const tr = icon.closest('tr');

  if (tr.classList.contains('default-row')) {
    alert('This row cannot be deleted');
    return;
  }

  tr.remove();
}

    // ── Update file count ──
    function updateCount(input) {
      const span = input.closest('.upload-cell').querySelector('.file-count');
      span.textContent = input.files.length;
    }

    // ── Init default rows ──
function initStages() {
  const v = getVerifiers();

  // DFM → 2 default rows (NON-DELETABLE)
  const dfm = document.getElementById('tbody-dfm');

  const dfm1 = buildRow('DFM Submission', v, true);
  const dfm2 = buildRow('DFM Approval', v, true);

  dfm1.classList.add('default-row');
  dfm2.classList.add('default-row');

  dfm.appendChild(dfm1);
  dfm.appendChild(dfm2);

  // OTHER SECTIONS → 1 compulsory row (NON-DELETABLE)
  ['tbody-mfg', 'tbody-insp', 'tbody-disp'].forEach(id => {
    const row = buildRow('', v, true);
    row.classList.add('default-row');
    document.getElementById(id).appendChild(row);
  });
}

    // ── Toggle (collapse/expand) section body ──
    function toggleSection(sectionId) {
      const section = document.getElementById(sectionId);
      const wrap = section.querySelector('.stage-table-wrap');
      const btn = section.querySelector('.btn-close-section');
      const isHidden = wrap.style.display === 'none';
      wrap.style.display = isHidden ? '' : 'none';
      btn.innerHTML = isHidden
        ? 'Close Section <i class="fa-solid fa-arrow-up"></i>'
        : 'Open Section <i class="fa-solid fa-arrow-down"></i>';
    }

    // ── Tabs ──
    document.addEventListener('DOMContentLoaded', () => {
      initStages();

      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');

      if (tab.dataset.tab === 'document') {
        renderDocuments(); 
      }
    });
      });

      loadProject();
    });

    // ── View Panel ──
    function viewPart(btn) {
      const row = btn.closest('tr');
      document.getElementById('partName').innerText = row.children[2].innerText;
      document.getElementById('partQty').innerText = row.children[3].innerText;
      document.getElementById('viewPanel').classList.add('active');
      document.getElementById('overlay').classList.add('active');
    }

    function closePanel() {
      document.getElementById('viewPanel').classList.remove('active');
      document.getElementById('overlay').classList.remove('active');
    }

    // ── Save Dates ──
    async function saveDates() {
      const startDate = document.getElementById('startDate').value;
      const reqDate = document.getElementById('reqDate').value;
      const projectId = document.getElementById('projectId').textContent.trim();
      try {
        const res = await fetch('/api/project/save-dates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, startDate, reqDate })
        });
        if (!res.ok) throw new Error();
        showMsg('savedDatesMsg');
      } catch { alert('Could not save dates. Please try again.'); }
    }

    // ── Save People ──
    async function savePeople() {
      const projectId = document.getElementById('projectId').textContent.trim();
      const payload = {
        projectId,
        projectManager: document.getElementById('pmSelect').value,
        qualityManager: document.getElementById('qmSelect').value,
        projectEngineer: document.getElementById('peSelect').value,
        engineer: document.getElementById('engSelect').value
      };
      try {
        const res = await fetch('/api/project/save-people', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        showMsg('savedPeopleMsg');
      } catch { alert('Could not save team. Please try again.'); }
    }

    function showMsg(id) {
      const el = document.getElementById(id);
      el.style.display = 'flex';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    // ── Find Project — CHANGED: opens modal instead of prompt ──
    function findProject() {
      document.getElementById('findModal').classList.add('active');
      document.getElementById('findModalOverlay').classList.add('active');
      setTimeout(() => document.getElementById('findModalInput').focus(), 50);
    }

    // ── Load Project ──
    async function loadProject() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id') || 'AM110-AP';
      try {
        const res = await fetch(`/api/project/${encodeURIComponent(id)}`);
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById('projectId').textContent = data.projectId || '';
        document.getElementById('projectStatus').textContent = data.status || '';
        document.getElementById('createdAt').textContent = data.createdAt || '';
        document.getElementById('startDate').value = data.startDate || '';
        document.getElementById('reqDate').value = data.reqDate || '';
        document.getElementById('userName').textContent = data.user?.name || 'User';
        setSelectValue('pmSelect', data.projectManager);
        setSelectValue('qmSelect', data.qualityManager);
        setSelectValue('peSelect', data.projectEngineer);
        setSelectValue('engSelect', data.engineer);
      } catch (e) { console.error('Load project failed:', e); }
    }

    function setSelectValue(id, value) {
      if (!value) return;
      const el = document.getElementById(id);
      if (!el) return;
      [...el.options].forEach(o => { o.selected = o.value === value || o.text === value; });
    }

    // =====================================================
    // ADDED: REMARKS POPUP — positioned near clicked field
    // =====================================================
    let _remarksTarget = null;

    document.addEventListener('click', function(e) {
      const popup = document.getElementById('remarksPopup');

      // Open when clicking a remarks-input
      if (e.target.classList.contains('remarks-input')) {
        _remarksTarget = e.target;
        document.getElementById('remarksText').value = _remarksTarget.value || '';

        const rect = _remarksTarget.getBoundingClientRect();
        const popupW = 250;
        const popupH = 130;
        const margin = 6;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;

        // Default: below the input
        let top = rect.bottom + margin + scrollY;
        let left = rect.left + scrollX;

        // Flip above if not enough room below
        if (rect.bottom + margin + popupH > window.innerHeight) {
          top = rect.top - popupH - margin + scrollY;
        }
        // Clamp right edge
        if (left + popupW > window.innerWidth - margin) {
          left = window.innerWidth - popupW - margin + scrollX;
        }
        document.getElementById('remarksOverlay').style.display = 'block';

        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.style.display = 'block';
        document.getElementById('remarksText').focus();
        e.stopPropagation();
        return;
      }

      // Close if clicking outside the popup
      if (popup.style.display === 'block' && !popup.contains(e.target)) {
      closeRemarksPopup();
      document.getElementById('remarksOverlay').style.display = 'none';
      }
    });

        function saveRemarks() {
      if (_remarksTarget) {
        _remarksTarget.value = document.getElementById('remarksText').value;
      }
      closeRemarksPopup(); // instead of manually hiding
    }

    // =====================================================
    // ADDED: UPLOAD FILES POPUP
    // =====================================================
    let _uploadTrigger = null; // the .stage-upload-trigger label that was clicked

    // Open upload popup when clicking the upload icon in any stage row
    document.addEventListener('click', function(e) {
      const trigger = e.target.closest('.stage-upload-trigger');

if (trigger) {
  _uploadTrigger = trigger;

  // 👇 ADD THIS
  _uploadTrigger._type = trigger.closest('.stage-tbl') ? 'stage' : 'part';

  renderUploadTable(_uploadTrigger._files || []);
  
  document.getElementById('uploadPopup').classList.add('active');
  document.getElementById('uploadPopupOverlay').classList.add('active');
}
      if (trigger) {
        _uploadTrigger = trigger;
        // Render existing files for this row (if any)
        renderUploadTable(_uploadTrigger._files || []);
        document.getElementById('uploadPopup').classList.add('active');
        document.getElementById('uploadPopupOverlay').classList.add('active');
      }
    });

    function closeUploadPopup() {
      document.getElementById('uploadPopup').classList.remove('active');
      document.getElementById('uploadPopupOverlay').classList.remove('active');
    }

    function handleStageFiles(input) {
      if (!_uploadTrigger) return;
      if (!_uploadTrigger._files) _uploadTrigger._files = [];
      Array.from(input.files).forEach(f => {
        _uploadTrigger._files.push({
          name: f.name,
          ext: f.name.split('.').pop().toUpperCase(),
          size: f.size,
          url: URL.createObjectURL(f),
          remarks: ''
        });
      });
      input.value = '';
      renderUploadTable(_uploadTrigger._files);
    }

    function renderUploadTable(files) {
  const tbody = document.getElementById('uploadFilesTbody');
  const thead = document.querySelector('.upload-files-table thead');
  tbody.innerHTML = '';

  const isStage = _uploadTrigger?._type === 'stage';

  // ✅ Change table header
  if (isStage) {
    thead.innerHTML = `
      <tr>
        <th>File Name</th>
        <th>File Type</th>
        <th>Action</th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th>File Name</th>
        <th>File Type</th>
        <th>Remarks</th>
        <th>Actions</th>
      </tr>
    `;
  }

  if (!files || files.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${isStage ? 2 : 4}" class="upload-empty-cell">
          No files added yet
        </td>
      </tr>
    `;
    return;
  }

  files.forEach((f, i) => {
    const tr = document.createElement('tr');

    if (isStage) {
      // SIMPLE VIEW (stage)
      tr.innerHTML = `
        <td class="upload-file-name">
          <i class="fa-solid fa-file-lines"></i> ${f.name}
        </td>
        <td>
          <span class="upload-type-badge">${f.ext}</span>
        </td>
        <td class="upload-actions-cell">
          <button class="upload-btn-del" onclick="deleteUploadFile(${i})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
    } else {
      // FULL VIEW (part files)
      tr.innerHTML = `
        <td class="upload-file-name">
          <i class="fa-solid fa-file-lines"></i> ${f.name}
        </td>
        <td><span class="upload-type-badge">${f.ext}</span></td>
        <td class="upload-remarks-cell">
          <input type="text" placeholder="Add remarks..." value="${f.remarks || ''}"
                 onchange="updateUploadRemark(${i}, this.value)" />
        </td>
        <td class="upload-actions-cell">
          <button class="upload-btn-del" onclick="deleteUploadFile(${i})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
    }

    tbody.appendChild(tr);
  });
}

    function updateUploadRemark(index, value) {
      if (_uploadTrigger && _uploadTrigger._files) {
        _uploadTrigger._files[index].remarks = value;
      }
    }

    function deleteUploadFile(index) {
      if (_uploadTrigger && _uploadTrigger._files) {
        _uploadTrigger._files.splice(index, 1);
        renderUploadTable(_uploadTrigger._files);
        syncUploadCount();
      }
    }

    function viewUploadFile(index) {
      if (_uploadTrigger && _uploadTrigger._files) {
        const f = _uploadTrigger._files[index];
        if (f.url) window.open(f.url, '_blank');
        else alert('Preview not available.');
      }
    }

    function insertStageFiles() {
  syncUploadCount();
  closeUploadPopup();

  renderDocuments(); 
}

    function syncUploadCount() {
      if (!_uploadTrigger) return;
      const count = (_uploadTrigger._files || []).length;
      const span = _uploadTrigger.querySelector('.file-count');
      if (span) span.textContent = count;
    }

    // =====================================================
    // ADDED: FIND PROJECT MODAL
    // =====================================================
    function closeFindModal() {
      document.getElementById('findModal').classList.remove('active');
      document.getElementById('findModalOverlay').classList.remove('active');
      document.getElementById('findModalError').textContent = '';
      document.getElementById('findModalInput').value = '';
    }

    function doFindProject() {
      const q = document.getElementById('findModalInput').value.trim();
      const errEl = document.getElementById('findModalError');
      if (!q) {
        errEl.textContent = 'Please enter a Project ID or PO Number.';
        return;
      }
      errEl.textContent = '';
      window.location.href = `/project-tracker/po?id=${encodeURIComponent(q)}`;
    }

    // Close find modal on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeFindModal();
        closeUploadPopup();
        document.getElementById('remarksPopup').style.display = 'none';
      }
    });

    function closeRemarksPopup() {
  document.getElementById('remarksPopup').style.display = 'none';
  document.getElementById('remarksOverlay').style.display = 'none';
}


function renderDocuments() {
  const container = document.getElementById('documentsContainer');

  let projectFiles = [];
  let stageFiles = [];

  // 🔍 Collect ALL uploaded files
  document.querySelectorAll('.stage-upload-trigger').forEach(trigger => {
    const files = trigger._files || [];
    if (!files.length) return;

    const isStage = trigger._type === 'stage';

    files.forEach(f => {
      if (isStage) {
        const row = trigger.closest('tr');

        stageFiles.push({
          name: f.name,
          type: f.ext,
          stage: row.querySelector('input[type="text"]').value || '—',
          section: trigger.closest('.stage-section')
                          .querySelector('.stage-section-title').innerText,
          date: new Date().toLocaleDateString()
        });
      } else {
        projectFiles.push({
          name: f.name,
          type: f.ext,
          remarks: f.remarks || '-',
          date: new Date().toLocaleDateString()
        });
      }
    });
  });

  let html = '';

  // ✅ PROJECT FILES TABLE
  if (projectFiles.length) {
    html += `
      <h3 class="upload-file" >Project Files</h3>
      <div class="table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Remarks</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${projectFiles.map((f, i) => `
              <tr>
                <td>${i+1}</td>
                <td>${f.name}</td>
                <td>${f.type}</td>
                <td>${f.remarks}</td>
                <td>${f.date}</td>
                <td class="doc-actions">
  <i class="fa-solid fa-eye action-icon view" onclick="viewDoc(${i}, 'project')" title="View"></i>
  <i class="fa-solid fa-trash action-icon delete" onclick="deleteDoc(${i}, 'project')" title="Delete"></i>
</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ✅ STAGE FILES TABLE
  if (stageFiles.length) {
    html += `
      <h3 class="upload-file">Stage Files</h3>
      <div class="table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th>File Name</th>
              <th>Stage Name</th>
              <th>Section</th>
              <th>Uploaded Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${stageFiles.map((f, i) => `
              <tr>
                <td>${i+1}</td>
                <td>${f.name}</td>
                <td>${f.stage}</td>
                <td>${f.section}</td>
                <td>${f.date}</td>
                <td class="doc-actions">
  <i class="fa-solid fa-eye action-icon view" onclick="viewDoc(${i}, 'project')" title="View"></i>
  <i class="fa-solid fa-download action-icon download" onclick="downloadDoc(${i}, 'project')" title="Download"></i>
  <i class="fa-solid fa-trash action-icon delete" onclick="deleteDoc(${i}, 'project')" title="Delete"></i>
</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ❌ Empty state
  if (!html) {
    html = `
      <div class="doc-empty">
        <i class="fa-solid fa-folder-open"></i><br>
        No documents uploaded yet.
      </div>
    `;
  }

  container.innerHTML = html;
}

const userPill = document.querySelector('.user-pill');

userPill.addEventListener('click', function (e) {
  if (window.innerWidth <= 768) {
    this.classList.toggle('active');
    e.stopPropagation();
  }
});

document.addEventListener('click', function () {
  userPill.classList.remove('active');
});
