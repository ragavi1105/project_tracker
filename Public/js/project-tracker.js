
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
        <i class="fa-solid fa-circle-exclamation" title="Alert" onclick="openAlertPopup(this)"></i>
        ${isDefault
          ? `<span title="Cannot delete" style="
                display:inline-flex;align-items:center;justify-content:center;
                width:16px;height:16px;border-radius:50%;
                border:2px solid #ef4444;position:relative;
                cursor:not-allowed;opacity:0.55;flex-shrink:0;">
              <span style="position:absolute;width:140%;height:2px;
                background:#ef4444;transform:rotate(45deg);
                top:50%;left:-20%;margin-top:-1px;">
              </span>
            </span>`
          : `<i class="fa-regular fa-circle-xmark" title="Remove" onclick="removeRow(this)"></i>`
        }
      </div>
    </td>
  `;

  //  NOW attach listeners
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
  uploadTrigger = tr;

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
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (tbodyId === 'tbody-insp') {
    const sel = document.getElementById('inspVariantSelect');
    const selectedValue = sel ? sel.value : '';

    const row = buildRow('Inspection');

    if (selectedValue) {
      row.dataset.variant = selectedValue;
      row.children[0].querySelector('input').value = selectedValue;
    } else {
      row.dataset.variant = 'Inspection';
      row.children[0].querySelector('input').value = 'Inspection';
    }

    tbody.appendChild(row);

    if (sel) sel.value = '';
    return;
  }

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

  // Make Inward and Outward readonly for DFM rows
  [dfm1, dfm2].forEach(row => {
    ['.inward', '.outward'].forEach(cls => {
      const el = row.querySelector(cls);
      el.readOnly = true;
      el.tabIndex = -1;
      el.style.cursor = 'not-allowed';
      el.style.userSelect = 'none';
      // block typing but keep pointer events so cursor shows
      el.addEventListener('keydown', e => e.preventDefault());
      el.addEventListener('mousedown', e => e.preventDefault());
    });
  });

 
  // Mfg and Disp get default row, Inspection starts empty
  ['tbody-mfg', 'tbody-rm', 'tbody-disp'].forEach(id => {
    const row = buildRow('', null, true);
    row.classList.add('default-row');
    document.getElementById(id).appendChild(row);
  });
 
  // Inspection → 1 default row, stage name driven by dropdown
  const inspRow = buildRow('Inspection', null, true);
  inspRow.classList.add('default-row');
  document.getElementById('tbody-insp').appendChild(inspRow);

  // Wire up the dropdown to update default row stage name only
  const inspSel = document.getElementById('inspVariantSelect');
  if (inspSel) {
    inspSel.addEventListener('change', function () {
      const val = this.value;
      const defaultRow = document.querySelector('#tbody-insp tr.default-row');
      if (defaultRow) {
        defaultRow.children[0].querySelector('input').value = val || 'Inspection';
        defaultRow.dataset.edited = 'true';
      }
    });
  }
}

function getSectionIdForTbody(tbodyId) {
  return {
    'tbody-dfm':  'section-dfm',
    'tbody-rm':   'section-rm',
    'tbody-mfg':  'section-mfg',
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
    engineer: document.getElementById('engineerInput').value
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


    function setSelectValue(id, value) {

  if (!value) return;

  const el = document.getElementById(id);

  if (!el) return;

  const strValue = String(value);

  [...el.options].forEach(option => {

    option.selected =
      String(option.value) === strValue;

  });

}

    // =====================================================
    // REMARKS POPUP — positioned near clicked field
    // =====================================================
    let _remarksTarget = null;
    let _remarksMode = 'edit';

    document.addEventListener('click', function(e) {
      const popup = document.getElementById('remarksPopup');
      let remarkTrigger = null;

              if (e.target.closest('.remarks-input')) {
          remarkTrigger = e.target.closest('.remarks-input');
          _remarksMode = 'edit';

        } else if (e.target.closest('.remarks-icon')) {
          remarkTrigger = e.target.closest('.remarks-field')
                          .querySelector('.remarks-input');
          _remarksMode = 'history';
        }
            if (remarkTrigger) {
        _remarksTarget = remarkTrigger;
        renderRemarksHistory();


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

   
let _uploadTrigger = null;

document.addEventListener('click', function (e) {

  const partTrigger = e.target.closest('.part-files-text');

 if (partTrigger) {
    _uploadTrigger = partTrigger;
    _uploadTrigger._type = 'part';

    if (!_uploadTrigger._files) {
      _uploadTrigger._files = [];
    }

    renderUploadTable(_uploadTrigger._files);
    setUploadPopupTitle('Project Files');

    document.getElementById('uploadPopup').classList.add('active');
    document.getElementById('uploadPopupOverlay').classList.add('active');

    return;
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
    setUploadPopupTitle('Stage Files');

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

// Check if this row belongs to the Dispatch section
const isDispatchRow = !!row.closest('#section-disp');
const isRmRow = !!row.closest('#section-rm');
_uploadTrigger._type = isDispatchRow ? 'disp' : isRmRow ? 'rm' : 'stage';

  if (!_uploadTrigger._files) {
    _uploadTrigger._files = [];
  }

  console.log("Upload Trigger Row:", _uploadTrigger);
  console.log("Stage ID:", _uploadTrigger.getAttribute('data-stage-id'));

  renderUploadTable(_uploadTrigger._files);
  setUploadPopupTitle('Stage Files');

  document.getElementById('uploadPopup').classList.add('active');
  document.getElementById('uploadPopupOverlay').classList.add('active');
});

function setUploadPopupTitle(title) {
  const titleEl = document.querySelector('.upload-popup-title span');
  if (titleEl) titleEl.textContent = title;
}


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
  const isMfg   = _uploadTrigger?._type === 'mfg';
  const isDisp  = _uploadTrigger?._type === 'disp';
  const isRm    = _uploadTrigger?._type === 'rm';

  if (isMfg) {
    // ── Hide dispatch zones if open ──
    const dispZonesEl = document.getElementById('dispZones');
    if (dispZonesEl) dispZonesEl.style.display = 'none';

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
 } 

 else if (isRm) {
    // Hide other zones
    const mfgZonesEl = document.getElementById('mfgZones');
    if (mfgZonesEl) mfgZonesEl.style.display = 'none';
    const dispZonesEl = document.getElementById('dispZones');
    if (dispZonesEl) dispZonesEl.style.display = 'none';

    document.querySelector('.upload-drop-zone').style.display = 'none';

    let rmZones = document.getElementById('rmZones');
    if (!rmZones) {
      rmZones = document.createElement('div');
      rmZones.id = 'rmZones';
      rmZones.style.cssText = 'display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;';
      rmZones.innerHTML = `
        <div style="flex:1;min-width:130px;border:2px dashed #e5e7eb;border-radius:7px;padding:16px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('rmRmPicker').click()">
          <i class="fa-solid fa-boxes-stacked" style="font-size:20px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">RM</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="rmRmPicker" multiple style="display:none;"
                 onchange="handleRmVariantFiles(this,'RM')" />
        </div>
        <div style="flex:1;min-width:130px;border:2px dashed #e5e7eb;border-radius:7px;padding:16px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('rmRmtcPicker').click()">
          <i class="fa-solid fa-file-shield" style="font-size:20px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">RMTC</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="rmRmtcPicker" multiple style="display:none;"
                 onchange="handleRmVariantFiles(this,'RMTC')" />
        </div>
      `;
      document.querySelector('.upload-popup-body').prepend(rmZones);
    } else {
      rmZones.style.display = 'flex';
    }

    thead.innerHTML = `
      <tr>
        <th>File Name</th>
        <th>File Type</th>
        <th>Variant</th>
        <th>Action</th>
      </tr>`;

    // Render files with variant badge — same style as dispatch
    if (!files || files.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="upload-empty-cell">No files added yet</td></tr>`;
      return;
    }

    const variantColors = {
      'RM':   { bg: '#dbeafe', color: '#1d4ed8' },
      'RMTC': { bg: '#dcfce7', color: '#166534' }
    };

    files.forEach((f, i) => {
      const vc = variantColors[f.variant] || { bg: '#f3f4f6', color: '#374151' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="upload-file-name">
          <i class="fa-solid fa-file-lines"></i>
          ${f.name.length > 50
            ? `<span>${f.name.substring(0, 50)}...</span>
               <i class="fa-solid fa-circle-exclamation"
                  title="${f.name}"
                  onclick="showFullFileName(this, '${f.name.replace(/'/g, "\\'")}')"
                  style="color:#f59e0b;cursor:pointer;font-size:13px;margin-left:4px;"></i>`
            : f.name}
        </td>
        <td><span class="upload-type-badge">${f.ext}</span></td>
        <td>
          <span style="background:${vc.bg};color:${vc.color};
                       font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">
            ${f.variant}
          </span>
        </td>
        <td class="upload-actions-cell">
          <button class="upload-btn-del" onclick="deleteUploadFile(${i})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
    return;
  }

else if (isDisp) {
    const mfgZonesEl = document.getElementById('mfgZones');
    if (mfgZonesEl) mfgZonesEl.style.display = 'none';
    const rmZonesEl = document.getElementById('rmZones');
    if (rmZonesEl) rmZonesEl.style.display = 'none';

    document.querySelector('.upload-drop-zone').style.display = 'none';

    let dispZones = document.getElementById('dispZones');
    if (!dispZones) {
      dispZones = document.createElement('div');
      dispZones.id = 'dispZones';
      dispZones.style.cssText = 'display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;';
      dispZones.innerHTML = `
        <div style="flex:1;min-width:130px;border:2px dashed #e5e7eb;border-radius:7px;padding:16px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('dispPartPicker').click()">
          <i class="fa-solid fa-camera" style="font-size:20px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">Part Photo</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="dispPartPicker" multiple accept="image/*" style="display:none;"
                 onchange="handleDispVariantFiles(this,'Part Photo')" />
        </div>
        <div style="flex:1;min-width:130px;border:2px dashed #e5e7eb;border-radius:7px;padding:16px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('dispPackingPicker').click()">
          <i class="fa-solid fa-box" style="font-size:20px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">Packing Photo</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="dispPackingPicker" multiple accept="image/*" style="display:none;"
                 onchange="handleDispVariantFiles(this,'Packing Photo')" />
        </div>
        <div style="flex:1;min-width:130px;border:2px dashed #e5e7eb;border-radius:7px;padding:16px;
                    text-align:center;cursor:pointer;"
             onmouseover="this.style.borderColor='#fa788d'"
             onmouseout="this.style.borderColor='#e5e7eb'"
             onclick="document.getElementById('dispListPicker').click()">
          <i class="fa-solid fa-list-check" style="font-size:20px;color:#fa788d;display:block;margin-bottom:6px;"></i>
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 3px;">Packing List</p>
          <span style="font-size:11px;color:#aaa;">Click to upload</span>
          <input type="file" id="dispListPicker" multiple style="display:none;"
                 onchange="handleDispVariantFiles(this,'Packing List')" />
        </div>
      `;
      document.querySelector('.upload-popup-body').prepend(dispZones);
    } else {
      dispZones.style.display = 'flex';
    }

    thead.innerHTML = `
      <tr>
        <th>File Name</th>
        <th>File Type</th>
        <th>Variant</th>
        <th>Actions</th>
      </tr>`;

    // Render files with variant color badges
    if (!files || files.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="upload-empty-cell">No files added yet</td></tr>`;
      return;
    }

    const variantColors = {
      'Part Photo':    { bg: '#fef3c7', color: '#92400e' },
      'Packing Photo': { bg: '#dbeafe', color: '#1d4ed8' },
      'Packing List':  { bg: '#dcfce7', color: '#166534' }
    };

    files.forEach((f, i) => {
      const vc = variantColors[f.variant] || { bg: '#f3f4f6', color: '#374151' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="upload-file-name">
          <i class="fa-solid fa-file-lines"></i>
          ${f.name.length > 50
            ? `<span>${f.name.substring(0, 50)}...</span>
               <i class="fa-solid fa-circle-exclamation"
                  title="${f.name}"
                  onclick="showFullFileName(this, '${f.name.replace(/'/g, "\\'")}')"
                  style="color:#f59e0b;cursor:pointer;font-size:13px;margin-left:4px;"></i>`
            : f.name}
        </td>
        <td><span class="upload-type-badge">${f.ext}</span></td>
        <td>
          <span style="background:${vc.bg};color:${vc.color};
                       font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">
            ${f.variant}
          </span>
        </td>
        <td class="upload-actions-cell">
          <button class="upload-btn-del" onclick="deleteUploadFile(${i})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
    return;
}
else {
    // ── Hide mfg/disp/rm zones if switching back ──
    const zonesDiv = document.getElementById('mfgZones');
    if (zonesDiv) zonesDiv.style.display = 'none';
    const dispZonesEl = document.getElementById('dispZones');
    if (dispZonesEl) dispZonesEl.style.display = 'none';
    const rmZonesEl = document.getElementById('rmZones');
    if (rmZonesEl) rmZonesEl.style.display = 'none';
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

    if (isMfg || isDisp) {
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

  function insertFiles() {
  if (!_uploadTrigger) return;

  if (_uploadTrigger._type === 'stage') {
    insertStageFiles();
  } else if (_uploadTrigger._type === 'disp') {
    insertDispFiles();
  } else if (_uploadTrigger._type === 'part') {
    insertPartFiles();
  } else if (_uploadTrigger._type === 'mfg') {
    insertMfgFiles();
  } else if (_uploadTrigger._type === 'rm') {
    insertRmFiles();
  }
}

//insert stage files
async function insertStageFiles() {
  if (!_uploadTrigger || !_uploadTrigger._files) return;

  const row = _uploadTrigger;
  const stageId = row.dataset?.stageId;

  if (stageId) {
    // Row already saved — upload immediately
    for (const f of row._files) {
      const formData = new FormData();
      formData.append('file', f.file);
      formData.append('stage_id', stageId);
      formData.append('user_id', 1);
      formData.append('file_type', 'stage');
      if (f.variant) formData.append('variant', f.variant);

      await fetch('/api/upload-stage-file', {
        method: 'POST',
        body: formData
      });
    }

    const countSpan = row.querySelector('.stage-upload-trigger .file-count');
    if (countSpan) {
      const existing = parseInt(countSpan.textContent) || 0;
      countSpan.textContent = existing + row._files.length;
    }

    row._files = [];
    alert("Files saved ✅");
  } else {
    // Row not yet saved — keep locally, save on row Save click
    const countSpan = row.querySelector('.stage-upload-trigger .file-count');
    if (countSpan) countSpan.textContent = row._files.length;
    alert("Files added. Click Save (💾) on the row to store in DB ✅");
  }

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

    formData.append('file_type', 'project');
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

function handleDispVariantFiles(input, variant) {
  if (!_uploadTrigger) return;
  if (!_uploadTrigger._files) _uploadTrigger._files = [];
  Array.from(input.files).forEach(f => {
    _uploadTrigger._files.push({
      file: f,
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


function handleRmVariantFiles(input, variant) {
  if (!_uploadTrigger) return;
  if (!_uploadTrigger._files) _uploadTrigger._files = [];
  Array.from(input.files).forEach(f => {
    _uploadTrigger._files.push({
      file: f,
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

// ✅ Must be at TOP LEVEL — not inside any other function
async function insertMfgFiles() {
  if (!_uploadTrigger || !_uploadTrigger._files || !_uploadTrigger._files.length) {
    alert("⚠️ No files to upload");
    return;
  }

  try {
    const { poId } = getParamsFromUrl();  

    for (const f of _uploadTrigger._files) {
      const formData = new FormData();
      formData.append('user_id', '1');
      formData.append('product_id', poId);  
      formData.append('stage_varient', f.variant);

      formData.append('file_type', 'variant');

      formData.append('file', f.file, f.name);

      const res = await fetch('/api/upload-mfg-file', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`Failed for ${f.name}`);
    }

    alert("Manufacturing files saved ✅");
    _uploadTrigger._files = [];
    renderUploadTable([]);
    closeUploadPopup();

  } catch (err) {
    console.error(err);
    alert("❌ Error uploading files");
  }
}


async function insertRmFiles() {
  if (!_uploadTrigger || !_uploadTrigger._files || !_uploadTrigger._files.length) {
    alert("⚠️ No files to upload");
    return;
  }

  const row = _uploadTrigger;
  const stageId = row.dataset?.stageId;

  if (stageId) {
    for (const f of row._files) {
      const formData = new FormData();
      formData.append('file', f.file);
      formData.append('stage_id', stageId);
      formData.append('user_id', 1);
      formData.append('file_type', 'stage');
      formData.append('variant', f.variant);

      await fetch('/api/upload-stage-file', {
        method: 'POST',
        body: formData
      });
    }

    const countSpan = row.querySelector('.stage-upload-trigger .file-count');
    if (countSpan) {
      const existing = parseInt(countSpan.textContent) || 0;
      countSpan.textContent = existing + row._files.length;
    }

    row._files = [];
    alert("RM/RMTC files saved ✅");
  } else {
    const countSpan = row.querySelector('.stage-upload-trigger .file-count');
    if (countSpan) countSpan.textContent = row._files.length;
    alert("Files added. Click Save (💾) on the row to store in DB ✅");
  }

  closeUploadPopup();
}

async function insertDispFiles() {
  if (!_uploadTrigger || !_uploadTrigger._files || !_uploadTrigger._files.length) {
    alert("⚠️ No files to upload");
    return;
  }

  const row = _uploadTrigger;
  const stageId = row.dataset?.stageId;

  if (stageId) {
    for (const f of row._files) {
      const formData = new FormData();
      formData.append('file', f.file);
      formData.append('stage_id', stageId);
      formData.append('user_id', 1);
      formData.append('file_type', 'stage');
      formData.append('variant', f.variant);

      await fetch('/api/upload-stage-file', {
        method: 'POST',
        body: formData
      });
    }

    const countSpan = row.querySelector('.stage-upload-trigger .file-count');
    if (countSpan) {
      const existing = parseInt(countSpan.textContent) || 0;
      countSpan.textContent = existing + row._files.length;
    }

    row._files = [];
    alert("Dispatch files saved ✅");
  } else {
    const countSpan = row.querySelector('.stage-upload-trigger .file-count');
    if (countSpan) countSpan.textContent = row._files.length;
    alert("Files added. Click Save (💾) on the row to store in DB ✅");
  }

  closeUploadPopup();
}


    // ── Sync the file count badge on the upload trigger icon ──
    function syncUploadCount() {
      if (!_uploadTrigger) return;
      const count = (_uploadTrigger._files || []).length;
      const span = _uploadTrigger.querySelector('.file-count');
      if (span) span.textContent = count;
    }


    // ── Close the find project modal and reset fields ──
    function closeFindModal() {
      document.getElementById('findModal').classList.remove('active');
      document.getElementById('findModalOverlay').classList.remove('active');
      document.getElementById('findModalError').textContent = '';
      document.getElementById('findModalInput').value = '';
    }

    // ── Navigate to the searched project page ──
    async function doFindProject() {

  const q = document.getElementById('findModalInput').value.trim();

  const errEl = document.getElementById('findModalError');

  if (!q) {

    errEl.textContent =
      'Please enter a Project ID or PO Number.';

    return;
  }

  errEl.textContent = '';

  try {

    const res = await fetch(
      `/api/project/search?q=${encodeURIComponent(q)}`
    );

    if (!res.ok) throw new Error();

    const data = await res.json();

    const firstProject = data.results?.[0];

    if (!firstProject) {

      errEl.textContent = 'No Project Found';

      return;
    }

    // ✅ Open using purchase_orders.id
    window.location.href =
      `/project-tracker/${firstProject.id}`;

  } catch (err) {

    console.error(err);

    errEl.textContent = 'Error finding project';
  }
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
        trigger._files.splice(entry.fileIndex, 1);  
        syncUploadCount();                            
      }

      renderDocuments();                            
      showToast('Deleted successfully');            
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

  const stageId = row.dataset.stageId;
  const historyDiv = document.getElementById('remarksHistory');

  if (!historyDiv) {
    console.error("❌ remarksHistory div not found");
    return;
  }


  if (_remarksMode === 'edit') {
  historyDiv.innerHTML = `
    <div class="remarks-history-header">Add Comment</div>
    <textarea id="remarksText"
      placeholder="Enter comment..."
      style="width:100%;height:80px;margin-bottom:6px;padding:8px;border:1px solid #ddd;border-radius:6px;"></textarea>
    <div style="text-align:right;margin-bottom:4px;">
      <button onclick="saveRemarks()">
        Save
      </button>
    </div>
  `;
  setTimeout(() => document.getElementById('remarksText')?.focus(), 50);
  return;
}


  const localComments = row._comments || [];

  if (!stageId) {
    if (!localComments.length) {
      historyDiv.innerHTML = `
  <div style="
    border: 1px solid #e5e7eb;
    padding: 12px;
    border-radius: 3px;
    background-color: #f0f8ff;
    color: #6b7280;
    text-align: center;
    font-size: 14px;
  ">
    No comments yet
  </div>
`;
      return;
    }

    historyDiv.innerHTML = `
      <div class="remarks-history-header">Comments</div>
      ${localComments.map(item => `
        <div class="remarks-history-item">
          <div class="comment-text">${item.comment_text}</div>
          <div class="timestamp">
            <span class="user">${item.user_name}</span>
            <span class="dot">•</span>
            <span class="date">${new Date(item.created_at).toLocaleDateString()}</span>
            <span class="time">${new Date(item.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      `).join('')}
    `;
    return;
  }

  try {
    historyDiv.innerHTML = 'Loading...';

    const res = await fetch(`/api/stage-comments/${stageId}`);
    if (!res.ok) throw new Error("API failed");

    const dbComments = await res.json();

    const allComments = [...dbComments, ...localComments];

    if (!allComments.length) {
      historyDiv.innerHTML = '<div>No comments yet</div>';
      return;
    }

    historyDiv.innerHTML = `
      <div class="remarks-history-header">Comments</div>
      ${allComments.map(item => `
        <div class="remarks-history-item">
          <div class="comment-text">${item.comment_text}</div>
          <div class="timestamp">
            <span class="user">${item.user_name || 'You'}</span>
            <span class="dot">•</span>
            <span class="date">${new Date(item.created_at).toLocaleDateString()}</span>
            <span class="time">${new Date(item.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      `).join('')}
    `;

  } catch (err) {
    console.error("❌ Error loading comments:", err);
    historyDiv.innerHTML = '<div>Error loading comments</div>';
  }
}




async function saveRemarks() {
  const row = _remarksTarget.closest('tr');
  const text = document.getElementById('remarksText').value.trim();

  if (!text) {
    alert("⚠️ Enter comment");
    return;
  }

  const stageId = row.dataset.stageId;

  if (stageId) {
    try {
      await fetch('/api/stage-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: stageId,
          comment_text: text
        })
      });

      alert("Comment saved ✅");

    } catch (err) {
      console.error(err);
      alert("Error saving comment");
      return;
    }
  }

  else {
    if (!row._comments) row._comments = [];

    row._comments.push({
      comment_text: text,
      created_at: new Date(),
      user_name: 'You'
    });

    alert("Comment saved locally (save stage to persist)");
  }

  // ✅ update input field
  _remarksTarget.value = text;

  document.getElementById('remarksText').value = '';
  closeRemarksPopup();
}





// 🔹 Load Project
async function loadProject() {

  const { poId } = getParamsFromUrl();

  try {

    // ✅ LOAD USERS FIRST
    await loadUsers();

    const res = await fetch(`/api/project/${poId}`);

    if (!res.ok) {
      throw new Error('Not found');
    }

    const data = await res.json();

    console.log("Loaded:", data);

    // =================================================
    // PROJECT INFO
    // =================================================

    document.getElementById('projectId').textContent =
      data.projectId || '';

    document.getElementById('projectStatus').textContent =
      data.status || '';

    document.getElementById('createdAt').textContent =
      data.createdAt || '';

    // =================================================
    // DATES
    // =================================================

    document.getElementById('startDate').value =
      data.startDate || '';

    document.getElementById('reqDate').value =
      data.reqDate || '';

    // 🔒 Lock dates individually

    if (data.startDate) {
      document.getElementById('startDate').disabled = true;
    }

    if (data.reqDate) {
      document.getElementById('reqDate').disabled = true;
    }

    document.getElementById('userName').textContent =
      data.user?.name || 'User';

   setTimeout(() => {

  setSelectValue('pmSelect', data.projectManager);

  setSelectValue('qmSelect', data.qualityManager);

  setSelectValue('peSelect', data.projectEngineer);

}, 200);
    // =================================================
    // ENGINEER INPUT
    // =================================================

    document.getElementById('engineerInput').value =
      data.engineer || '';

    // =================================================
    // LOCK USERS
    // =================================================

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

      document.getElementById('engineerInput').disabled = true;

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
    await loadStages();            
    await updatePartFileCount();  
  }
});


async function loadUsers() {

  try {

    const res = await fetch('/api/users');

    const users = await res.json();

    console.log("Loaded users:", users);

    const pm = document.getElementById('pmSelect');
    const qm = document.getElementById('qmSelect');
    const pe = document.getElementById('peSelect');

    if (!pm || !qm || !pe) {
      console.error("Dropdown elements not found");
      return;
    }

    // RESET
    pm.innerHTML = '<option value="">Select PM</option>';
    qm.innerHTML = '<option value="">Select QM</option>';
    pe.innerHTML = '<option value="">Select DM</option>';

    users.forEach(user => {

      const role =
        user.roles
          ? user.roles.trim().toLowerCase()
          : '';

      console.log(user.name, role);

      const option = document.createElement('option');

      option.value = user.id;

      option.textContent = user.name;

      const rolesArray = role
  .split(',')
  .map(r => r.trim().toLowerCase());


// PM
if (rolesArray.includes('pm')) {
  pm.appendChild(option.cloneNode(true));
}if (rolesArray.includes('qm')) {qm.appendChild(option.cloneNode(true));}
// DM
if (rolesArray.includes('dm')) {
  pe.appendChild(option.cloneNode(true));}
});
    console.log("PM options:", pm.innerHTML);
    console.log("QM options:", qm.innerHTML);
    console.log("DM options:", pe.innerHTML);
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
         <td>
          ${part.part_number.length > 20
            ? `
              ${part.part_number.substring(0, 20)}....
              <span 
                class="info-icon"
                title="${part.part_number}"
                style="cursor:pointer;">
                <i class="fa-solid fa-circle-info" style="display:none;"></i>
              </span>
            `
            : part.part_number
          }
        </td>

<td title="${part.product_name}">
  ${part.product_name.length > 25
    ? part.product_name.substring(0, 25) + "...."
    : part.product_name
  }
</td>
          <td>${part.quantity}</td>
          <td>${part.required_date ? new Date(part.required_date).toLocaleDateString() : '-'}</td>
          <td><span class="status in-progress">In Progress</span></td>
          <td>
            <button class="btn-action view"onclick="event.stopPropagation(); viewPart(this)"> <i class="fa-solid fa-list-check"></i>
              View
            </button>
          </td>
          <td>
            <button class="route-card-btn" onclick="generateRouteCard(this)">
              <i class="fa-solid fa-file-export"></i> Generate
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
    const requiredDateInput =
  document.getElementById('requiredDate');

const saveIcon =
  document.querySelector('.date-save');

if (part.required_date) {

  const d = new Date(part.required_date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  requiredDateInput.value =
    `${year}-${month}-${day}`;

  // ✅ Freeze field
  requiredDateInput.disabled = true;

  // ✅ Disable save icon
  saveIcon.style.pointerEvents = 'none';
  saveIcon.style.opacity = '0.4';

} else {

  requiredDateInput.value = '';

  // ✅ Editable
  requiredDateInput.disabled = false;

  // ✅ Enable save icon
  saveIcon.style.pointerEvents = 'auto';
  saveIcon.style.opacity = '1';

}
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


      let inputVal = row.children[0].querySelector('input')?.value.trim() || '';

      let stage_name = inputVal;
      let section_title = sec.title;

      const stage_date = row.children[1].querySelector('input')?.value;
      const achieve_date = row.children[2].querySelector('input')?.value;
      const inward = row.querySelector('.inward')?.value || null;
      const outward = row.querySelector('.outward')?.value || null;
      const assigned_user_id = row.children[6].querySelector('select')?.value;
      const remarks = row.querySelector('.remarks-input')?.value || '';

      if (sec.title === 'Inspection') {

  const inputVal = row.children[0].querySelector('input')?.value.trim();

  if (inputVal.includes('-')) {

    const parts = inputVal.split('-').map(s => s.trim());

    stage_name = parts[1];      
    section_title = 'Inspection';

  } else {

    stage_name = inputVal;        
    section_title = 'Inspection';
  }
}
      if (
        !inputVal &&
        !stage_date &&
        !achieve_date &&
        (!assigned_user_id || assigned_user_id === 'Select Verifier')
      ) {
        return;
      }

      console.log("FINAL SAVE:", stage_name, section_title);

      stages.push({
        product_id: partId,
        stage_name,
        section_title,
        stage_date: stage_date || null,
        achieve_date: achieve_date || null,
        inward,
        outward,
        remarks,
        assigned_user_id:
          assigned_user_id === 'Select Verifier' ? null : assigned_user_id,
        status: 'closed'  
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

    ['tbody-dfm','tbody-rm','tbody-mfg','tbody-insp','tbody-disp'].forEach(id => {
      const tbody = document.getElementById(id);
      if (tbody) tbody.innerHTML = '';
    });

    initStages();

    const res = await fetch(`/api/stages/${partId}`);
    const stages = await res.json();

    // ✅ If there are saved inspection rows, remove the default placeholder
    const hasInspection = stages.some(s => s.section_title === 'Inspection');
    if (hasInspection) {
      const inspDefaultRow = document.querySelector('#tbody-insp tr.default-row');
      if (inspDefaultRow) inspDefaultRow.remove();
    }

    const sectionStatus = {};


    stages.forEach(stage => {

      let tbodyId = '';

      if (stage.section_title === 'DFM Checking') tbodyId = 'tbody-dfm';
      else if (stage.section_title === 'RM Stage') tbodyId = 'tbody-rm';
      else if (stage.section_title === 'Manufacturing') tbodyId = 'tbody-mfg';
      else if (stage.section_title === 'Dispatch') tbodyId = 'tbody-disp';
      else if (stage.section_title === 'Inspection') tbodyId = 'tbody-insp';

      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;

      let row = null;
     


if (stage.section_title === 'Inspection') {
  row = null;
} else {
  row = [...tbody.querySelectorAll('tr')].find(tr => {
    const name = tr.children[0].querySelector('input')?.value.trim();
    return name && (
      name === stage.section_title ||
      name.includes(stage.stage_name)
    );
  });
}  

      if (!row) {

        const emptyRow = [...tbody.querySelectorAll('tr')].find(tr => {
          const val = tr.children[0].querySelector('input')?.value.trim();
          return !val;
        });

        if (emptyRow) emptyRow.remove();

        if (stage.section_title === 'Inspection') {

          row = buildRow('Inspection');
          row.dataset.variant = stage.section_title;

          row.children[0].querySelector('input').value =
    `Inspection - ${stage.stage_name}`;

        } else {
          row = buildRow(stage.stage_name);
        }


        tbody.appendChild(row);
      }

      row.dataset.stageId = stage.id;

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

      if (stage.status === 'closed') {

        row.dataset.status = 'closed';

        row.querySelectorAll('input, select').forEach(el => {
          el.disabled = true;
        });

      } else {

        row.dataset.status = 'active';
      }

let key;

// map EXACT section
if (stage.section_title === 'DFM Checking') key = 'DFM Checking';
else if (stage.section_title === 'Manufacturing') key = 'Manufacturing';
else if (stage.section_title === 'Dispatch') key = 'Dispatch';
else if (stage.section_title === 'Inspection') key = 'Inspection';

// safety fallback
if (!key) return;

if (!(key in sectionStatus)) {
  sectionStatus[key] = true;
}

if (stage.status !== 'closed') {
  sectionStatus[key] = false;
}

    });

    const map = {
      'DFM Checking': 'section-dfm',
      'Manufacturing': 'section-mfg',
      'Inspection': 'section-insp',
      'Dispatch': 'section-disp'
    };

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

  _projectFilesSnapshot = [];
  _stageFilesSnapshot = [];

  try {
    const [partRes, stageRes] = await Promise.all([
      fetch(`/api/files/${partId}`),
      fetch(`/api/stage-files-by-part/${partId}`)
    ]);

    const partFiles  = await partRes.json();
    const stageFiles = await stageRes.json();

    let html = '';

    // ===========================
    // 📁 PROJECT FILES TABLE
    // ===========================
    if (partFiles.length) {
      html += `
        <h3 class="upload-file">Project Files</h3>
        <div class="table-wrap">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Sl</th>
                <th>File Name</th>
                <th>Type</th>
                <th>Remarks</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
      `;

      partFiles.forEach((f, i) => {
        const fileType = f.original_name?.split('.').pop().toUpperCase() || '-';
        html += `
          <tr>
            <td>${i + 1}</td>
            <td style="color:var(--primary);font-weight:500;">
              ${f.original_name.length > 50
                ? `<span>${f.original_name.substring(0, 50)}...</span>
                   <i class="fa-solid fa-circle-exclamation"
                      title="${f.original_name}"
                      onclick="showFullFileName(this, '${f.original_name.replace(/'/g, "\\'")}')"
                      style="color:var(--primary);cursor:pointer;font-size:13px;margin-left:4px;"></i>`
                : f.original_name}
            </td>
            <td><span class="upload-type-badge">${fileType}</span></td>
            <td>${f.remarks || '—'}</td>
            <td>${new Date(f.uploaded_at).toLocaleString()}</td>
            <td class="doc-actions">
              <i class="fa-solid fa-eye action-icon view" onclick="viewFile('${f.file_url}')" title="View"></i>
              <i class="fa-solid fa-download action-icon download" title="Download"></i>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table></div>`;
    }

    // ===========================
    // 📦 STAGE FILES TABLE
    // ===========================
    if (stageFiles.length) {
      html += `
        <h3 class="upload-file">Stage Files</h3>
        <div class="table-wrap">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Sl</th>
                <th>File Name</th>
                <th>File Type</th>
                <th>Stage Name</th>
                <th>Section</th>
                <th>Variant</th>
                <th>Uploaded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
      `;

      stageFiles.forEach((f, i) => {
        const fileType = f.original_name?.split('.').pop().toUpperCase() || '-';
        const variantColors = {
          'Part Photo':    { bg: '#fef3c7', color: '#92400e' },
          'Packing Photo': { bg: '#dbeafe', color: '#1d4ed8' },
          'Packing List':  { bg: '#dcfce7', color: '#166534' },
          'RM':            { bg: '#dbeafe', color: '#1d4ed8' },
          'RMTC':          { bg: '#dcfce7', color: '#166534' }
        };
        const vc = f.variant ? (variantColors[f.variant] || { bg: '#f3f4f6', color: '#374151' }) : null;

        html += `
          <tr>
            <td>${i + 1}</td>
            <td style="color:var(--primary);font-weight:500;">
              ${f.original_name.length > 50
                ? `<span>${f.original_name.substring(0, 50)}...</span>
                   <i class="fa-solid fa-circle-exclamation"
                      title="${f.original_name}"
                      onclick="showFullFileName(this, '${f.original_name.replace(/'/g, "\\'")}')"
                      style="color:var(--primary);cursor:pointer;font-size:13px;margin-left:4px;"></i>`
                : f.original_name}
            </td>
            <td><span class="upload-type-badge">${fileType}</span></td>
            <td>${f.stage_name || '—'}</td>
            <td>${f.section_title || '—'}</td>
            <td>${vc
              ? `<span style="background:${vc.bg};color:${vc.color};
                             font-size:11px;font-weight:700;
                             padding:2px 8px;border-radius:4px;">
                   ${f.variant}
                 </span>`
              : '—'}</td>
            <td>${new Date(f.uploaded_at).toLocaleString()}</td>
            <td class="doc-actions">
              <i class="fa-solid fa-eye action-icon view" onclick="viewFile('${f.file_url}')" title="View"></i>
              <i class="fa-solid fa-download action-icon download" title="Download"></i>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table></div>`;
    }

    // ===========================
    // EMPTY STATE
    // ===========================
    if (!html) {
      html = `
        <div style="display:flex;flex-direction:column;align-items:center;
                    justify-content:center;padding:60px 20px;color:#9ca3af;">
          <i class="fa-solid fa-folder-open"
             style="font-size:56px;color:#d1d5db;margin-bottom:16px;"></i>
          <p style="font-size:15px;font-weight:600;color:#6b7280;margin:0 0 6px;">
            No Documents Uploaded
          </p>
          <p style="font-size:13px;color:#9ca3af;margin:0;">
            Upload files from the stages to see them here.
          </p>
        </div>
      `;
    }

    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:red;">Error loading documents</p>`;
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

  if (row._comments && row._comments.length) {
    for (const c of row._comments) {
      await fetch('/api/stage-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: stageId,
          comment_text: c.comment_text,
          user_id: 1
        })
      });
    }
    row._comments = [];
  }

 if (row._files && row._files.length) {
    for (const f of row._files) {
      const formData = new FormData();
      formData.append('file', f.file);
      formData.append('stage_id', stageId);
      formData.append('user_id', 1);
      formData.append('file_type', 'stage');
      if (f.variant) formData.append('variant', f.variant); // ✅ sends RM or RMTC tag
      await fetch('/api/upload-stage-file', {
        method: 'POST',
        body: formData
      });
    }

    row._files = [];
  }

  row.dataset.edited = 'false';  
  row.dataset.status = 'closed';

  alert("Saved successfully ✅");
}

async function saveSingleRow(row) {
  const { partId } = getParamsFromUrl();
  let stageName = row.children[0].querySelector('input').value.trim();
  const stageDate = row.querySelector('[name="stage_date"]').value;
  const achieveDate = row.querySelector('[name="achieve_date"]').value;
  const inward = row.querySelector('.inward').value;
  const outward = row.querySelector('.outward').value;
  const assignedUser = row.children[6].querySelector('select').value;
  const comments = row._comments || [];
  const commentText = comments.map(c => c.comment_text).join('\n');

  let sectionTitle;

  if (row.closest('#section-insp')) {
    sectionTitle = 'Inspection';
  } else {
    sectionTitle = row.closest('.stage-section')
      .querySelector('.stage-section-title').innerText.trim();
  }

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
      status: 'active',
    }]
  };

  await fetch('/api/stages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const getRes = await fetch(`/api/stages/${partId}`);
  const stages = await getRes.json();

  const found = stages.find(s =>
    s.stage_name === stageName &&
    s.section_title === sectionTitle
  );

  const stageId = found?.id || null;

  if (stageId) {
    row.setAttribute('data-stage-id', stageId);
  }
  return stageId;
}


function handleMfgVariantFiles(input, variant) {
  if (!_uploadTrigger) return;
  if (!_uploadTrigger._files) _uploadTrigger._files = [];
  Array.from(input.files).forEach(f => {
    _uploadTrigger._files.push({
      file: f,                                    
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

function openAlertPopup(icon) {
  const row = icon.closest('tr');

  // ✅ If already saved → open VERIFY popup
  if (row._alertSaved) {
    openVerifyConfirmPopup(row);
    return;
  }

  // ✅ First time → open Alert popup
  _alertTargetRow = row;

  document.getElementById('alertApproverInput').value = '';
  document.getElementById('alertRemarksInput').value  = '';

  document.getElementById('alertPopup').style.display = 'block';


  
  document.getElementById('alertPopupOverlay').style.display = 'block';
}

function closeAlertPopup() {
  document.getElementById('alertPopup').style.display        = 'none';
  document.getElementById('alertPopupOverlay').style.display = 'none';
  _alertTargetRow = null;
}

let _alertTargetRow = null;

function saveAlertPopup() {
  const approver = document.getElementById('alertApproverInput').value.trim();
  const remarks  = document.getElementById('alertRemarksInput').value.trim();

  if (!approver) {
    document.getElementById('alertApproverInput').style.borderColor = '#ef4444';
    document.getElementById('alertApproverInput').focus();
    return;
  }
  if (!remarks) {
    document.getElementById('alertRemarksInput').style.borderColor = '#ef4444';
    document.getElementById('alertRemarksInput').focus();
    return;
  }

  if (_alertTargetRow) {
    _alertTargetRow._alertApprover = approver;
    _alertTargetRow._alertRemarks  = remarks;
    _alertTargetRow._alertSaved    = true;

    const icon = _alertTargetRow.querySelector('.fa-circle-exclamation');
    if (icon) {
      icon.style.color = '#f59e0b';   // ✅ turn amber when saved
      icon.title = `Verified by: ${approver}`;
    }
  }

  const savedRow = _alertTargetRow;  // ✅ save ref before closing

  closeAlertPopup();                 // ✅ close alert first
  openVerifyConfirmPopup(savedRow);  // ✅ then open verify with saved row
}


//open comfirm popup
function openVerifyConfirmPopup(row) {
  const target = row || _alertTargetRow;
  if (!target) return;

  document.getElementById('verifyConfirmApprover').textContent =
    target._alertApprover || '—';

  document.getElementById('verifyConfirmRemarks').textContent =
    target._alertRemarks || '—';

  // ✅ Use style.display not classList
  document.getElementById('verifyConfirmPopup').style.display = 'block';
  document.getElementById('verifyConfirmOverlay').style.display = 'block';
}

function closeVerifyConfirmPopup() {
  document.getElementById('verifyConfirmPopup').style.display = 'none';
  document.getElementById('verifyConfirmOverlay').style.display = 'none';
}

function closeSuccessPopup() {
  document.getElementById('verifySuccessPopup').style.display   = 'none';
  document.getElementById('verifySuccessOverlay').style.display = 'none';
}

//part required date 
async function saveRequiredDate() {

  const { partId } = getParamsFromUrl();

  const requiredDateInput =
    document.getElementById('requiredDate');

  const saveIcon =
    document.querySelector('.date-save');

  const required_date =
    requiredDateInput.value;

  if (!required_date) {
    alert("Select required date");
    return;
  }

  try {

    const res = await fetch('/api/part/save-required-date', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        partId,
        required_date
      })
    });

    if (!res.ok) {
      throw new Error();
    }

    // ✅ Freeze immediately
    requiredDateInput.disabled = true;

    saveIcon.style.pointerEvents = 'none';
    saveIcon.style.opacity = '0.4';

    showToast('Required date saved ✅');

  } catch (err) {

    console.error(err);

    alert('Save failed');

  }
}

