let stageUsers = [];

async function loadStageUsers() {
  try {
    const res = await fetch('/api/stage-users');
    stageUsers = await res.json();
  } catch (err) {
    console.error("Stage users load error:", err);
  }
}

    // ── Build a table row ──
    function buildRow(stageName, isDefault = false) {

  const opts = `
    <option value="">Select Verifier</option>
    ${stageUsers.map(u => `
      <option value="${u.user_id}">${u.name}</option>
    `).join('')}
  `;

  const tr = document.createElement('tr');

  // ✅ FIRST create HTML
  tr.innerHTML = `
    <td><input type="text" value="${stageName}" placeholder="Stage name" /></td>
    <td><input type="date" name="stage_date" /></td>
    <td><input type="date" name="achieve_date" /></td>
    <td><input type="number" class="inward" placeholder="In Qty" /></td>
    <td><input type="number" class="outward" placeholder="Out Qty" /></td>
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
        <input type="text" class="remarks-input" placeholder="Comment" readonly/>
        <i class="fa-regular fa-comment-dots remarks-icon"></i>
      </div>
    </td>
    <td>
      <div class="status-icons">
        <i class="fa-solid fa-floppy-disk" title="Save" onclick="saveSingleRowWithFiles(this)"></i>
        <i class="fa-solid fa-circle-exclamation" title="Alert"></i>
        ${isDefault 
          ? `<i class="fa-regular fa-circle-xmark disabled" title="Cannot delete"></i>` 
          : `<i class="fa-regular fa-circle-xmark" title="Remove" onclick="removeRow(this)"></i>`
        }
      </div>
    </td>
  `;

  // 🔥 NOW attach listeners (IMPORTANT)
  tr.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      tr.dataset.edited = 'true';
    });

    el.addEventListener('change', () => {
      tr.dataset.edited = 'true';
    });
  });

  const uploadTrigger = tr.querySelector('.stage-upload-trigger');

uploadTrigger.addEventListener('click', () => {
  _uploadTrigger = tr;

  document.getElementById('uploadPopup').classList.add('active');
  document.getElementById('uploadPopupOverlay').classList.add('active');

  renderUploadTable(_uploadTrigger._files || []);
});
  const remarksInput = tr.querySelector('.remarks-input');
  remarksInput._history = [];

  return tr;
}

function addRow(tbodyId) {

  const sectionId = getSectionIdForTbody(tbodyId);

  // 🔒 Block if previous section not closed
  if (sectionId) {
    const prev = getPreviousSectionId(sectionId);

    if (prev && !isSectionFrozen(prev)) {
      alert('Please close previous section first');
      return;
    }
  }

  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
if (tbodyId === 'tbody-insp') {

  const sel = document.getElementById('inspVariantSelect');
  const selectedValue = sel ? sel.value : '';

  const row = buildRow('Inspection');

  // ✅ If variant selected → use it
  if (selectedValue) {
    row.dataset.variant = selectedValue;

    // ✅ SHOW ONLY FAI / PPAP
    row.children[0].querySelector('input').value = selectedValue;

  } else {
    // ✅ DEFAULT CASE
    row.dataset.variant = 'Inspection';

    // ✅ SHOW ONLY Inspection
    row.children[0].querySelector('input').value = 'Inspection';
  }

  tbody.appendChild(row);

  if (sel) sel.value = '';
  return;
}

// ✅ NORMAL ROW
tbody.appendChild(buildRow(''));
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

  // DFM → 2 default rows (NON-DELETABLE)
  const dfm = document.getElementById('tbody-dfm');

  const dfm1 = buildRow('DFM Submission', null, true);
  const dfm2 = buildRow('DFM Approval', null, true);

  dfm1.classList.add('default-row');
  dfm2.classList.add('default-row');

  dfm.appendChild(dfm1);
  dfm.appendChild(dfm2);

  // OTHER SECTIONS → 1 compulsory row (NON-DELETABLE)
// Mfg and Disp get default row, Inspection starts empty
  ['tbody-mfg', 'tbody-disp'].forEach(id => {
    const row = buildRow('', null, true);
    row.classList.add('default-row');
    document.getElementById(id).appendChild(row);
  });
  // Inspection → no default row, only added on Add click

  updateAllStageStates();

  // ✅ Set initial button states
['section-dfm', 'section-mfg', 'section-insp', 'section-disp'].forEach((id, index) => {
  const section = document.getElementById(id);
  const btn = section.querySelector('.btn-close-section');

  if (index === 0) {
    btn.innerHTML = 'Close Section';
    btn.disabled = false;
  } else {
    btn.innerHTML = '🔒 Complete previous section to unlock';
    btn.disabled = true;
  }
});
}

function getSectionIdForTbody(tbodyId) {
  return {
    'tbody-dfm': 'section-dfm',
    'tbody-mfg': 'section-mfg',
    'tbody-insp': 'section-insp',
    'tbody-disp': 'section-disp'
  }[tbodyId];
}

function getPreviousSectionId(sectionId) {
  return {
    'section-mfg': 'section-dfm',
    'section-insp': 'section-mfg',
    'section-disp': 'section-insp'
  }[sectionId];
}

function getNextSectionId(sectionId) {
  return {
    'section-dfm': 'section-mfg',
    'section-mfg': 'section-insp',
    'section-insp': 'section-disp'
  }[sectionId];
}

function isSectionFrozen(sectionId) {
  const section = document.getElementById(sectionId);
  const wrap = section.querySelector('.stage-table-wrap');
  return wrap.dataset.frozen === 'true';
}

function isPreviousStageFrozen(sectionId) {
  const prevSectionId = getPreviousSectionId(sectionId);
  if (!prevSectionId) return true;
  return isSectionFrozen(prevSectionId);
}

function updateStageSectionState(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const wrap = section.querySelector('.stage-table-wrap');
  const addBtn = section.querySelector('.btn-add');
  const btn = section.querySelector('.btn-close-section');
  if (!wrap || !btn) return;

  const enabled = sectionId === 'section-dfm' || isPreviousStageFrozen(sectionId);

  // Enable/disable inputs
  wrap.querySelectorAll('input, select').forEach(el => {
    if (!el.classList.contains('remarks-input')) {
      el.disabled = !enabled;
    }
  });

  // UI state
  if (!enabled) {
    wrap.style.opacity = '0.6';
    wrap.style.pointerEvents = 'none';

    if (addBtn) addBtn.disabled = true;
    btn.disabled = true;
    btn.innerHTML = '🔒 Complete previous section to unlock';
  } else {
    wrap.style.opacity = '';
    wrap.style.pointerEvents = '';

    if (addBtn) addBtn.disabled = false;

    if (wrap.dataset.frozen !== 'true') {
      btn.disabled = false;
      btn.innerHTML = 'Close Section';
    }
  }
}

function updateAllStageStates() {
  ['section-dfm', 'section-mfg', 'section-insp', 'section-disp'].forEach(updateStageSectionState);
}

   function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const wrap = section.querySelector('.stage-table-wrap');
  const btn = section.querySelector('.btn-close-section');

  // 🚫 already closed
  if (wrap.dataset.frozen === 'true') return;

  const rows = section.querySelectorAll('tbody tr');

  // 🔴 STEP 1: VALIDATE ALL ROWS
  for (const row of rows) {

    const stageName = row.children[0].querySelector('input')?.value.trim();
    const stageDate = row.querySelector('[name="stage_date"]')?.value;
    const verifier = row.children[6].querySelector('select')?.value;

    // ❌ Empty check
    if (!stageName || !stageDate || !verifier) {
      alert("⚠️ Fill all required fields before closing this section");
      return;
    }

    // ❌ Not saved
    if (row.dataset.edited === 'true') {
      alert("⚠️ Please click Save (💾) before closing");
      return;
    }

    // ❌ Files added but not saved
    if (row._files && row._files.length) {
      alert("⚠️ Please save uploaded files before closing");
      return;
    }
  }

  // ✅ STEP 2: FREEZE SECTION
  wrap.dataset.frozen = 'true';
  wrap.style.opacity = '0.6';
  wrap.style.pointerEvents = 'none';

  wrap.querySelectorAll('input, select, button').forEach(el => {
    el.disabled = true;
  });

  btn.innerHTML = '✅ Section Completed';
  btn.disabled = true;

  // ✅ STEP 3: UNLOCK NEXT SECTION
  const nextSectionId = getNextSectionId(sectionId);
  if (nextSectionId) {
    updateStageSectionState(nextSectionId);
  }
}

    function viewPart(btn) {
  const row = btn.closest('tr');

  const partId = row.getAttribute('data-id');
  const partName = row.children[2].innerText;
  const partQty = row.children[3].innerText;

  console.log("Part ID:", partId);

  // ✅ Get current PO ID
  const { poId } = getParamsFromUrl();

  // ✅ CHANGE URL (IMPORTANT)
  window.history.pushState({}, '', `/project-tracker/${poId}/${partId}`);

  // UI update
  document.getElementById('partName').innerText = partName;
  document.getElementById('partQty').innerText = partQty;

  document.getElementById('viewPanel').classList.add('active');
  document.getElementById('overlay').classList.add('active');

  loadSinglePart(partId);
  loadStages(partId);
}

    function closePanel() {
  document.getElementById('viewPanel').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');

  // ✅ Get only PO ID
  const { poId } = getParamsFromUrl();

  // ✅ Update URL (remove partId)
  window.history.pushState({}, '', `/project-tracker/${poId}`);
}
    // ── Save Dates ──
    async function saveDates() {
  const startDateInput = document.getElementById('startDate');
  const reqDateInput = document.getElementById('reqDate');

  const startDate = startDateInput.value;
  const reqDate = reqDateInput.value;
  const projectId = getProjectFromURL();

  // 🚫 Prevent change if already saved
  if (startDateInput.disabled && reqDateInput.disabled) {
    alert("Dates are locked and cannot be changed ❌");
    return;
  }

  try {
    const res = await fetch('/api/project/save-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, startDate, reqDate })
    });

    if (!res.ok) throw new Error();

    showMsg('savedDatesMsg');

    await loadProject(); // reload latest

  } catch {
    alert('Could not save dates. Please try again.');
  }
}
   async function savePeople() {
  const { poId } = getParamsFromUrl();   

  const payload = {
    projectId: poId,
    projectManager: document.getElementById('pmSelect').value,
    qualityManager: document.getElementById('qmSelect').value,
    projectEngineer: document.getElementById('peSelect').value,
    engineer: document.getElementById('engSelect').value
  };

  console.log("Sending:", payload); 

  try {
    const res = await fetch('/api/project/save-people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Response:", data); 

    if (!res.ok) throw new Error();

    showMsg('savedPeopleMsg');

  } catch (err) {
    console.error(err);
    alert('Could not save team. Please try again.');
  }
}
    function showMsg(id) {
      const el = document.getElementById(id);
      el.style.display = 'flex';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    // ── Find Project — opens modal instead of prompt ──
    function findProject() {
      document.getElementById('findModal').classList.add('active');
      document.getElementById('findModalOverlay').classList.add('active');
      setTimeout(() => document.getElementById('findModalInput').focus(), 50);
    }



    function setSelectValue(id, value) {
      if (!value) return;
      const el = document.getElementById(id);
      if (!el) return;
      [...el.options].forEach(o => { o.selected = o.value === value || o.text === value; });
    }

    // =====================================================
    // REMARKS POPUP — positioned near clicked field
    // =====================================================
    let _remarksTarget = null;
    let _remarksMode = 'edit';

    document.addEventListener('click', function(e) {
      const popup = document.getElementById('remarksPopup');
      let remarkTrigger = null;

      // Open when clicking a remarks-input or remarks-icon
      if (e.target.classList.contains('remarks-input')) {
        remarkTrigger = e.target;
        _remarksMode = 'edit';
      } else if (e.target.classList.contains('remarks-icon')) {
        remarkTrigger = e.target.closest('.remarks-field').querySelector('.remarks-input');
        _remarksMode = 'history';
      }

            if (remarkTrigger) {
        _remarksTarget = remarkTrigger;
        renderRemarksHistory();

        if (_remarksMode === 'edit') {
          document.getElementById('remarksText').value = '';
        }

        const popup = document.getElementById('remarksPopup');
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          popup.setAttribute('style',
            'display:block !important;' +
            'position:fixed !important;' +
            'top:50% !important;' +
            'left:50% !important;' +
            'transform:translate(-50%,-50%) !important;' +
            'width:88vw !important;' +
            'max-width:320px !important;' +
            'z-index:99999 !important;' +
            'background:#fff;' +
            'border:1px solid #e5e7eb;' +
            'border-radius:5px;' +
            'box-shadow:0 6px 24px rgba(0,0,0,0.15);' +
            'padding:10px;'
          );
        } else {
          const rect = _remarksTarget.getBoundingClientRect();
          const popupW = 250;
          const popupH = 220;
          const margin = 6;
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const scrollX = window.scrollX || document.documentElement.scrollLeft;
          let top = rect.bottom + margin + scrollY;
          let left = rect.left + scrollX;
          if (rect.bottom + margin + popupH > window.innerHeight) {
            top = rect.top - popupH - margin + scrollY;
          }
          if (left + popupW > window.innerWidth - margin) {
            left = window.innerWidth - popupW - margin + scrollX;
          }
          popup.setAttribute('style',
            'display:block;' +
            'position:fixed;' +
            'top:' + top + 'px;' +
            'left:' + left + 'px;' +
            'width:250px;' +
            'z-index:19999;' +
            'background:#fff;' +
            'border:1px solid #e5e7eb;' +
            'border-radius:5px;' +
            'box-shadow:0 6px 24px rgba(0,0,0,0.15);' +
            'padding:10px;'
          );
        }

        document.getElementById('remarksOverlay').style.display = 'block';
        e.stopPropagation();
        return;
      }

      // Close if clicking outside the popup
      if (popup.style.display === 'block' && !popup.contains(e.target)) {
        closeRemarksPopup();
        document.getElementById('remarksOverlay').style.display = 'none';
        e.stopPropagation();
      }
    });

    
let _uploadTrigger = null; // will store row OR element

document.addEventListener('click', function (e) {

  // ─────────────────────────────────────
  // 🔹 PART FILES (FIXED)
  // ─────────────────────────────────────
  const partTrigger = e.target.closest('.part-files-text');

  if (partTrigger) {
    _uploadTrigger = partTrigger;
    _uploadTrigger._type = 'part';

    if (!_uploadTrigger._files) {
      _uploadTrigger._files = [];
    }

    renderUploadTable(_uploadTrigger._files);

    document.getElementById('uploadPopup').classList.add('active');
    document.getElementById('uploadPopupOverlay').classList.add('active');

    return; // 🔥 VERY IMPORTANT
  }

  // ─────────────────────────────────────
  // 🔹 MANUFACTURING FILES
  // ─────────────────────────────────────
  const mfgIcon = e.target.closest('.mfg-files-icon');

  if (mfgIcon) {
    if (!mfgIcon._files) mfgIcon._files = [];

    mfgIcon._type = 'mfg';
    _uploadTrigger = mfgIcon;

    renderUploadTable(_uploadTrigger._files);

    document.getElementById('uploadPopup').classList.add('active');
    document.getElementById('uploadPopupOverlay').classList.add('active');
    return;
  }

  // ─────────────────────────────────────
  // 🔹 STAGE FILES
  // ─────────────────────────────────────
  const trigger = e.target.closest('.stage-upload-trigger');

  if (!trigger) return;

  const row = trigger.closest('tr');

  if (!row) {
    console.error("Row not found for upload trigger");
    return;
  }

  _uploadTrigger = row;
  _uploadTrigger._type = 'stage';

  if (!_uploadTrigger._files) {
    _uploadTrigger._files = [];
  }

  console.log("Upload Trigger Row:", _uploadTrigger);
  console.log("Stage ID:", _uploadTrigger.getAttribute('data-stage-id'));

  renderUploadTable(_uploadTrigger._files);

  document.getElementById('uploadPopup').classList.add('active');
  document.getElementById('uploadPopupOverlay').classList.add('active');
});


    function closeUploadPopup() {
      document.getElementById('uploadPopup').classList.remove('active');
      document.getElementById('uploadPopupOverlay').classList.remove('active');
    }

   function handleStageFiles(input) {
  if (!_uploadTrigger) return;

  if (!_uploadTrigger._files) _uploadTrigger._files = [];

  Array.from(input.files).forEach(file => {
    _uploadTrigger._files.push({
      file, // 🔥 store actual file object
      name: file.name,
      ext: file.name.split('.').pop().toUpperCase(),
      remarks: ''
    });
  });

  renderUploadTable(_uploadTrigger._files);
  syncUploadCount();
  input.value = '';
}



   function renderUploadTable(files) {
  const tbody = document.getElementById('uploadFilesTbody');
  const thead = document.querySelector('.upload-files-table thead');
  tbody.innerHTML = '';

  const isStage = _uploadTrigger?._type === 'stage';
  const isMfg = _uploadTrigger?._type === 'mfg';      // ← ADD THIS LINE

  if (isMfg) {
    // ── TWO UPLOAD ZONES ──
    document.querySelector('.upload-drop-zone').style.display = 'none';

    let zonesDiv = document.getElementById('mfgZones');
    if (!zonesDiv) {
      zonesDiv = document.createElement('div');
      zonesDiv.id = 'mfgZones';
      zonesDiv.style.cssText = 'display:flex;gap:12px;margin-bottom:16px;';
      zonesDiv.innerHTML = `
        <div style="flex:1;border:2px dashed #e5e7eb;border-radius:7px;padding:18px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('mfgRmPicker').click()">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size:22px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">RM</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="mfgRmPicker" multiple style="display:none;"
                 onchange="handleMfgVariantFiles(this,'RM')" />
        </div>
        <div style="flex:1;border:2px dashed #e5e7eb;border-radius:7px;padding:18px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('mfgRmtcPicker').click()">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size:22px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">RMTC</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="mfgRmtcPicker" multiple style="display:none;"
                 onchange="handleMfgVariantFiles(this,'RMTC')" />
        </div>
      `;
      document.querySelector('.upload-popup-body').prepend(zonesDiv);
    } else {
      zonesDiv.style.display = 'flex';
    }

    thead.innerHTML = `
      <tr>
        <th>File Name</th>
        <th>File Type</th>
        <th>Variant</th>
        <th>Action</th>
      </tr>`;

  } else {
    // ── Hide mfg zones if switching back ──
    const zonesDiv = document.getElementById('mfgZones');
    if (zonesDiv) zonesDiv.style.display = 'none';
    document.querySelector('.upload-drop-zone').style.display = '';

    if (isStage) {
      thead.innerHTML = `<tr><th>File Name</th><th>File Type</th><th>Action</th></tr>`;
    } else {
      thead.innerHTML = `<tr><th>File Name</th><th>File Type</th><th>Remarks</th><th>Actions</th></tr>`;
    }
  }

  if (!files || files.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="upload-empty-cell">No files added yet</td></tr>`;
    return;
  }

  files.forEach((f, i) => {
    const tr = document.createElement('tr');

    if (isMfg) {
      tr.innerHTML = `
        <td class="upload-file-name">
  <i class="fa-solid fa-file-lines"></i>
  ${f.name.length > 50
    ? `<span>${f.name.substring(0, 50)}...</span>
       <i class="fa-solid fa-circle-exclamation"
          title="${f.name}"
          onclick="showFullFileName(this, '${f.name.replace(/'/g, "\\'")}')"
          style="color:#f59e0b; cursor:pointer; font-size:13px; margin-left:4px;"></i>`
    : f.name
  }
</td>
        <td><span class="upload-type-badge">${f.ext}</span></td>
        <td>
          <span style="background:${f.variant === 'RM' ? '#dbeafe' : '#dcfce7'};
                       color:${f.variant === 'RM' ? '#1d4ed8' : '#166534'};
                       font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">
            ${f.variant}
          </span>
        </td>
        <td class="upload-actions-cell">
          <button class="upload-btn-del" onclick="deleteUploadFile(${i})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>`;

    } else if (isStage) {
      tr.innerHTML = `
        <td class="upload-file-name">
  <i class="fa-solid fa-file-lines"></i>
  ${f.name.length > 50
    ? `<span>${f.name.substring(0, 50)}...</span>
       <i class="fa-solid fa-circle-exclamation"
          title="${f.name}"
          onclick="showFullFileName(this, '${f.name.replace(/'/g, "\\'")}')"
          style="color:#f59e0b; cursor:pointer; font-size:13px; margin-left:4px;"></i>`
    : f.name
  }
</td>
        <td><span class="upload-type-badge">${f.ext}</span></td>
        <td class="upload-actions-cell">
          <button class="upload-btn-del" onclick="deleteUploadFile(${i})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>`;

    } else {
      tr.innerHTML = `
        <td class="upload-file-name">
  <i class="fa-solid fa-file-lines"></i>
  ${f.name.length > 50
    ? `<span>${f.name.substring(0, 50)}...</span>
       <i class="fa-solid fa-circle-exclamation"
          title="${f.name}"
          onclick="showFullFileName(this, '${f.name.replace(/'/g, "\\'")}')"
          style="color:#f59e0b; cursor:pointer; font-size:13px; margin-left:4px;"></i>`
    : f.name
  }
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
        </td>`;
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
    

 //insert stage files

async function insertStageFiles() {
  if (!_uploadTrigger || !_uploadTrigger._files) return;

  const row = _uploadTrigger;


  alert("Files added. Click Save to store in DB ✅");

  closeUploadPopup();
}

async function insertPartFiles() {
  if (!_uploadTrigger || !_uploadTrigger._files) return;

  const { partId } = getParamsFromUrl();

  if (!partId) {
    alert("⚠️ Part not selected");
    return;
  }

  for (const f of _uploadTrigger._files) {
    const formData = new FormData();
    formData.append('file', f.file);
    formData.append('product_id', partId);
    formData.append('remarks', f.remarks || '');

    await fetch('/api/upload-file', {
      method: 'POST',
      body: formData
    });
  }

  alert("Part files saved ✅");

  await renderDocuments();
  await updatePartFileCount();

  closeUploadPopup();
}

function insertFiles() {
  if (!_uploadTrigger) return;

  if (_uploadTrigger._type === 'stage') {
    insertStageFiles();
  } else if (_uploadTrigger._type === 'part') {
    insertPartFiles();
  } else if (_uploadTrigger._type === 'mfg') {
    insertMfgFiles(); // optional if needed
  }
}


    // ── Sync the file count badge on the upload trigger icon ──
    function syncUploadCount() {
      if (!_uploadTrigger) return;
      const count = (_uploadTrigger._files || []).length;
      const span = _uploadTrigger.querySelector('.file-count');
      if (span) span.textContent = count;
    }

    // =====================================================
    // FIND PROJECT MODAL
    // =====================================================

    // ── Close the find project modal and reset fields ──
    function closeFindModal() {
      document.getElementById('findModal').classList.remove('active');
      document.getElementById('findModalOverlay').classList.remove('active');
      document.getElementById('findModalError').textContent = '';
      document.getElementById('findModalInput').value = '';
    }

    // ── Navigate to the searched project page ──
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

    // ── Close modals/popups on Escape key ──
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeFindModal();
        closeUploadPopup();
        document.getElementById('remarksPopup').style.display = 'none';
      }
    });

    // ── Close remarks popup and its overlay ──
    function closeRemarksPopup(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  _remarksTarget = null;
  document.getElementById('remarksPopup').style.display = 'none';
  document.getElementById('remarksOverlay').style.display = 'none';
}

    // =====================================================
    // DOCUMENTS TAB — Render all uploaded files
    // =====================================================

    // ── Keep a snapshot of project/stage files for delete operations ──
    let _projectFilesSnapshot = [];
    let _stageFilesSnapshot = [];

    // ── Render the documents tab with project and stage file tables ──
    
    // ── Delete a document from the Documents tab (Delete Option 3) ──
    function deleteDoc(index, type) {
      const snapshot = type === 'project' ? _projectFilesSnapshot : _stageFilesSnapshot;
      const entry = snapshot[index];
      if (!entry) return;

      const trigger = entry.trigger;
      if (trigger._files) {
        trigger._files.splice(entry.fileIndex, 1);  // ── Remove from the source trigger's file array ──
        syncUploadCount();                            // ── Update the upload badge count ──
      }

      renderDocuments();                             // ── Re-render the documents tab ──
      showToast('Deleted successfully');             // ── TOAST: shown after document deleted from list ──
    }

    // =====================================================
    // TOAST NOTIFICATION — shared across all delete actions
    // =====================================================

    // ── Show a toast message at the bottom of the screen ──
    function showToast(message) {
      // ── Remove any existing toast to avoid stacking ──
      const existing = document.getElementById('toastNotification');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;

      // ── Toast styles injected inline for portability ──
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        background: '#22c55e',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: '99999',
        opacity: '0',
        transition: 'opacity 0.3s ease'
      });

      document.body.appendChild(toast);

      // ── Fade in ──
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
      });

      // ── Fade out and remove after 3 seconds ──
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    //User name
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

function isRemarksFrozen(input) {
  const section = input.closest('.stage-section');
  if (!section) return false;

  const wrap = section.querySelector('.stage-table-wrap');
  return wrap?.dataset.frozen === 'true';
}


async function renderRemarksHistory() {
  if (!_remarksTarget) return;

  const row = _remarksTarget.closest('tr');
  if (!row) return;

  const stageId = row.getAttribute('data-stage-id');

  const historyDiv = document.getElementById('remarksHistory');
  if (!historyDiv) return; // ✅ prevent crash

  // 🚨 If stage not saved yet
  if (!stageId) {
    historyDiv.innerHTML = '<div>⚠️ Please save stage first</div>';
    return;
  }

  try {
    const res = await fetch(`/api/stage-comments/${stageId}`);

    if (!res.ok) {
      historyDiv.innerHTML = '<div>Error loading comments</div>';
      return;
    }

    const comments = await res.json();

    if (!comments.length) {
      historyDiv.innerHTML = '<div>No comments yet</div>';
      return;
    }

    historyDiv.innerHTML = comments.map(c => `
      <div class="remarks-history-item">
        <div>${c.comment_text}</div>
        <small>${new Date(c.created_at).toLocaleString()}</small>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
    historyDiv.innerHTML = '<div>Error loading comments</div>';
  }
}

async function saveRemarks() {
  const row = _remarksTarget.closest('tr');
  const stageId = row.getAttribute('data-stage-id');
  const text = document.getElementById('remarksText').value.trim();

  console.log("Stage ID:", stageId);
  console.log("Comment:", text);

  if (!stageId) {
    alert("⚠️ Please save stage first");
    return;
  }

  if (!text) {
    alert("⚠️ Enter comment");
    return;
  }

  try {
    const res = await fetch('/api/stage-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage_id: stageId,
        comment_text: text,
        user_id: 1
      })
    });

    if (!res.ok) throw new Error();

    alert("Saved ✅");
    closeRemarksPopup();

  } catch (err) {
    console.error(err);
  }
}


// 🔹 Load Project
async function loadProject() {
  const { poId } = getParamsFromUrl();  // OR use pathname method

  try {
    const res = await fetch(`/api/project/${poId}`);
    if (!res.ok) throw new Error('Not found');

    const data = await res.json();

    console.log("Loaded:", data);

    // Project info
    document.getElementById('projectId').textContent = data.projectId || '';
    document.getElementById('projectStatus').textContent = data.status || '';
    document.getElementById('createdAt').textContent = data.createdAt || '';

    // ✅ IMPORTANT: Dates
    document.getElementById('startDate').value = data.startDate || '';
    document.getElementById('reqDate').value = data.reqDate || '';
  // 🔒 lock individually
if (data.startDate) {
  document.getElementById('startDate').disabled = true;
}

if (data.reqDate) {
  document.getElementById('reqDate').disabled = true;
}
    // Users
    document.getElementById('userName').textContent = data.user?.name || 'User';

    setSelectValue('pmSelect', data.projectManager);
    setSelectValue('qmSelect', data.qualityManager);
    setSelectValue('peSelect', data.projectEngineer);
    setSelectValue('engSelect', data.engineer);

    // 🔒 LOCK USERS
if (data.projectManager) {
  document.getElementById('pmSelect').disabled = true;
}

if (data.qualityManager) {
  document.getElementById('qmSelect').disabled = true;
}

if (data.projectEngineer) {
  document.getElementById('peSelect').disabled = true;
}

if (data.engineer) {
  document.getElementById('engSelect').disabled = true;
}

  } catch (err) {
    console.error(err);
    alert('Project not found');
  }
}
document.addEventListener('DOMContentLoaded', async () => {

  await loadUsers();
  await loadStageUsers();
  initStages();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');

      if (tab.dataset.tab === 'document') {
        await renderDocuments();
        await updatePartFileCount();
      }
    });
  });

  loadProject();
  loadParts();

  const { partId } = getParamsFromUrl();

  if (partId) {
    loadSinglePart(partId);
    await loadStages();            // ✅ now valid
    await updatePartFileCount();   // ✅ now valid
  }
});

// 🔹 Find Project (redirect)
function findProject() {
  const id = prompt('Enter Purchase Order ID:');
  if (!id) return;

  window.location.href = `/project-tracker/${id}`;
}



async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();

    const pm = document.getElementById('pmSelect');
    const qm = document.getElementById('qmSelect');
    const pe = document.getElementById('peSelect');
    const eng = document.getElementById('engSelect');

    // Clear dropdowns
    pm.innerHTML = '<option value="">Select</option>';
    qm.innerHTML = '<option value="">Select</option>';
    pe.innerHTML = '<option value="">Select</option>';
    eng.innerHTML = '<option value="">Select</option>';

    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.user_id;     
      option.textContent = user.name;

      // ✅ Add same user to ALL dropdowns
      pm.appendChild(option.cloneNode(true));
      qm.appendChild(option.cloneNode(true));
      pe.appendChild(option.cloneNode(true));
      eng.appendChild(option.cloneNode(true));
    });

  } catch (err) {
    console.error('Error loading users:', err);
  }
}

async function loadParts() {
  const { poId } = getParamsFromUrl(); 

  try {
    const res = await fetch(`/api/parts/${poId}`);
    const parts = await res.json();

    const tbody = document.getElementById('partsTableBody');
    tbody.innerHTML = '';

    parts.forEach((part, index) => {
      const row = `
        <tr data-id="${part.id}" onclick="openPart(${part.id})" style="cursor:pointer;">
          <td>${String(index + 1).padStart(2, '0')}</td>
          <td>${part.part_number}</td>
          <td>${part.product_name}</td>
          <td>${part.quantity}</td>
          <td><span class="status in-progress">In Progress</span></td>
          <td>
            <button class="btn-action view"onclick="event.stopPropagation(); viewPart(this)"> <i class="fa-solid fa-list-check"></i>
              View
            </button>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });

  } catch (err) {
    console.error('Error loading parts:', err);
  }
}

async function loadSinglePart(partId) {
  try {
    const res = await fetch(`/api/part/${partId}`);
    const part = await res.json();

    document.getElementById('partName').innerText = part.product_name || '-';
    document.getElementById('partQty').innerText = part.quantity || '-';

    document.getElementById("viewPanel").classList.add("active");
    document.getElementById("overlay").classList.add("active");

  } catch (err) {
    console.error(err);
  }
}

function getParamsFromUrl() {
  const parts = window.location.pathname.split('/');
  
  return {
    poId: parts[2] || null,    
    partId: parts[3] || null    
  };
}


function collectStages() {
  const sections = [
    { id: 'tbody-dfm', title: 'DFM Checking' },
    { id: 'tbody-mfg', title: 'Manufacturing' },
    { id: 'tbody-insp', title: 'Inspection' },
    { id: 'tbody-disp', title: 'Dispatch' }
  ];

  const { partId } = getParamsFromUrl();
  const stages = [];

  sections.forEach(sec => {
    const rows = document.querySelectorAll(`#${sec.id} tr`);
rows.forEach(row => {
  const stage_name = row.children[0].querySelector('input')?.value.trim();
  const stage_date = row.children[1].querySelector('input')?.value;
  const achieve_date = row.children[2].querySelector('input')?.value;
  const assigned_user_id = row.children[6].querySelector('select')?.value;

  // ✅ STRICT FILTER (FINAL)
  if (
    !stage_name &&
    !stage_date &&
    !achieve_date &&
    (!assigned_user_id || assigned_user_id === 'Select Verifier')
  ) {
    return; // ❌ skip empty row
  }

  stages.push({
    product_id: partId,
    stage_name,
    section_title: sec.title,
    stage_date: stage_date || null,
    achieve_date: achieve_date || null,
    remarks: remarks || '',
    assigned_user_id:
      assigned_user_id === 'Select Verifier' ? null : assigned_user_id,
    saved_by_user_id: 1,
    status: 'pending'
  });
});
  });

  return stages;
}

async function saveStages() {
  const { partId } = getParamsFromUrl();

  const rows = document.querySelectorAll('.stage-tbl tbody tr');
  const stages = [];

 rows.forEach(row => {

  //  ONLY SAVE EDITED ROWS
  if (row.dataset.edited !== 'true') return;

  const stage_name = row.querySelector('input[type="text"]')?.value || '';
  const dates = row.querySelectorAll('input[type="date"]');
  const numbers = row.querySelectorAll('input[type="number"]');
  const verifier = row.querySelector('select')?.value || null;

  stages.push({
    product_id: partId,
    stage_name,
    section_title: row.closest('.stage-section')
      .querySelector('.stage-section-title').innerText.trim(),

    stage_date: dates[0]?.value || null,
    achieve_date: dates[1]?.value || null,
    inward: numbers[0]?.value || null,
    outward: numbers[1]?.value || null,

    assigned_user_id: verifier,
    saved_by_user_id: 1,
    status: 'Pending'
  });
});

  if (!stages.length) {
    alert("No stages to save");
    return;
  }

  try {
  const res = await fetch('/api/stages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stages })
  });

  if (!res.ok) throw new Error();

  // GET SAVED STAGES AGAIN (to get IDs)
  const getRes = await fetch(`/api/stages/${partId}`);
  const savedStages = await getRes.json();

  const rows = document.querySelectorAll('.stage-tbl tbody tr');

  for (const row of rows) {

    if (row.dataset.edited !== 'true') continue;

    const stageName = row.querySelector('input[type="text"]')?.value;

    const matched = savedStages.find(s => s.stage_name === stageName);

    if (!matched) continue;

    const stageId = matched.id;

    if (row._files && row._files.length) {

      for (const f of row._files) {
        const formData = new FormData();
        formData.append('file', f.file);
        formData.append('stage_id', stageId);
        formData.append('user_id', 1);

        await fetch('/api/upload-stage-file', {
          method: 'POST',
          body: formData
        });
      }

      //  clear after upload
      row._files = [];
    }
    // mark saved
    row.dataset.edited = 'false';
  }
  alert("Stages + Files saved ✅")
} catch (err) {
  console.error(err);
  alert("Error saving ❌");
}
}

function showSavedMsg() {
  const msg = document.createElement('div');
  msg.innerText = "Saved ✅";
  msg.style.position = "fixed";
  msg.style.top = "20px";
  msg.style.right = "20px";
  msg.style.background = "#10b981";
  msg.style.color = "#fff";
  msg.style.padding = "10px";
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 2000);
}
async function loadStages() {
  const { partId } = getParamsFromUrl();
  if (!partId) return;

  try {
    //  CLEAR OLD TABLE DATA
    ['tbody-dfm','tbody-mfg','tbody-insp','tbody-disp'].forEach(id => {
      const tbody = document.getElementById(id);
      if (tbody) tbody.innerHTML = '';
    });

    //  REBUILD DEFAULT ROWS
    initStages();

    const res = await fetch(`/api/stages/${partId}`);
    const stages = await res.json();

    stages.forEach(stage => {

  let tbodyId = '';

  if (stage.section_title === 'DFM Checking') tbodyId = 'tbody-dfm';
  else if (stage.section_title === 'Manufacturing') tbodyId = 'tbody-mfg';
  else if (stage.section_title === 'Dispatch') tbodyId = 'tbody-disp';
  else if (stage.stage_name === 'Inspection') tbodyId = 'tbody-insp';

  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  let row = [...tbody.querySelectorAll('tr')].find(tr => {
    const name = tr.children[0].querySelector('input')?.value.trim();
    return name && (
  name === stage.section_title || 
  name.includes(stage.stage_name)
    );
  });

  if (!row) {

    const emptyRow = [...tbody.querySelectorAll('tr')].find(tr => {
      const val = tr.children[0].querySelector('input')?.value.trim();
      return !val;
    });

    if (emptyRow) emptyRow.remove();

    if (stage.stage_name === 'Inspection') {

      row = buildRow('Inspection');
      row.dataset.variant = stage.section_title;

      row.children[0].querySelector('input').value =
        `Inspection - ${stage.section_title}`;

    } else {

      row = buildRow(stage.stage_name);

    }

    tbody.appendChild(row);
  }

  row.querySelector('[name="stage_date"]').value = stage.stage_date?.split('T')[0] || '';
  row.querySelector('[name="achieve_date"]').value = stage.achieve_date?.split('T')[0] || '';
  row.querySelector('.inward').value = stage.inward || '';
  row.querySelector('.outward').value = stage.outward || '';
  row.querySelector('.remarks-input').value = stage.remarks || '';

  const select = row.children[6].querySelector('select');
  if (select && stage.assigned_user_id) {
    select.value = stage.assigned_user_id;
  }

  row.dataset.edited = 'false';
});

    updateAllStageStates();

  } catch (err) {
    console.error("Load stages error:", err);
  }
}


function getProjectFromURL() {
  const path = window.location.pathname;
  const parts = path.split('/');
  return parts[2]; // /project-tracker/2 → "2"
}

//getting part files

async function renderDocuments() {
  const container = document.getElementById('documentsContainer');
  const { partId } = getParamsFromUrl();

  if (!partId) {
    container.innerHTML = `<p>No Part Selected</p>`;
    return;
  }

  try {
    // BOTH API CALLS
    const [partRes, stageRes] = await Promise.all([
      fetch(`/api/files/${partId}`),
      fetch(`/api/stage-files-by-part/${partId}`)
    ]);

    const partFiles = await partRes.json();
    const stageFiles = await stageRes.json();

    let html = '';

    // ===========================
    // 📁 PART FILES TABLE
    // ===========================
    if (partFiles.length) {
      html += `
        <h3>📁 Part Files</h3>
        <table class="docs-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Remarks</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
      `;

      partFiles.forEach((f, i) => {
        html += `
          <tr>
            <td>${i + 1}</td>
            <td>${f.original_name}</td>
            <td>${f.file_type}</td>
            <td>${f.remarks || '-'}</td>
            <td>${new Date(f.uploaded_at).toLocaleString()}</td>
            <td><button onclick="viewFile('${f.file_url}')">👁️</button></td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
    }

    // ===========================
    // 📦 STAGE FILES TABLE
    // ===========================
    if (stageFiles.length) {
      html += `
        <h3 style="margin-top:20px;">📦 Stage Files</h3>
        <table class="docs-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
      `;

      stageFiles.forEach((f) => {
        html += `
          <tr>
            <td>${f.stage_name}</td>
            <td>${f.original_name}</td>
            <td>${f.file_type}</td>
            <td>${new Date(f.uploaded_at).toLocaleString()}</td>
            <td><button onclick="viewFile('${f.file_url}')">👁️</button></td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
    }

    if (!html) {
      html = `<p style="text-align:center;">No Documents Uploaded</p>`;
    }

    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error loading documents</p>`;
  }
}

function viewFile(url) {
  window.open(url, '_blank'); 
}


async function updatePartFileCount() {
  const { partId } = getParamsFromUrl();
  if (!partId) return;

  try {
    const res = await fetch(`/api/files/${partId}`);
    const files = await res.json();

    const countSpan = document.querySelector('.part-files-text .file-count');
    if (countSpan) {
      countSpan.textContent = files.length;
    }

  } catch (err) {
    console.error(err);
  }
}

async function saveSingleRowWithFiles(icon) {
  const row = icon.closest('tr');

  let stageId = await saveSingleRow(row);

  if (!stageId) {
    alert("❌ Failed to save");
    return;
  }

  // upload files
  if (row._files && row._files.length) {
    for (const f of row._files) {
      const formData = new FormData();
      formData.append('file', f.file);
      formData.append('stage_id', stageId);
      formData.append('user_id', 1);

      await fetch('/api/upload-stage-file', {
        method: 'POST',
        body: formData
      });
    }

    row._files = [];
  }

  alert("Saved successfully ✅");
}

async function saveSingleRow(row) {

  const { partId } = getParamsFromUrl();

  let stageName = row.children[0].querySelector('input').value.trim();

  
  if (stageName.startsWith('Inspection')) {
    stageName = 'Inspection';
  }

  const stageDate = row.querySelector('[name="stage_date"]').value;
  const achieveDate = row.querySelector('[name="achieve_date"]').value;
  const inward = row.querySelector('.inward').value;
  const outward = row.querySelector('.outward').value;
  const assignedUser = row.children[6].querySelector('select').value;

  // 🔥 Decide section title
  const isInspection = row.closest('#section-insp');

  const sectionTitle = isInspection
    ? (row.dataset.variant || 'Inspection')
    : row.closest('.stage-section')
        .querySelector('.stage-section-title').innerText.trim();

  const payload = {
    stages: [{
      product_id: partId,
      stage_name: stageName,
      section_title: sectionTitle,
      stage_date: stageDate,
      achieve_date: achieveDate,
      inward,
      outward,
      assigned_user_id: assignedUser,
      saved_by_user_id: 1,
      status: 1
    }]
  };

  await fetch('/api/stages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  // 🔥 get ID again
  const getRes = await fetch(`/api/stages/${partId}`);
  const stages = await getRes.json();

  const found = stages.find(s =>
    s.stage_name === stageName &&
    s.section_title === sectionTitle
  );

  return found?.id || null;
}

function handleMfgVariantFiles(input, variant) {
  if (!_uploadTrigger) return;
  if (!_uploadTrigger._files) _uploadTrigger._files = [];
  Array.from(input.files).forEach(f => {
    _uploadTrigger._files.push({
      name: f.name,
      ext: f.name.split('.').pop().toUpperCase(),
      variant: variant,
      url: URL.createObjectURL(f),
      remarks: ''
    });
  });
  input.value = '';
  renderUploadTable(_uploadTrigger._files);
}


function showFullFileName(icon, fullName) {
  // Remove any existing tooltip
  const existing = document.getElementById('fileNameTooltip');
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.id = 'fileNameTooltip';
  tooltip.textContent = fullName;
  Object.assign(tooltip.style, {
    position: 'fixed',
    background: '#1f2937',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    maxWidth: '320px',
    wordBreak: 'break-all',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: '99999',
    lineHeight: '1.5'
  });

  document.body.appendChild(tooltip);

  // Position near the icon
  const rect = icon.getBoundingClientRect();
  let top = rect.bottom + 6;
  let left = rect.left;

  if (left + 320 > window.innerWidth) {
    left = window.innerWidth - 330;
  }
  if (top + 60 > window.innerHeight) {
    top = rect.top - 60;
  }

  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';

  // Close on clicking anywhere else
  setTimeout(() => {
    document.addEventListener('click', function closeTooltip(e) {
      if (!tooltip.contains(e.target)) {
        tooltip.remove();
        document.removeEventListener('click', closeTooltip);
      }
    });
  }, 100);
}

function setInspVariant(value) {
  if (!value) return;

  const tbody = document.getElementById('tbody-insp');
  const rows = tbody.querySelectorAll('tr');

  rows.forEach(row => {
    const stageInput = row.querySelector('input[type="text"]');
    if (stageInput) {
      stageInput.value = value;
    }
  });
}