    let currentUserRoles = [];
    let stageUsers = [];
    let selectedPartId = null;

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
      <option value="${u.id}">
        ${u.name}
      </option>
    `).join('')}
  `;

      const tr = document.createElement('tr');
      // ✅ FIRST create HTML
      tr.innerHTML = `
        <td><input type="text" value="${stageName}" placeholder="Stage name" /></td>
        <td><input type="date" name="stage_date" /></td>
        <td><input type="date" name="achieve_date" /></td>
        <td><input type="number" class="inward" placeholder="In Qty" /></td>
        <td><input type="number" class="outward" placeholder="Out Qty" onchange="validateInwardOutward(this)" oninput="validateInwardOutward(this)" /></td>
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
      _uploadTrigger = tr;
      document.getElementById('uploadPopup').classList.add('active');
      document.getElementById('uploadPopupOverlay').classList.add('active');
      renderUploadTable(_uploadTrigger._files || []);
    });
      const remarksInput = tr.querySelector('.remarks-input');
      remarksInput._history = [];
      const inwardInput =
      tr.querySelector('.inward');
   if (inwardInput) {
  inwardInput.addEventListener('focus', () => {
    if (!validateStageFlow(tr)) {
      inwardInput.value = '';

      setTimeout(() => {
        inwardInput.blur();
      }, 10);
    }
  });
    }
   const stageDateInput =
  tr.querySelector('[name="stage_date"]');
  const achieveDateInput =
    tr.querySelector('[name="achieve_date"]');
if (stageDateInput) {

  stageDateInput.addEventListener('focus', () => {
    applyStageDateRestriction(tr);
  });

  stageDateInput.addEventListener('change', () => {

    // Apply restriction to this row
    applyStageDateRestriction(tr);

    const allRows = [
        ...document.querySelectorAll('#tbody-dfm tr'),
        ...document.querySelectorAll('#tbody-rm tr'),
        ...document.querySelectorAll('#tbody-mfg tr'),
        ...document.querySelectorAll('#tbody-insp tr'),
        ...document.querySelectorAll('#tbody-disp tr')
    ];
    const index = allRows.indexOf(tr);
    // Apply restriction to the next row
    if (index >= 0 && index < allRows.length - 1) {
        applyStageDateRestriction(allRows[index + 1]);
    }

});
}
if (achieveDateInput) {
    achieveDateInput.addEventListener('focus', () => {
        applyStageDateRestriction(tr);
    });

    achieveDateInput.addEventListener('change', () => {
    applyStageDateRestriction(tr);

    const allRows = [
        ...document.querySelectorAll('#tbody-dfm tr'),
        ...document.querySelectorAll('#tbody-rm tr'),
        ...document.querySelectorAll('#tbody-mfg tr'),
        ...document.querySelectorAll('#tbody-insp tr'),
        ...document.querySelectorAll('#tbody-disp tr')
    ];

    const index = allRows.indexOf(tr);
    if (index >= 0 && index < allRows.length - 1) {
        applyStageDateRestriction(allRows[index + 1]);
    }
});
}
return tr;
        }

 function freezeRowFields(row) {
  const isPM =
    currentUserRoles.includes('pm');
  if (isPM) return;
  const stageDate = row.querySelector('[name="stage_date"]');
  const achieveDate = row.querySelector('[name="achieve_date"]');
  const inward = row.querySelector('.inward');
  const outward = row.querySelector('.outward');
  // Lock only filled fields
  if (stageDate?.value) {stageDate.disabled = true;}
  if (achieveDate?.value) {achieveDate.disabled = true;}
  if (inward?.value) {inward.disabled = true;}
  if (outward?.value) {outward.disabled = true;}
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
        if (sel) sel.value = '';
        return;
      }

      const newRow = buildRow('');
      // ✅ If adding to DFM section, disable inward/outward just like default rows
      if (tbodyId === 'tbody-dfm') {
        ['.inward', '.outward'].forEach(cls => {
          const el = newRow.querySelector(cls);
          el.readOnly = true;
          el.tabIndex = -1;
          el.style.cursor = 'not-allowed';
          el.style.userSelect = 'none';
          el.style.background = '#f3f4f6';
          el.addEventListener('keydown', e => e.preventDefault());
          el.addEventListener('mousedown', e => e.preventDefault());
        });
      }
      tbody.appendChild(newRow);
    }

        // ── Remove a row ──
    function removeRow(icon) {
      const tr = icon.closest('tr');
      if (tr.classList.contains('default-row')) {
        showToast('This row cannot be deleted', 'warning');
        return;
      }
      const tbody = tr.closest('tbody');
      const allRows = tbody.querySelectorAll('tr');
      if (allRows.length === 1) {
        showToast('At least one row is required', 'warning');
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

   
   // Manufacturing
const mfgRow = buildRow('');
mfgRow.classList.add('default-row');
document.getElementById('tbody-mfg').appendChild(mfgRow);
// RM Stage Row
const rmRow1 = buildRow('RM inward (QC Inspection)');
rmRow1.classList.add('default-row');
const rmInwardInputAuto =
  rmRow1.querySelector('.inward');
const rmVerifierSelect =
  rmRow1.querySelector('select');
if (rmInwardInputAuto && rmVerifierSelect) {
  rmInwardInputAuto.addEventListener('input', () => {
    // only if verifier not already selected
    if (!rmVerifierSelect.value) {
      const qmId = document.getElementById('qmSelect')?.value;
      if (qmId) { rmVerifierSelect.value = qmId;}
    }
  });
}
// Disable outward for RM inward (QC Inspection)
const rmOutward = rmRow1.querySelector('.outward');
if (rmOutward) {
  rmOutward.readOnly = true;
  rmOutward.disabled = true;
  rmOutward.placeholder = '-';
  rmOutward.style.background = '#f3f4f6';
  rmOutward.style.cursor = 'not-allowed';
}

// Stores RM Row
const rmRow2 = buildRow('Stores RM Outward');
rmRow2.classList.add('default-row');
// Disable inward for Stores RM Outward
const rmInward = rmRow2.querySelector('.inward');
if (rmInward) {
  rmInward.readOnly = true;
  rmInward.disabled = true;
  rmInward.placeholder = '-';
  rmInward.style.background = '#f3f4f6';
  rmInward.style.cursor = 'not-allowed';
}

[rmRow1, rmRow2].forEach(row => {

  const nameInput = row.children[0].querySelector('input');

  if (nameInput) {
    nameInput.readOnly = true;
    nameInput.style.background = '#f3f4f6';
    nameInput.style.cursor = 'not-allowed';
    nameInput.style.color = '#6b7280';
  }

  document.getElementById('tbody-rm').appendChild(row);

});

// Dispatch
const dispRow = buildRow('Dispatch');
dispRow.classList.add('default-row');

const dispInput = dispRow.children[0].querySelector('input');

if (dispInput) {
  dispInput.readOnly = true;
  dispInput.style.background = '#f3f4f6';
  dispInput.style.cursor = 'not-allowed';
  dispInput.style.color = '#6b7280';
}

document.getElementById('tbody-disp').appendChild(dispRow);
   
    // Inspection → only ONE row
    const inspRow = buildRow('', null, true);

    inspRow.classList.add('default-row');

    document.getElementById('tbody-insp').appendChild(inspRow);

    // Dropdown updates SAME row
    const inspSel = document.getElementById('inspVariantSelect');

    if (inspSel) {

      inspSel.addEventListener('change', function () {

        const val = this.value;

        // REMOVE EXTRA ROWS
        const allRows =
          document.querySelectorAll('#tbody-insp tr');

        allRows.forEach((r, index) => {
          if (index > 0) {
            r.remove();
          }
        });

        const defaultRow =
          document.querySelector('#tbody-insp tr.default-row');

        if (defaultRow) {

          defaultRow.dataset.variant = val;

          // show ONLY selected value
          defaultRow.children[0]
            .querySelector('input').value =
            val || '';

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

function applyStageDateRestriction(row) {
    const currentDateInput = row.querySelector('[name="stage_date"]');
    const currentAchieveInput = row.querySelector('[name="achieve_date"]');
    if (!currentDateInput) return;
    currentDateInput.min = '';
    currentDateInput.max = '';
    if (currentAchieveInput) {
        currentAchieveInput.min = '';
        currentAchieveInput.max = '';
    }
    const allRows = [
        ...document.querySelectorAll('#tbody-dfm tr'),
        ...document.querySelectorAll('#tbody-rm tr'),
        ...document.querySelectorAll('#tbody-mfg tr'),
        ...document.querySelectorAll('#tbody-insp tr'),
        ...document.querySelectorAll('#tbody-disp tr')
    ];
    const currentIndex = allRows.indexOf(row);
    const stageName = row.querySelector('td input')?.value?.trim();
    const startDate = document.getElementById('startDate')?.value;
    if (stageName === "DFM Submission" && startDate) {
        currentDateInput.min = startDate;
        if (currentAchieveInput) { currentAchieveInput.min = startDate;}
    }

    if (currentIndex > 0) {
        const previousRow = allRows[currentIndex - 1];
        const previousStageDate = previousRow.querySelector('[name="stage_date"]')?.value;
        if (previousStageDate) {
           const minDate = previousStageDate;
            if (!currentDateInput.min || currentDateInput.min < minDate) {
                currentDateInput.min = minDate; }
        }
        const previousAchieveDate =  previousRow.querySelector('[name="achieve_date"]')?.value;
        if (currentAchieveInput && previousAchieveDate) {
           const minDate = previousAchieveDate;


            if (!currentAchieveInput.min || currentAchieveInput.min < minDate) {
                currentAchieveInput.min = minDate;}
        }
    }
    if (row.closest('#section-disp')) {
        const requiredDate = document.getElementById('requiredDate')?.value;
        if (requiredDate) {
            currentDateInput.max = requiredDate;
            if (currentAchieveInput) { currentAchieveInput.max = requiredDate;}
        }
    }
}

    function validateStageFlowUI(row) {
      const allRows = [
        ...document.querySelectorAll('#tbody-dfm tr'),
        ...document.querySelectorAll('#tbody-rm tr'),
        ...document.querySelectorAll('#tbody-mfg tr'),
        ...document.querySelectorAll('#tbody-insp tr'),
        ...document.querySelectorAll('#tbody-disp tr')
      ];

      const currentIndex = allRows.indexOf(row);
      if (currentIndex <= 0) return;
      const inwardInput = row.querySelector('.inward');
      if (!inwardInput) return;
      const currentInward = parseFloat(inwardInput.value || 0);
      let previousOutward = 0;
      for (let i = currentIndex - 1; i >= 0; i--) {
        const out = parseFloat(allRows[i]
              .querySelector('.outward')
              ?.value || 0
          );

        if (out > 0) {
          previousOutward = out;
          break;
        }
      }
      // RED WARNING
      if (currentInward > previousOutward) {
        inwardInput.style.border =
          '2px solid red';
        inwardInput.style.background =
          '#ffe5e5';
      }
      // NORMAL
      else {
        inwardInput.style.border = '';
        inwardInput.style.background = '';
      }
    }


 function validateStageFlow(row) {
  const currentSection = row.closest('tbody')?.id;
  if (currentSection === 'tbody-rm') {
    return true;
  }
  const allRows = [
    ...document.querySelectorAll('#tbody-rm tr'),
    ...document.querySelectorAll('#tbody-mfg tr'),
    ...document.querySelectorAll('#tbody-insp tr'),
    ...document.querySelectorAll('#tbody-disp tr')
  ];
  const currentIndex = allRows.indexOf(row);
  if (currentIndex <= 0) {
    return true;
  }
  const previousRow = allRows[currentIndex - 1];
  const previousOutward = previousRow
      .querySelector('.outward')
      ?.value
      ?.trim()
  if (!previousOutward) {
    showToast(
      'Please fill Outward Qty in previous stage first',
      'warning'
    );
    return false;
  }

  // Auto-fill inward from previous outward
  const inwardInput =
    row.querySelector('.inward');
  if (inwardInput && !inwardInput.value) {
    inwardInput.value = previousOutward
  }
  return true;
}


    function viewPart(btn) {
       resetPartData();  
      const row = btn.closest('tr');
      const partId = row.getAttribute('data-id');
      selectedPartId = partId;
      const partName = row.children[2].innerText;
      const partQty = row.children[3].innerText;

      const { poId } = getParamsFromUrl();
      window.history.pushState({}, '', `/project-tracker/${poId}/${partId}`);
      document.getElementById('partName').innerText = partName;
      document.getElementById('partQty').innerText = partQty;
      document.getElementById('viewPanel').classList.add('active');
      document.getElementById('overlay').classList.add('active');
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
      document.querySelectorAll('.tab').forEach(tab =>
    tab.classList.remove('active')
);

document.querySelectorAll('.tab-content').forEach(content =>
    content.classList.remove('active')
);

document.querySelector('.tab[data-tab="stage"]').classList.add('active');
document.getElementById('stage').classList.add('active');
      loadSinglePart(partId);
      loadStages(partId);
      loadInventoryStock(partId);
       updatePartFileCount(); 
    }

async function generateRouteCard(poId, partId) {
    try {
        const res = await fetch('/api/generate-route-card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                poId,
                partId
            })
        });
        const data = await res.json();
        if (!data.success) {
            alert('Unable to generate Route Card');
            return;
        }
        window.open(`/routecard/${poId}/${partId}`, '_blank');
    } catch (err) {
        console.error(err);
    }
}

    function closePanel() {
       selectedPartId = null; 
      const { poId } = getParamsFromUrl();
      window.history.pushState(
        {},
        '',
        `/project-tracker/${poId}`
      );
      document.getElementById('viewPanel').classList.remove('active');
      document.getElementById('overlay').classList.remove('active');
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
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
    showToast("Dates are locked and cannot be changed ❌", "error");
    return;
  }

  // ✅ Validate only if both dates are entered
if (startDate && reqDate) {
    if (new Date(reqDate) < new Date(startDate)) {
        showToast(
            "Customer Required Date cannot be earlier than Starting Date",
            "error"
        );
        reqDateInput.focus();
        return;
    }
}

  try {
    const res = await fetch('/api/project/save-dates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        startDate,
        reqDate
      })
    });

    if (!res.ok) throw new Error();
    showMsg('savedDatesMsg');
    await loadProject();
  } catch (err) {
    console.error(err);
    showToast('Could not save dates. Please try again.', 'error');
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
        showToast('Could not save team. Please try again.', 'error');
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
        // REMARKS POPUP — positioned near clicked field
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

      // 🔹 MANUFACTURING FILES
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


      // 🔹 STAGE FILES
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

const stageName =
  row.querySelector('td input')?.value?.trim();

console.log('Stage Name =', stageName);

if (stageName.includes('RM inward')) {

  _uploadTrigger._type = 'rmtc-only';

}
else if (stageName.includes('Stores RM Outward')) {

  _uploadTrigger._type = 'stores-rm';

}
else if (isDispatchRow) {

  _uploadTrigger._type = 'disp';

}
else {

  _uploadTrigger._type = 'stage';

}

console.log('Type =', _uploadTrigger._type);

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

    _uploadTrigger = null;

    const tbody = document.getElementById("uploadFilesTbody");
    if (tbody) tbody.innerHTML = "";
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
      const isRm = _uploadTrigger?._type === 'rm';
      const isRmtcOnly = _uploadTrigger?._type === 'rmtc-only';
      const isStoresRm = _uploadTrigger?._type === 'stores-rm';

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

          enableDragDrop(zonesDiv.children[0], handleMfgVariantFiles, 'RM');
          enableDragDrop(zonesDiv.children[1], handleMfgVariantFiles, 'RMTC');
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

    else if (isRmtcOnly) {
      const storesRmZonesEl =
  document.getElementById('storesRmZones');

if (storesRmZonesEl) {
  storesRmZonesEl.style.display = 'none';
}

  const mfgZonesEl = document.getElementById('mfgZones');
  if (mfgZonesEl) mfgZonesEl.style.display = 'none';

  const dispZonesEl = document.getElementById('dispZones');
  if (dispZonesEl) dispZonesEl.style.display = 'none';

  document.querySelector('.upload-drop-zone').style.display = 'none';

  let rmZones = document.getElementById('rmtcZones');

  if (!rmZones) {

    rmZones = document.createElement('div');
    rmZones.id = 'rmtcZones';

    rmZones.style.cssText =
      'display:block;margin-bottom:16px;';

    rmZones.innerHTML = `
      <div style="
        width:100%;
        border:2px dashed #e5e7eb;
        border-radius:7px;
        padding:20px;
        text-align:center;
        cursor:pointer;"
        onclick="document.getElementById('rmRmtcPicker').click()">

        <i class="fa-solid fa-file-shield"
           style="font-size:24px;color:#fa788d;"></i>

        <p>RMTC</p>

        <input type="file"
          id="rmRmtcPicker"
          multiple
          style="display:none;"
          onchange="handleRmVariantFiles(this,'RMTC')" />
      </div>
    `;

    document.querySelector('.upload-popup-body')
      .prepend(rmZones);
  }

  rmZones.style.display = 'block';

  thead.innerHTML = `
    <tr>
      <th>File Name</th>
      <th>File Type</th>
      <th>Variant</th>
      <th>Action</th>
    </tr>`;
}
else if (isStoresRm) {
  const rmtcZonesEl =
  document.getElementById('rmtcZones');

if (rmtcZonesEl) {
  rmtcZonesEl.style.display = 'none';
}

  const mfgZonesEl = document.getElementById('mfgZones');
  if (mfgZonesEl) mfgZonesEl.style.display = 'none';

  const dispZonesEl = document.getElementById('dispZones');
  if (dispZonesEl) dispZonesEl.style.display = 'none';

  document.querySelector('.upload-drop-zone').style.display = 'none';

  let rmZones = document.getElementById('storesRmZones');

  if (!rmZones) {

    rmZones = document.createElement('div');
    rmZones.id = 'storesRmZones';

    rmZones.style.cssText =
      'display:block;margin-bottom:16px;';

    rmZones.innerHTML = `
      <div style="
        border:2px dashed #e5e7eb;
        border-radius:7px;
        padding:20px;
        text-align:center;
        cursor:pointer;"
        onclick="document.getElementById('receiptPicker').click()">

        <i class="fa-solid fa-receipt"
          style="font-size:24px;color:#fa788d;"></i>

        <p style="margin-top:8px;">
          Receipt Copy
        </p>

        <input
          type="file"
          id="receiptPicker"
          multiple
          style="display:none;"
          onchange="handleRmVariantFiles(this,'Receipt Copy')" />
      </div>

      <div style="
        margin-top:15px;
        text-align:center;
        font-weight:600;">
        OR
      </div>

      <div style="margin-top:15px;">
        <input
          type="text"
          id="storesRmPrNo"
          placeholder="Enter PR Number"
          style="
            width:100%;
            padding:10px;
            border:1px solid #ddd;
            border-radius:6px;">
      </div>
    `;

    document
      .querySelector('.upload-popup-body')
      .prepend(rmZones);
  }

  rmZones.style.display = 'block';
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
          enableDragDrop(rmZones.children[0], handleRmVariantFiles, 'RM');
          enableDragDrop(rmZones.children[1], handleRmVariantFiles, 'RMTC');
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
              ${f.variant_name || f.variant || '—'}
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
          enableDragDrop(dispZones.children[0], handleDispVariantFiles, 'Part Photo');
          enableDragDrop(dispZones.children[1], handleDispVariantFiles, 'Packing Photo');
          enableDragDrop(dispZones.children[2], handleDispVariantFiles, 'Packing List');
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
                ${f.variant_name || f.variant || '—'}
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
        const rmtcZonesEl = document.getElementById('rmtcZones');
        if (rmtcZonesEl) rmtcZonesEl.style.display = 'none';
        const storesRmZonesEl = document.getElementById('storesRmZones');
       if (storesRmZonesEl) storesRmZonesEl.style.display = 'none';
        document.querySelector('.upload-drop-zone').style.display = 'block';

const dropZone = document.querySelector('.upload-drop-zone');
const newDropZone = dropZone.cloneNode(true); // removes old listeners
dropZone.parentNode.replaceChild(newDropZone, dropZone);

newDropZone.addEventListener('dragover', e => {
  e.preventDefault();
  newDropZone.style.borderColor = '#fa788d';
  newDropZone.style.background = '#fff0f3';
});
newDropZone.addEventListener('dragleave', () => {
  newDropZone.style.borderColor = '';
  newDropZone.style.background = '';
});
newDropZone.addEventListener('drop', e => {
  e.preventDefault();
  newDropZone.style.borderColor = '';
  newDropZone.style.background = '';
  if (!_uploadTrigger._files) _uploadTrigger._files = [];
  Array.from(e.dataTransfer.files).forEach(f => {
    _uploadTrigger._files.push({
      file: f, name: f.name,
      ext: f.name.split('.').pop().toUpperCase(),
      remarks: ''
    });
  });
  renderUploadTable(_uploadTrigger._files);
  syncUploadCount();
});

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
              <span style="background:${f.variant_name === 'RM' ? '#dbeafe' : '#dcfce7'};
                          color:${f.variant_name === 'RM' ? '#1d4ed8' : '#166534'};
                          font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">
                ${f.variant_name || f.variant || '—'}
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
            else showToast('Preview not available.', 'error');
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

  } else if (
    _uploadTrigger._type === 'rm' ||
    _uploadTrigger._type === 'rmtc-only' ||
    _uploadTrigger._type === 'stores-rm'
  ) {

    insertStageFiles();

  }
}

    //insert stage files
  function insertStageFiles() {

  // ✅ ADD THIS BLOCK AT THE TOP
  if (_uploadTrigger?._type === 'stores-rm') {

    const prNumber =
      document.getElementById('storesRmPrNo')
        ?.value
        ?.trim();

    if (
      prNumber &&
      !_uploadTrigger._files.some(f => f.pr_number)
    ) {

      _uploadTrigger._files.push({
        name: 'PR Number',
        ext: 'TEXT',
        variant: 'PR Number',
        pr_number: prNumber
      });

    }
  }

  if (!_uploadTrigger || !_uploadTrigger._files) return;

  const row = _uploadTrigger;

  const countSpan =
    row.querySelector('.stage-upload-trigger .file-count');

  if (countSpan) {
    countSpan.textContent = row._files.length;
  }

  showToast(
    "Documents added successfully - Click Save to update records",
    "info"
  );

  closeUploadPopup();
}

   async function insertPartFiles() {

  if (!_uploadTrigger || !_uploadTrigger._files) return;

  const { partId } = getParamsFromUrl();

  if (!partId) {  
    showToast("Part not selected", "error");
    return;
  }

  const isSplit = String(partId).startsWith("split_");

  console.log("Part ID:", partId);
  console.log("Is Split:", isSplit);

  for (const f of _uploadTrigger._files) {

    const formData = new FormData();

    formData.append("file", f.file);
    formData.append("remarks", f.remarks || "");
    formData.append("file_type", "project");

    if (isSplit) {
      formData.append(
        "split_part_id",
        String(partId).replace("split_", "")
      );
    } else {
      formData.append("product_id", partId);
    }

    // Debug
    for (const pair of formData.entries()) {
      console.log(pair[0], "=", pair[1]);
    }

    const res = await fetch("/api/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log(data);
  }

  showToast("Part files saved!", "success");

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
  if (!_uploadTrigger._files) {
    _uploadTrigger._files = [];
  }
  const prNumber =
    document.getElementById('storesRmPrNo')
      ?.value
      ?.trim() || '';
  Array.from(input.files).forEach(f => {
    _uploadTrigger._files.push({
      file: f,
      name: f.name,
      ext: f.name.split('.').pop().toUpperCase(),
      variant: variant,
      pr_number: prNumber,   
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
        showToast("⚠️ No files to upload", "error");
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

        showToast("Documents uploaded successfully", "success");
        _uploadTrigger._files = [];
        renderUploadTable([]);
        closeUploadPopup();

      } catch (err) {
        console.error(err);
        showToast("❌ Error uploading files", "error");
      }
    }


    /*function insertRmFiles() {

      if (!_uploadTrigger || !_uploadTrigger._files) return;

      const row = _uploadTrigger;

      const countSpan =
        row.querySelector('.stage-upload-trigger .file-count');

      if (countSpan) {
        countSpan.textContent = row._files.length;
      }

      showToast("Documents added successfully - Click Save to update records", "info");

      closeUploadPopup();
    }

    function insertDispFiles() {

      if (!_uploadTrigger || !_uploadTrigger._files) return;

      const row = _uploadTrigger;

      const countSpan =
        row.querySelector('.stage-upload-trigger .file-count');

      if (countSpan) {
        countSpan.textContent = row._files.length;
      }

      showToast("Documents added successfully - Click Save to update records", "info");

      closeUploadPopup();
    }*/

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
        showToast("Enter comment", "error");
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

          showToast("Comment saved", "success");

        } catch (err) {
          console.error(err);
          showToast("Error saving comment", "error");
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

        showToast("Comment saved locally (save stage to persist)", "info");
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

       const startDateInput = document.getElementById('startDate');
const reqDateInput = document.getElementById('reqDate');

startDateInput.value = data.startDate || '';
reqDateInput.value = data.reqDate || '';

// Customer Required Date cannot be before Start Date
// Customer Required Date cannot be before Starting Date
if (startDateInput.value) {
  reqDateInput.min = startDateInput.value;
}

startDateInput.addEventListener('change', function () {

  reqDateInput.min = this.value;

  if (reqDateInput.value && reqDateInput.value < this.value) {
    reqDateInput.value = '';
  }

});

        // 🔒 Lock dates individually

        if (data.startDate) {
          document.getElementById('startDate').disabled = true;
        }

        if (data.reqDate) {
          document.getElementById('reqDate').disabled = true;
        }

        document.getElementById('userName').textContent =
          data.user?.name || 'User';

          currentUserRoles =
      (data.user?.roles || '')
        .toLowerCase()
        .split(',')
        .map(r => r.trim());

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

        showToast('Project not found', 'error');

      }
    }


    document.addEventListener('DOMContentLoaded', async () => {

      await loadUsers();
      await loadStageUsers();

      await loadProductsPoCount();
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
      document.getElementById('startDate').addEventListener('change', function () {

    const reqDateInput = document.getElementById('reqDate');

    reqDateInput.min = this.value;

    if (reqDateInput.value && reqDateInput.value < this.value) {
        reqDateInput.value = '';
    }
});
      loadParts();
      loadInvoiceCount();
      const { poId } = getParamsFromUrl();
      if (poId) {
          if (window._qtyRefreshInterval) clearInterval(window._qtyRefreshInterval);
          window._qtyRefreshInterval = setInterval(async () => {
          }, 8000);
        }



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
            <tr
  data-id="${part.id}"
   class="${part.is_service == 1 ? 'service-row' : ''}"
    style="cursor:${part.is_service == 1 ? 'default' : 'pointer'};">
<td style="text-align:center;">
    <input
        type="checkbox"
        class="service-checkbox"
        value="${part.id}"
        data-is-split="${part.is_split}">
</td>
              <td>${String(index + 1).padStart(2, '0')}</td>
            <td>
      <div style="display:flex; align-items:center; gap:6px;">
        <span id="status-dot-${part.id}"
          title="${
            part.status === 'active'  ? 'Active' :
            part.status === 'on-hold' ? 'On Hold' : 'Pending'
          }"
          style="
            width:8px; height:8px; border-radius:50%;
            flex-shrink:0; display:inline-block;
            background:${
                              (part.status || '').toLowerCase() === 'completed'   ? '#16a34a' :
                              (part.status || '').toLowerCase() === 'dispatched'  ? '#2563eb' :
                              (part.status || '').toLowerCase() === 'in progress' ? '#a09302' :
                              (part.status || '').toLowerCase() === 'on-hold'     ? '#ef4444' :
                              '#d1d5db'
                          };
          ">
        </span>
        ${part.part_number.length > 20
          ? part.part_number.substring(0, 20) + '....'
          : part.part_number
        }
      </div>
    </td>

    <td title="${part.product_name}">
      ${part.product_name.length > 25
        ? part.product_name.substring(0, 25) + "...."
        : part.product_name
      }
    </td>
    <td>${part.batch}</td>
<td style="text-align:right;">
  <div style="
    display:flex;
    align-items:center;
    gap:8px;
  ">
    <span class="main-qty">
      ${part.quantity}
    </span>

    <i
      class="fa-solid fa-plus"
      title="Split Quantity"
      onclick="
        event.stopPropagation();
        openSplitPopup('${part.id}')
      "
      style="
        width:22px;
        height:22px;
        border-radius:50%;
        background:#fce7f3;
        color:#ec4899;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:10px;
        cursor:pointer;
      "
    ></i>
  </div>
</td>
    <td id="dispatch-qty-${part.id}">
  <span style="font-size:13px;font-weight:600;color:#ea580c;">
    ${part.dispatch_quantity ?? 0}
  </span>
</td>
<td>
  <div style="display:flex;align-items:center;gap:8px;">
    <span id="current-qty-${part.id}" style="font-size:13px;font-weight:600;color:#2563eb;">
      ${part.current_stock ?? 0}
    </span>
    <i
      class="fa-solid fa-pen-to-square"
      title="Adjust Quantity"
      onclick="event.stopPropagation(); openAdjustQtyPopup('${part.id}', '${part.part_number}', '${part.product_name}')"
      style="font-size:13px;color:#3b82f6;cursor:pointer;transition:0.2s;"
      onmouseover="this.style.color='#fa788d';this.style.transform='scale(1.2)';"
      onmouseout="this.style.color='#3b82f6';this.style.transform='scale(1)';"
    ></i>
  </div>
</td>
              <td>${part.required_date ? new Date(part.required_date).toLocaleDateString() : '-'}</td>
              <td><span class="status ${
                          (part.status || 'pending').toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace('dispatched', 'completed')
                        }">${part.status || 'Pending'}</span></td>
              <td>${part.section}</td>
             
             <td>
  <button
    class="btn-action view"
    onclick="event.stopPropagation(); ${Number(part.is_service) === 1 ? '' : 'viewPart(this)'}"
    style="
      ${Number(part.is_service) === 1
        ? 'pointer-events:none;opacity:.45;cursor:not-allowed;'
        : ''
      }
    "
  >
    <i class="fa-solid fa-list-check"></i>
    View
  </button>
</td>
     <td>
  <button
    class="route-card-btn"
    style="
      background:#EDE9FE;
      color:var(--primary);
      font-size:14px;
      ${Number(part.is_service) === 1
        ? 'pointer-events:none;opacity:.45;cursor:not-allowed;'
        : ''
      }
    "
    onclick="${Number(part.is_service) === 1
      ? ''
      : `generateRouteCard('${part.po_id}','${part.id}')`}"
  >
    <i class="fa-solid fa-file-export"></i>
    Generate
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



    function openSplitPopup(partId) {

      const row =
        document.querySelector(
          `tr[data-id="${partId}"]`
        );

      if (!row) return;

      // PART DETAILS
      const partNumber =
        row.children[2]
          ?.innerText
          ?.trim() || '';

      const partName =
        row.children[3]
          ?.innerText
          ?.trim() || '';

      // QUANTITY COLUMN
      // Table columns:
      // 0 = S.No
      // 1 = Part Number
      // 2 = Part Name
      // 3 = Batch
      // 4 = Order Quantity

      const qtyText =

        row.children[5]
          ?.querySelector('span')
          ?.innerText
          ?.trim()

        ||

        row.children[5]
          ?.innerText
          ?.trim()

        ||

        '0';

      const totalQty =
        parseInt(qtyText) || 0;

      // STORE GLOBALLY
      window._splitPartId = partId;

      window._splitTotalQty =
        totalQty;

      // FILL POPUP
      document.getElementById(
        'splitPartNumber'
      ).innerText = partNumber;

      document.getElementById(
        'splitPartName'
      ).innerText = partName;

      document.getElementById(
        'splitTotalQty'
      ).innerText = totalQty;

      // RESET ROWS
      document.getElementById(
        'splitRows'
      ).innerHTML = '';

      // ADD FIRST ROW
      addSplitRow();

      // OPEN POPUP
      document.getElementById(
        'splitPopup'
      ).style.display = 'block';

      document.getElementById(
        'splitOverlay'
      ).style.display = 'block';

    }


    function addSplitRow() {

      const wrap =
        document.getElementById('splitRows');

      const div =
        document.createElement('div');

      div.className = 'split-row';

      div.style.cssText = `
        display:grid;
        grid-template-columns:2fr 90fr 60px 40px;
        gap:10px;
        margin-bottom:12px;
      `;
      div.innerHTML = `

      <input
        type="text"
        placeholder="Split Name"
        class="split-name"
        style="
          padding:10px;
          border:1px solid #e5e7eb;
          border-radius:8px;
        "
      >


      <input
        type="number"
        placeholder="Qty"
        class="split-qty"
        style="
          padding:10px;
          border:1px solid #e5e7eb;
          border-radius:8px;
        "
      >

      <button
        onclick="this.parentElement.remove()"
        style="
          border:none;
          background:#ffe4e6;
          color:#e11d48;
          border-radius:8px;
          cursor:pointer;
          font-size:18px;
        "
      >
        ×
      </button>
    `;
      wrap.appendChild(div);
    }

    async function saveSplit() {

      const rows =
        document.querySelectorAll('.split-row');

      const splits = [];

      let total = 0;

      // ─────────────────────────────
      // COLLECT SPLIT DATA
      // ─────────────────────────────
      rows.forEach(row => {

        const splitName =
          row.querySelector('.split-name')
            ?.value
            .trim();

        const warehouse =
          row.querySelector('.split-warehouse')
            ?.value
            .trim();

        const qty =
          parseInt(
            row.querySelector('.split-qty')
              ?.value
          ) || 0;

        const requiredDate =
          row.querySelector('.split-required-date')
            ?.value || null;

        // Skip empty rows
        if (!splitName || qty <= 0) {
          return;
        }

        total += qty;

        splits.push({

          split_name: splitName,

          warehouse_name: warehouse,

          quantity: qty,

          required_date: requiredDate

        });

      });

      // ─────────────────────────────
      // VALIDATION
      // ─────────────────────────────
      if (!splits.length) {

        showToast(
          'Please add at least one split',
          'error'
        );

        return;
      }

      if (total !== window._splitTotalQty) {

        showToast(
          `Total split qty must be ${window._splitTotalQty}`,
          'error'
        );

        return;
      }

      // ─────────────────────────────
      // SAVE
      // ─────────────────────────────
      try {

        const res = await fetch(
          '/api/split-part',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({

              partId:
                window._splitPartId,

              splits

            })
          }
        );

        const data =
          await res.json();

        if (!res.ok) {

          throw new Error(
            data.error || 'Save failed'
          );
        }

        showToast(
          'Split created successfully',
          'success'
        );

        closeSplitPopup();

        // Reload updated parts
        loadParts();

      } catch (err) {

        console.error(err);

        showToast(
          'Error saving split',
          'error'
        );
      }
    }



    async function loadSinglePart(partId) {
      try {
        const res = await fetch(`/api/part/${partId}`);
        const part = await res.json();
       document.getElementById('partNumber').innerText = part.part_number || '-';
        document.getElementById('partName').innerText = part.product_name || '-';
        document.getElementById('partQty').innerText = part.quantity || '-';
        document.getElementById('partStatus').value =
      part.status || '';
   

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
        showToast("No stages to save", "error");
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
            formData.append('file_type', 'stage');
            if (f.variant) {formData.append('variant_name', f.variant);}

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
      showToast("Stages + Files saved ✅", "success");
    } catch (err) {
      console.error(err);
      showToast("Error saving ❌", "error");
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
      row = document.querySelector('#tbody-insp tr.default-row');
      if (row) {
        row.dataset.variant = stage.stage_name;
        row.children[0]
          .querySelector('input').value =
          stage.stage_name;
      }
    } else {
      row = [...tbody.querySelectorAll('tr')].find(tr => {
        const input =
          tr.children[0]
            ?.querySelector('input');
        if (!input) return false;
        const name =
          input.value
            ?.trim()
            .toLowerCase();
        const dbName =
          stage.stage_name
            ?.trim()
            .toLowerCase();
        return name === dbName;
      });

      // ✅ DO NOT CREATE NEW ROWS FOR DFM
      if (!row && tbodyId !== 'tbody-dfm') {
        const emptyRow =
          [...tbody.querySelectorAll('tr')].find(tr => {
            const val =
              tr.children[0]
                .querySelector('input')
                ?.value
                .trim();
            return !val;
          });
        if (emptyRow) {
          emptyRow.remove();
        }
        row = buildRow(stage.stage_name);
        tbody.appendChild(row);
      }

            // ✅ Disable inward/outward for any DFM row loaded from DB
            if (tbodyId === 'tbody-dfm') {
              ['.inward', '.outward'].forEach(cls => {
                const el = row.querySelector(cls);
                if (!el) return;
                el.readOnly = true;
                el.tabIndex = -1;
                el.style.cursor = 'not-allowed';
                el.style.userSelect = 'none';
                el.style.background = '#f3f4f6';
                el.addEventListener('keydown', e => e.preventDefault());
                el.addEventListener('mousedown', e => e.preventDefault());
              });
            }

            }

            row.dataset.stageId = stage.id;

            row.querySelector('[name="stage_date"]').value = stage.stage_date?.split('T')[0] || '';
            row.querySelector('[name="achieve_date"]').value = stage.achieve_date?.split('T')[0] || '';
            row.querySelector('.inward').value = stage.inward || '';
            row.querySelector('.outward').value = stage.outward || '';
            freezeRowFields(row);
            row.querySelector('.remarks-input').value = stage.remarks || '';
            row.dataset.verifierName = stage.verifier_name || '';
            row.dataset.verifierRemarks = stage.verifier_remarks || '';
            if (stage.verifier_name) {row._alertSaved = true;
              const saveIcon =
    row.querySelector('.fa-floppy-disk');

  const alertIcon =
    row.querySelector('.fa-circle-exclamation');

  alertIcon.style.color = 'rgb(14, 163, 21)';
    }
         
            const select = row.children[6].querySelector('select');
            if (select) {select.value = stage.assigned_user_id || '';
    }

            row.dataset.edited = 'false';

            if (stage.status === 'closed') {

              row.dataset.status = 'closed';
              row.classList.add('verified-row');

      freezeRowFields(row);
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
            const fileName =
  f.variant_name === 'PR Number'
    ? f.pr_number
    : (f.original_name || 'No File');
            html += `
              <tr>
                <td>${i + 1}</td>
                <td style="color:var(--primary);font-weight:500;">
  ${fileName.length > 50
    ? `<span>${fileName.substring(0, 50)}...</span>
      <i class="fa-solid fa-circle-exclamation"
          title="${fileName}"
          onclick="showFullFileName(this, '${fileName.replace(/'/g, "\\'")}')"
          style="color:var(--primary);cursor:pointer;font-size:13px;margin-left:4px;"></i>`
    : fileName}
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
            const fileName =
  f.pr_number
    ? f.pr_number
    : (f.original_name || 'No File');

const fileType =
  fileName.includes('.')
    ? fileName.split('.').pop().toUpperCase()
    : 'TEXT';
            const variantColors = {
              'Part Photo':    { bg: '#fef3c7', color: '#92400e' },
              'Packing Photo': { bg: '#dbeafe', color: '#1d4ed8' },
              'Packing List':  { bg: '#dcfce7', color: '#166534' },
              'RM':            { bg: '#dbeafe', color: '#1d4ed8' },
              'RMTC':          { bg: '#dcfce7', color: '#166534' }
            };
            const vc = f.variant_name ? (variantColors[f.variant_name] || { bg: '#f3f4f6', color: '#374151' }) : null;

            html += `
              <tr>
                <td>${i + 1}</td>
              <td style="color:var(--primary);font-weight:500;">
  ${(() => {

    const fileName =
      f.original_name ||
      (f.pr_number
        ? `PR Number : ${f.pr_number}`
        : 'No File');

    return fileName.length > 50
      ? `<span>${fileName.substring(0, 50)}...</span>
         <i class="fa-solid fa-circle-exclamation"
            title="${fileName}"
            onclick="showFullFileName(this, '${fileName.replace(/'/g, "\\'")}')"
            style="color:var(--primary);cursor:pointer;font-size:13px;margin-left:4px;"></i>`
      : fileName;

  })()}
</td>
                <td><span class="upload-type-badge">${fileType}</span></td>
                <td>${f.stage_name || '—'}</td>
                <td>${f.section_title || '—'}</td>
                <td>${vc
                  ? `<span style="background:${vc.bg};color:${vc.color};
                                font-size:11px;font-weight:700;
                                padding:2px 8px;border-radius:4px;">
                      ${f.variant_name || f.variant || '—'}
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

      const isRmRow   = !!row.closest('#section-rm');
      const isDispRow = !!row.closest('#section-disp');
      const isDfmRow  = !!row.closest('#section-dfm');
      const isMfgRow  = !!row.closest('#section-mfg');
      const isInspRow = !!row.closest('#section-insp');

      const files = row._files || [];

      const outwardQty =
  Number(
    row.querySelector('.outward')?.value || 0
  );

if (outwardQty > 0 && files.length === 0) {

  showToast(
    'Please upload a document before saving',
    'error'
  );

  return;
}

// Stores RM Outward → Receipt OR PR Number required
const stageName =
  row.querySelector('td input')?.value?.trim();

if (stageName === 'Stores RM Outward') {

    const outwardQty = Number(
        row.querySelector('.outward')?.value || 0
    );

    // If no outward quantity, don't ask for PR/Receipt
    if (outwardQty > 0) {

        const popupPrNumber =
            document.getElementById('storesRmPrNo')
                ?.value
                ?.trim() || '';

        const savedPrNumber =
            (row._files || [])
                .find(f => f.pr_number)
                ?.pr_number || '';

        const prNumber = popupPrNumber || savedPrNumber;

        const hasReceipt =
            files.some(
                f =>
                    f.variant === 'Receipt Copy' ||
                    f.variant_name === 'Receipt Copy'
            );

        if (!prNumber && !hasReceipt) {

            showToast(
                'Enter PR Number or upload Receipt Copy',
                'error'
            );

            return;
        }
    }
}

if (stageName === 'RM inward (QC Inspection)') {

  const inwardQty =
    Number(
      row.querySelector('.inward')?.value || 0
    );

  const hasRmtc =
    files.some(
      f =>
        f.variant === 'RMTC' ||
        f.variant_name === 'RMTC'
    );

  if (inwardQty > 0 && !hasRmtc) {

    showToast(
      'RMTC upload is mandatory for RM inward (QC Inspection)',
      'error'
    );

    return;
  }
}

    // ===============================
// DATE VALIDATION
// ===============================

const stageDateInput = row.querySelector('[name="stage_date"]');
const achieveDateInput = row.querySelector('[name="achieve_date"]');

const stageDate = stageDateInput?.value;
const achieveDate = achieveDateInput?.value;

// Validate Target Date
if (stageDate) {

    if (stageDateInput.min && stageDate < stageDateInput.min) {

        showToast(
            `Target Date should be on or after ${stageDateInput.min}`,
            "error"
        );

        stageDateInput.focus();
        return;
    }

    if (stageDateInput.max && stageDate > stageDateInput.max) {

        showToast(
            `Target Date should not exceed ${stageDateInput.max}`,
            "error"
        );

        stageDateInput.focus();
        return;
    }
}

// Validate Actual Date
if (achieveDate) {

    if (achieveDateInput.min && achieveDate < achieveDateInput.min) {

        showToast(
            `Actual Date should be on or after ${achieveDateInput.min}`,
            "error"
        );

        achieveDateInput.focus();
        return;
    }

    if (achieveDateInput.max && achieveDate > achieveDateInput.max) {

        showToast(
            `Actual Date should not exceed ${achieveDateInput.max}`,
            "error"
        );

        achieveDateInput.focus();
        return;
    }
}
      let stageId = await saveSingleRow(row);

      if (!stageId) {
        showToast('Failed to save', 'error');
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

    if (f.file) {
      formData.append('file', f.file);
    }

    formData.append('stage_id', stageId);
    formData.append('user_id', 1);
    formData.append('file_type', 'stage');

    if (f.variant) {
      formData.append('variant_name', f.variant);
    }

    formData.append(
      'pr_number',
      f.pr_number || ''
    );

    await fetch('/api/upload-stage-file', {
      method: 'POST',
      body: formData
    });
  }

  row._files = [];
}

      row.dataset.edited = 'false';
      row.dataset.status = 'closed';

      row.dataset.edited = 'false';

    row.dataset.status = 'closed';

    row.classList.add('verified-row');
freezeRowFields(row);
showSaveSuccessPopup();
await loadParts();  
await loadInventoryStock(selectedPartId);
//await loadStages();
updatePartFileCount();       
    }

function insertRmFiles() {
      if (!_uploadTrigger || !_uploadTrigger._files) return;
      const files = _uploadTrigger._files;
      const hasRM   = files.some(f => f.variant === 'RM');
      const hasRMTC = files.some(f => f.variant === 'RMTC');
      if (!hasRM)   { showToast('RM file is mandatory', 'warning'); return; }
      if (!hasRMTC) { showToast('RMTC file is mandatory', 'warning'); return; }
      const row = _uploadTrigger;
      const countSpan = row.querySelector('.stage-upload-trigger .file-count');
      if (countSpan) countSpan.textContent = files.length;
      showToast('RM/RMTC files added — click save to update records', 'info');
      closeUploadPopup();
    }

    function insertDispFiles() {
      if (!_uploadTrigger || !_uploadTrigger._files) return;
      const files = _uploadTrigger._files;
      const missing = [];
      if (!files.some(f => f.variant === 'Part Photo'))    missing.push('Part Photo');
      if (!files.some(f => f.variant === 'Packing Photo')) missing.push('Packing Photo');
      if (!files.some(f => f.variant === 'Packing List'))  missing.push('Packing List');
      if (missing.length) {
        showToast(`Missing required files: ${missing.join(', ')}`, 'warning');
        return;
      }
      const row = _uploadTrigger;
      const countSpan = row.querySelector('.stage-upload-trigger .file-count');
      if (countSpan) countSpan.textContent = files.length;
      showToast('Dispatch files added — click save to update records', 'info');
      closeUploadPopup();
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

      const isSplit =
      String(partId).startsWith('split_');

    let actualProductId = partId;

    let splitPartId = null;

    // SPLIT PART
    if (isSplit) {

      splitPartId =
        parseInt(
          String(partId)
            .replace('split_', '')
        );

      // fetch parent product id
      const splitRes =
        await fetch(`/api/split-parent/${splitPartId}`);

      const splitData =
        await splitRes.json();

      actualProductId =
        splitData.parent_part_id;
    }

    const payload = {

      stages: [{

        product_id:
          parseInt(actualProductId),

        split_part_id:
          splitPartId,

        stage_name:
          stageName,

        section_title:
          sectionTitle,

        stage_date:
          stageDate,

        achieve_date:
          achieveDate,

        inward,

        outward,

        assigned_user_id:
          assignedUser,

        saved_by_user_id: 1,

        status: 'active'

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
      // ✅ show project id
    document.getElementById('popupProjectId').textContent =
      document.getElementById('projectId').textContent;

    document.getElementById('alertProjectId').textContent =
      document.getElementById('projectId').textContent;
      // ✅ If already saved → open VERIFY popup
      if (row._alertSaved) {
        openVerifyConfirmPopup(row);
        return;
      }
      // ✅ First time → open Alert popup
      _alertTargetRow = row;
      const verifierSelect =
      row.querySelector('select');

    const verifierName =
      verifierSelect?.selectedOptions[0]?.text || '';

    document.getElementById('waitingApproverText').innerText =


      verifierName &&
      verifierName !== 'Select Verifier'

        ? `Waiting for approval from ${verifierName}`

        : 'No approver assigned';

    document.getElementById('alertApproverInput').value =
      document.getElementById('userName').textContent || '';
    document.getElementById('alertRemarksInput').value = '';
      document.getElementById('alertPopup').style.display = 'block';
      document.getElementById('alertPopupOverlay').style.display = 'block';
    }


    function closeAlertPopup() {
      document.getElementById('alertPopup').style.display        = 'none';
      document.getElementById('alertPopupOverlay').style.display = 'none';
      _alertTargetRow = null;
    }

    let _alertTargetRow = null;

    async function saveAlertPopup() {

      if (!_alertTargetRow) {

        showToast("Row not found", "error");

        return;
      }

      const stage_id =
        _alertTargetRow.dataset.stageId;

      const approver_id =
        _alertTargetRow.querySelector('select')?.value;

      const remarks =
        document.getElementById('alertRemarksInput').value;

      console.log({
        stage_id,
        approver_id,
        remarks
      });

      try {

        const res = await fetch(
          '/api/save-stage-verification',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              stage_id,
              approver_id,
              remarks
            })
          }
        );

        const data = await res.json();

        console.log(data);

        if (!res.ok) {

          showToast("Failed to save", "error");

          throw new Error();
        }
        const verifierSelect =
  _alertTargetRow.querySelector('select');

_alertTargetRow.dataset.verifierName =
  verifierSelect?.selectedOptions[0]?.text || '';

_alertTargetRow.dataset.verifierRemarks =
  remarks || '';
        // ✅ Mark verified
        _alertTargetRow._alertSaved = true;

        // ✅ Change alert icon color
        const alertIcon =
          _alertTargetRow.querySelector(
            '.fa-circle-exclamation'
          );

if (alertIcon) {
  alertIcon.style.color = 'rgb(14, 163, 21)';
}



        // ✅ Lock fields for non-PM users
        const isPM =
          currentUserRoles.includes('pm');

        if (!isPM) {

          const fields = [

            _alertTargetRow.querySelector('[name="stage_date"]'),

            _alertTargetRow.querySelector('[name="achieve_date"]'),

            _alertTargetRow.querySelector('.inward'),

            _alertTargetRow.querySelector('.outward')

          ];

          fields.forEach(field => {

            if (!field) return;

            field.disabled = true;

            field.style.background = '#f3f4f6';

            field.style.cursor = 'not-allowed';

            field.title =
              'Locked after verification';

          });

        }

        showSaveSuccessPopup();

        closeAlertPopup();

      } catch (err) {

        console.error(err);

        showToast("Save failed ❌", "error");

      }

    }


    function openVerifyConfirmPopup(row) {

      const target = row || _alertTargetRow;

      if (!target) return;

      document.getElementById('verifyConfirmApprover').textContent =
        target.dataset.verifierName || '—';

      document.getElementById('verifyConfirmRemarks').textContent =
        target.dataset.verifierRemarks || '—';

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
        showToast("Select required date", "error");
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

        //  Freeze immediately
        requiredDateInput.disabled = true;

        saveIcon.style.pointerEvents = 'none';
        saveIcon.style.opacity = '0.4';

        showToast('Required date saved ✅', 'success');

      } catch (err) {

        console.error(err);

        showToast('Save failed', 'error');

      }
    }

    //For Success Popup with confetti
    let _confettiAF = null, _confettiStop = false;
    const _confettiColors = ['#fa788d','#f59e0b','#10b981','#3b82f6','#8b5cf6','#f97316','#06b6d4'];

    function startConfetti() {
      const canvas = document.getElementById('confettiCanvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      canvas.style.display = 'block'; _confettiStop = false;

      const particles = Array.from({length: 130}, () => ({
        x: Math.random() * canvas.width, y: -10 - Math.random() * canvas.height * 0.5,
        r: 4 + Math.random() * 6,
        color: _confettiColors[Math.floor(Math.random() * _confettiColors.length)],
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
        rot: Math.random() * 360, vrot: (Math.random() - 0.5) * 6,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      }));

      (function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
          ctx.fillStyle = p.color;
          if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
          else { ctx.beginPath(); ctx.arc(0, 0, p.r/2, 0, Math.PI*2); ctx.fill(); }
          ctx.restore();
          p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
          if (p.y > canvas.height + 20) { p.y = -10; p.x = Math.random() * canvas.width; }
        });
        if (!_confettiStop) _confettiAF = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      })();
      setTimeout(stopConfetti, 4000);
    }

    function stopConfetti() {
      _confettiStop = true;
      if (_confettiAF) cancelAnimationFrame(_confettiAF);
      const canvas = document.getElementById('confettiCanvas');
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }

    let _savePopupTimer = null;

    function showSaveSuccessPopup() {
      const overlay = document.getElementById('saveSuccessOverlay');
      overlay.style.display = 'flex';
      startConfetti();
      _savePopupTimer = setTimeout(() => closeSaveSuccessPopup(), 4000);
    }

    function closeSaveSuccessPopup() {
      if (_savePopupTimer) {
        clearTimeout(_savePopupTimer);
        _savePopupTimer = null;
      }
      document.getElementById('saveSuccessOverlay').style.display = 'none';
      stopConfetti();
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeFindModal();
        closeUploadPopup();
        document.getElementById('remarksPopup').style.display = 'none';
      }
      // ✅ ADD THIS
      if (e.key === 'Enter') {
        const overlay = document.getElementById('saveSuccessOverlay');
        if (overlay && overlay.style.display === 'flex') {
          closeSaveSuccessPopup();
        }
      }
    });

    function showSaveSuccessPopup() {
      console.log("showSaveSuccessPopup called"); // ✅ add this
      const overlay = document.getElementById('saveSuccessOverlay');
      console.log("overlay found:", overlay);      // ✅ add this
      overlay.style.display = 'flex';
      startConfetti();
      _savePopupTimer = setTimeout(() => closeSaveSuccessPopup(), 4000);
    }

    // Outward qty should not greater than inward qty
   function validateInwardOutward(outwardInput) {

  const row = outwardInput.closest('tr');

  const inwardInput =
    row.querySelector('.inward');

  // Skip validation when inward is disabled
  // (Stores RM Outward row)
  if (
    inwardInput.disabled ||
    inwardInput.readOnly
  ) {
    return true;
  }

  const inwardVal =
    parseFloat(inwardInput.value) || 0;

  const outwardVal =
    parseFloat(outwardInput.value) || 0;

  if (outwardVal > inwardVal) {

    showToast(
      'Outward qty cannot be greater than inward qty',
      'warning'
    );

    outwardInput.value = inwardVal;
  }
}

    window.closeSplitPopup = function () {

      const popup =
        document.getElementById('splitPopup');

      const overlay =
        document.getElementById('splitOverlay');

      if (popup) {
        popup.style.display = 'none';
      }

      if (overlay) {
        overlay.style.display = 'none';
      }
    };


    function filterParts() {
      const input =
        document.getElementById("partSearch")
          .value
          .trim()
          .toLowerCase();

      const rows =
        document.querySelectorAll(
          "#partsTableBody tr"
        );
      const numberIndicator =
        document.querySelector(
          "#th-part-number .col-indicator"
        );

      const nameIndicator =
        document.querySelector(
          "#th-part-name .col-indicator"
        );

      // Reset indicators
      numberIndicator.style.visibility =
        "hidden";

      nameIndicator.style.visibility =
        "hidden";

      rows.forEach(row => {

        // Get ONLY plain text
        const partNumber =
          row.children[1]
            ?.textContent
            .trim()
            .toLowerCase() || '';

        const partName =
          row.children[2]
            ?.textContent
            .trim()
            .toLowerCase() || '';

        const numberMatch =
          input &&
          partNumber.includes(input);

        const nameMatch =
          input &&
          partName.includes(input);

        // Show indicator ONLY for actual matched column
        if (numberMatch) {

          numberIndicator.style.visibility =
            "visible";
        }
        if (nameMatch) {
          nameIndicator.style.visibility =
            "visible";
        }

        // Show / Hide rows
        row.style.display =
          (!input || numberMatch || nameMatch)
            ? ""
            : "none";

      });

    }

    async function saveProjectStatus() {
      const { partId } = getParamsFromUrl();
        const status =
      document.getElementById('partStatus').value;
    console.log(status);
      try {
        const res = await fetch(
          '/api/save-part-status',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              partId,
              status
            })
          }
        );
        const data = await res.json();
        if (data.success) {
          showToast('Status saved');
        }
      } catch (err) {
        console.error(err);
      }
    }



  async function loadProductsPoCount() {
    const { poId } = getParamsFromUrl();
    const res = await fetch(`/api/products-po-count/${poId}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    document.getElementById('docsCount').textContent =
      `${data.partCount}/${data.totalQty}`;
  }

  //donut chart
document.addEventListener("DOMContentLoaded", async () => {
  const ctx = document.getElementById("projectProgressChart");
  const percentEl = document.getElementById("centerPercent");
  const labelEl = document.getElementById("centerLabel");

  // For project page, compute counts based on parts belonging to the project
  const { poId } = getParamsFromUrl();

  let parts = [];
  try {
    if (poId) {
      const res = await fetch(`/api/parts/${poId}`);
      parts = await res.json();
    }
  } catch (err) {
    console.error('Error loading parts for chart', err);
  }

  // Map part statuses to buckets
  let completed = 0, pending = 0, InProgress = 0, onHold = 0;

  parts.forEach(p => {
    const s = (p.status || '').toLowerCase();
    if (['completed','done'].includes(s)) completed++;
    else if (['live','active','in progress'].includes(s)) InProgress++;
    else if (s === 'on-hold' || s === 'on hold') onHold++;
    else pending++;
  });

  const total = parts.length;

  const statusData = [
    { label: 'Completed', value: completed, color: '#fa788d' },
    { label: 'Pending', value: pending, color: '#c2185b' },
    { label: 'In Progress', value: InProgress, color: '#e91e8c' },
    { label: 'On Hold', value: onHold, color: '#ec6592' }
  ];

  if (ctx) {
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: statusData.map(item => item.label),
        datasets: [{
          data: statusData.map(item => item.value),
          backgroundColor: statusData.map(item => item.color),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        layout: { padding: 8 },
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: '"Gilroy", sans-serif', size: 12, weight: '400' },
            bodyFont: { family: '"Gilroy", sans-serif', size: 10, weight: '400' },
            callbacks: { label: function(context) { return context.label + ': ' + context.raw; } }
          }
        }
      }
    });
  }

  // CENTER TEXT ROTATOR ENGINE (uses dynamic statusData)
  let currentIndex = 0;

  function updateCenterText() {
    if (!percentEl || !labelEl) return;
    const current = statusData[currentIndex];

    percentEl.style.opacity = '0';
    labelEl.style.opacity = '0';
    percentEl.style.transform = 'scale(0.8)';
    labelEl.style.transform = 'scale(0.8)';

    setTimeout(() => {
      percentEl.innerText = current.value + '';
      labelEl.innerText = current.label;
      percentEl.style.color = current.color;

      percentEl.style.opacity = '1';
      labelEl.style.opacity = '1';
      percentEl.style.transform = 'scale(1)';
      labelEl.style.transform = 'scale(1)';
    }, 300);

    currentIndex = (currentIndex + 1) % statusData.length;
  }

  updateCenterText();
  setInterval(updateCenterText, 3000);
});


function openImportPopup() {
  const checked = document.querySelectorAll('.part-checkbox:checked');

  if (!checked.length) {
    showToast('Please select at least one part first', 'warning');
    return;
  }

  const tbody = document.getElementById('importPartsTbody');
  tbody.innerHTML = '';
  let total = 0;

  checked.forEach(cb => {
    const row = cb.closest('tr');
    const partNumber = row.children[2]?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const partName   = row.children[3]?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const partId     = row.getAttribute('data-id');

    const qtySpan = row.children[5]?.querySelector('.main-qty');
    const originalQty = parseInt(qtySpan?.textContent?.trim()) || 0;

    const qtyDiv = row.children[5]?.querySelector('div');

    // Always set originalQty on first time from the actual span text
    if (qtyDiv && !qtyDiv.dataset.originalQty) {
      qtyDiv.dataset.originalQty = originalQty;
    }

    // Always read trueOriginal from the span directly to avoid picking up badge text
    const trueOriginal    = originalQty;
    const alreadyInvoiced = parseInt(qtyDiv?.dataset.totalInvoiced || 0);
    const qty             = Math.max(0, trueOriginal - alreadyInvoiced);
    total += qty;

    const tr = document.createElement('tr');
    tr.dataset.partId = partId;
    tr.innerHTML = `
      <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:var(--primary);">
        ${partNumber}
      </td>
      <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">
        ${partName}
      </td>
      <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">
        <input type="number" class="import-qty-input"  min="1" value="${qty}"
        data-part-id="${partId}"
        oninput="recalcImportTotal()"
          style="width:80px;padding:6px 8px;border:1px solid #e5e7eb;border-radius:4px;
            text-align:center;font-size:13px;outline:none;background:#f9fafb;" />
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('importTotalQty').textContent = total;
  document.getElementById('importInvoiceInput').value = '';
  document.getElementById('importInvoiceError').textContent = '';

  const popup = document.getElementById('importPopup');
  popup.style.display = 'flex';
  document.getElementById('importPopupOverlay').style.display = 'block';
}

function closeImportPopup() {
  document.getElementById('importPopup').style.display = 'none';
  document.getElementById('importPopupOverlay').style.display = 'none';
}

const _submittedInvoices = [];

async function submitImport() {

  const invoiceNo =
    document.getElementById('importInvoiceInput')
      .value
      .trim();

  const errEl =
    document.getElementById('importInvoiceError');

  if (!invoiceNo) {

    errEl.textContent =
      'Invoice number is required.';

    return;
  }

  errEl.textContent = '';

  const inputs =
    document.querySelectorAll(
      '.import-qty-input'
    );

  const parts = [];

  inputs.forEach(inp => {

    const partId =
      inp.dataset.partId;

    const newQty =
      parseInt(inp.value) || 0;

    const mainRow =
      document.querySelector(
        `tr[data-id="${partId}"]`
      );

    let partNumber = '';
    let partName = '';

    if (mainRow) {

      partNumber =
        mainRow
          .querySelector(
            'td:nth-child(3)'
          )
          ?.textContent
          ?.trim() || '';

      partName =
        mainRow
          .querySelector(
            'td:nth-child(4)'
          )
          ?.textContent
          ?.trim() || '';

      const qtyDiv =
        mainRow
          .querySelector('.main-qty')
          ?.closest('div');

      if (qtyDiv) {

        const trueOriginal =
          parseInt(
            qtyDiv.dataset.originalQty || 0
          );

        const prevInvoiced =
          parseInt(
            qtyDiv.dataset.totalInvoiced || 0
          );

        const totalInvoiced =
          prevInvoiced + newQty;

        qtyDiv.dataset.totalInvoiced =
          totalInvoiced;

        if (
          totalInvoiced >= trueOriginal
        ) {

          const checkbox =
            mainRow.querySelector(
              '.part-checkbox'
            );

          if (checkbox) {

            checkbox.disabled = true;

            checkbox.style.opacity =
              '0.4';

            checkbox.style.cursor =
              'not-allowed';
          }

          mainRow.style.opacity =
            '0.6';
        }

        qtyDiv
          .querySelector(
            '.invoice-display'
          )
          ?.remove();

        const display =
          document.createElement(
            'span'
          );

        display.className =
          'invoice-display';

        display.onclick =
          e => e.stopPropagation();

        display.style.cssText = `
          display:inline-flex;
          align-items:center;
          gap:4px;
          margin-left:6px;
        `;

        display.innerHTML = `
          <span
            style="
              color:#166534;
              font-size:11px;
              border:1px solid #238352bf;
              font-weight:700;
              padding:6px 10px;
              border-radius:5px;
              white-space:nowrap;
            "
          >
            ${totalInvoiced}
          </span>
        `;

        qtyDiv.appendChild(display);
      }
    }


  const checkbox =
  mainRow?.querySelector('.part-checkbox');

const parentProductId =
  checkbox?.dataset.parentId || null;

parts.push({

  product_id:
    String(partId).startsWith('split_')
      ? Number(parentProductId)   // parent products_po.id
      : Number(partId),

  split_product_id:
    String(partId).startsWith('split_')
      ? Number(partId.replace('split_', ''))
      : null,

  part_number: partNumber,
   part_name: partName,

  quantity: newQty

});

  });

  console.log(parts);

  try {

    const res =
      await fetch(
        '/api/invoices/save',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({

            invoiceNumber:
              invoiceNo,

            parts

          })
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      throw new Error(
        data.error ||
        'Failed to save invoice'
      );
    }
    _submittedInvoices.push({
      invoiceNo,
      date:
        new Date(),
      parts
    });
    document.getElementById(
      'invoiceCountBadge'
    ).textContent =
      _submittedInvoices.length;
    showToast(
      `Invoice ${invoiceNo} submitted successfully`,
      'success'
    );
    closeImportPopup();
    document
      .querySelectorAll(
        '.part-checkbox'
      )
      .forEach(
        cb => cb.checked = false
      );

    const master =
      document.getElementById(
        'selectAllParts'
      );

    if (master) {

      master.checked = false;

      master.indeterminate = false;
    }

  } catch (err) {

    console.error(err);

    showToast(
      err.message,
      'error'
    );
  }
}
async function openInvoicesPanel() {

  const panel = document.getElementById('invoicesPanel');
  const list = document.getElementById('invoicesList');
  const empty = document.getElementById('invoicesEmptyState');

  const { poId } = getParamsFromUrl();

  try {

    const res = await fetch(
      `/api/project-invoices/${poId}`
    );

    const rows = await res.json();

    if (!rows.length) {

      empty.style.display = 'flex';
      list.innerHTML = '';

    } else {

      empty.style.display = 'none';

      const grouped = {};

      rows.forEach(row => {

        const invoiceNo =
          row.invoice_number || 'N/A';

        if (!grouped[invoiceNo]) {

          grouped[invoiceNo] = {

            invoiceNo,

            date: new Date(
              row.created_at
            ),

            parts: []

          };

        }

        grouped[invoiceNo].parts.push({

          partNumber:
            row.part_number || '-',

          partName:
            row.part_name || '-',

          qty:
            Number(row.quantity || 0)

        });

      });

      const invoices =
        Object.values(grouped);

      list.innerHTML = invoices.map((inv, i) => `

        <div style="
          border:1px solid #e5e7eb;
          border-radius:8px;
          margin-bottom:10px;
          overflow:hidden;
        ">

          <!-- Accordion Header -->
          <div
            onclick="toggleInvoiceAccordion(${i})"
            style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              padding:12px 14px;
              background:#fafafa;
              cursor:pointer;
              user-select:none;
              transition:background 0.2s;
            "
            onmouseover="
              this.style.background='#fff0f3'
            "
            onmouseout="
              this.style.background='#fafafa'
            "
          >

            <div style="
              display:flex;
              align-items:center;
              gap:8px;
            ">

              <i
                class="fa-solid fa-file-invoice"
                style="
                  color:var(--primary);
                  font-size:14px;
                "
              ></i>

              <span style="
                font-size:13px;
                font-weight:600;
                color:#111;
              ">
                ${inv.invoiceNo}
              </span>

              <span style="
                background:#EDE9FE;
                color:var(--primary);
                font-size:11px;
                font-weight:700;
                padding:2px 8px;
                border-radius:20px;
              ">
                ${inv.parts.length}
                part${inv.parts.length > 1 ? 's' : ''}
              </span>

            </div>

            <div style="
              display:flex;
              align-items:center;
              gap:10px;
            ">

              <span style="
                font-size:11px;
                color:#9ca3af;
              ">
                ${inv.date.toLocaleDateString()}
                ${inv.date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>

              <i
                class="fa-solid fa-chevron-down accordion-chevron-${i}"
                style="
                  font-size:12px;
                  color:#9ca3af;
                  transition:transform 0.25s;
                "
              ></i>

            </div>

          </div>

          <!-- Accordion Body -->
          <div
            id="invoiceAccordion-${i}"
            style="display:none;"
          >

            <table style="
              width:100%;
              border-collapse:collapse;
              font-size:12.5px;
            ">

              <thead>

                <tr style="
                  background:#f9fafb;
                ">

                  <th style="
                    text-align:left;
                    padding:7px 14px;
                    color:#6b7280;
                    font-size:11px;
                    font-weight:700;
                    text-transform:uppercase;
                    border-bottom:1px solid #f3f4f6;
                  ">
                    Part Number
                  </th>

                  <th style="
                    text-align:left;
                    padding:7px 14px;
                    color:#6b7280;
                    font-size:11px;
                    font-weight:700;
                    text-transform:uppercase;
                    border-bottom:1px solid #f3f4f6;
                  ">
                    Part Name
                  </th>

                  <th style="
                    text-align:center;
                    padding:7px 14px;
                    color:#6b7280;
                    font-size:11px;
                    font-weight:700;
                    text-transform:uppercase;
                    border-bottom:1px solid #f3f4f6;
                    width:70px;
                  ">
                    Qty
                  </th>

                </tr>

              </thead>

              <tbody>

                ${inv.parts.map(p => `

                  <tr>

                    <td style="
                      padding:8px 14px;
                      border-bottom:1px solid #f9fafb;
                      color:var(--primary);
                      font-weight:600;
                    ">
                      ${p.partNumber}
                    </td>

                    <td style="
                      padding:8px 14px;
                      border-bottom:1px solid #f9fafb;
                      color:#374151;
                    ">
                      ${p.partName}
                    </td>

                    <td style="
                      padding:8px 14px;
                      border-bottom:1px solid #f9fafb;
                      text-align:center;
                    ">
                      <span style="
                        background:#EDE9FE;
                        color:var(--primary);
                        font-size:11px;
                        font-weight:700;
                        padding:2px 10px;
                        border-radius:20px;
                      ">
                        ${p.qty}
                      </span>
                    </td>

                  </tr>

                `).join('')}

              </tbody>

            </table>

            <!-- Total -->

            <div style="
              display:flex;
              justify-content:flex-end;
              align-items:center;
              gap:8px;
              padding:8px 14px;
              background:#fff5f6;
              border-top:1px solid #f3f4f6;
            ">

              <span style="
                font-size:12px;
                color:#9ca3af;
              ">
                Total Qty:
              </span>

              <span style="
                font-size:13px;
                font-weight:700;
                color:var(--primary);
              ">
                ${inv.parts.reduce(
                  (s, p) => s + Number(p.qty || 0),
                  0
                )}
              </span>

            </div>

          </div>

        </div>

      `).join('');

    }

    panel.style.display = 'flex';

    document.getElementById(
      'invoicesPanelOverlay'
    ).style.display = 'block';

  } catch (err) {

    console.error(
      'Error loading invoices:',
      err
    );

    showToast(
      'Failed to load invoices',
      'error'
    );

  }

}

function toggleInvoiceAccordion(index) {
  const body    = document.getElementById(`invoiceAccordion-${index}`);
  const chevron = document.querySelector(`.accordion-chevron-${index}`);
  const isOpen  = body.style.display === 'block';

  // Close all first
  document.querySelectorAll('[id^="invoiceAccordion-"]').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelectorAll('[class*="accordion-chevron-"]').forEach(el => {
    el.style.transform = 'rotate(0deg)';
  });

  // Open clicked if it was closed
  if (!isOpen) {
    body.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  }
}

function closeInvoicesPanel() {
  document.getElementById('invoicesPanel').style.display = 'none';
  document.getElementById('invoicesPanelOverlay').style.display = 'none';
}

function recalcImportTotal() {
  let total = 0;
  document.querySelectorAll('.import-qty-input').forEach(inp => {
    total += parseInt(inp.value) || 0;
  });
  document.getElementById('importTotalQty').textContent = total;
}

function toggleSelectAll(master) {
  document.querySelectorAll('.part-checkbox')
    .forEach(cb => {
      if (!cb.disabled) {
        cb.checked = master.checked;
      }
    });
}
// Keep master checkbox in sync when individual boxes change
document.addEventListener('change', function(e) {
  if (!e.target.classList.contains('part-checkbox')) return;
  const all     = document.querySelectorAll('.part-checkbox:not(:disabled)');
  const checked = document.querySelectorAll('.part-checkbox:not(:disabled):checked');
  const master  = document.getElementById('selectAllParts');
  if (!master) return;
  master.checked       = all.length > 0 && all.length === checked.length;
  master.indeterminate = checked.length > 0 && checked.length < all.length;
});


async function loadInvoiceCount() {

  const { poId } = getParamsFromUrl();

  const res = await fetch(
    `/api/project-invoices/${poId}`
  );

  const rows = await res.json();

  const uniqueInvoices =
    [...new Set(rows.map(r => r.invoice_number))];

  document.getElementById(
    'invoiceCountBadge'
  ).textContent = uniqueInvoices.length;

}


// ── Adjust Qty Popup ──
let _adjustQtyPartId = null;
let _adjustQtyCurrentVal = 0;

function openAdjustQtyPopup(partId, partNumber, partName) {
  _adjustQtyPartId = partId;

  const currentSpan = document.getElementById(`current-qty-${partId}`);
  _adjustQtyCurrentVal = parseInt(currentSpan?.textContent?.trim()) || 0;

  document.getElementById('adjustQtyPartNumber').textContent = partNumber;
  document.getElementById('adjustQtyPartName').textContent   = partName;
  document.getElementById('adjustQtyCurrentDisplay').textContent = _adjustQtyCurrentVal;
  document.getElementById('adjustQtyValue').value  = '';
  document.getElementById('adjustQtyReason').value = '';

  // reset radio to Add
  document.querySelector('input[name="adjustType"][value="add"]').checked = true;

  const preview = document.getElementById('adjustQtyPreview');
  preview.style.display = 'none';

  document.getElementById('adjustQtyPopup').style.display   = 'block';
  document.getElementById('adjustQtyOverlay').style.display = 'block';
}

function closeAdjustQtyPopup() {
  document.getElementById('adjustQtyPopup').style.display   = 'none';
  document.getElementById('adjustQtyOverlay').style.display = 'none';
  _adjustQtyPartId   = null;
  _adjustQtyCurrentVal = 0;
}

function updateAdjustPreview() {
  const val      = parseInt(document.getElementById('adjustQtyValue').value) || 0;
  const type     = document.querySelector('input[name="adjustType"]:checked')?.value;
  const preview  = document.getElementById('adjustQtyPreview');
  const previewVal = document.getElementById('adjustQtyPreviewVal');

  let newQty = _adjustQtyCurrentVal;
  if (type === 'add')      newQty = _adjustQtyCurrentVal + val;
  if (type === 'subtract') newQty = Math.max(0, _adjustQtyCurrentVal - val);
  if (type === 'set')      newQty = val;

  if (val > 0 || type === 'set') {
    preview.style.display = 'flex';
    previewVal.textContent = newQty;
    previewVal.style.color = newQty < _adjustQtyCurrentVal ? '#dc2626' : '#059669';
    // update preview bg color
    preview.style.background = newQty < _adjustQtyCurrentVal ? '#fef2f2' : '#f0fdf4';
    preview.style.borderColor = newQty < _adjustQtyCurrentVal ? '#fecaca' : '#bbf7d0';
    preview.style.color       = newQty < _adjustQtyCurrentVal ? '#991b1b' : '#166534';
  } else {
    preview.style.display = 'none';
  }
}


async function applyDuplicate() {

  const partNumber =
    document.getElementById("duplicateText").value.trim();

  if (!partNumber) {
    alert("Enter Part Number");
    return;
  }

  const res = await fetch(
    `/api/duplicate-stages/${encodeURIComponent(partNumber)}`
  );

  const stages = await res.json();

  if (!stages.length) {
    alert("Part Number not found");
    return;
  }

  createDuplicateStages(stages);
}
function createDuplicateStages(stages) {

  const mfgBody = document.getElementById("tbody-mfg");
  if (!mfgBody) return;

  // Clear Manufacturing only
  mfgBody.innerHTML = "";

  stages.forEach(stage => {

    if (stage.section_title === "Manufacturing") {

      const row = buildRow(stage.stage_name);
      mfgBody.appendChild(row);

    }
    else if (stage.section_title === "Inspection") {

    // Set dropdown
    const select = document.getElementById("inspVariantSelect");
    if (select) {
        select.value = stage.stage_name;
    }

    // Set stage name textbox
    const tbody = document.getElementById("tbody-insp");

    if (tbody) {

        // Create one row if none exists
        if (tbody.rows.length === 0) {
            tbody.appendChild(buildRow(stage.stage_name));
        } else {
            // Fill existing row
            const input = tbody.querySelector("tr td:first-child input");
            if (input) {
                input.value = stage.stage_name;
            }
        }
    }
}
  });
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
    const { poId } = getParamsFromUrl();
  }
  catch (err) {
    console.error(err);
    showToast(
      err.message,
      'error'
    );
  }
}

function updateInventoryStock() {
  // Get inspection outward
  const inspOutward = parseFloat(
    document.querySelector('#tbody-insp .outward')?.value || 0
  );

  // Get dispatch inward
  const dispInward = parseFloat(
    document.querySelector('#tbody-disp .inward')?.value || 0
  );

  const stock = Math.max(0, inspOutward - dispInward);

  // Update display
  const el = document.getElementById('inventoryStockQty');
  if (el) el.textContent = stock;
}


function copyPartUrl() {
  const url = window.location.href;
  const icon = document.querySelector('.header-icons .fa-clone');

  navigator.clipboard.writeText(url).then(() => {
    if (icon) {
      icon.classList.remove('fa-clone');
      icon.classList.add('fa-circle-check');
      icon.style.color = '#000000';

      setTimeout(() => {
        icon.classList.remove('fa-circle-check');
        icon.classList.add('fa-clone');
        icon.style.color = '';
      }, 2000);
    }
  }).catch(() => {
    showToast('Failed to copy link', 'error');
  });
}

function sharePartUrl() {
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: 'Part Details',
      text: 'Check out this part on Project Tracker',
      url: url
    }).catch(() => {});
  } else {
    // Fallback — copy to clipboard if Web Share API not supported
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard', 'success');
    }).catch(() => {
      showToast('Failed to share link', 'error');
    });
  }
}

async function loadInventoryStock(partId) {

  try {

    const res =
      await fetch(
        `/api/inventory-stock/${partId}`
      );

    const data =
      await res.json();

    document.getElementById(
      'inventoryStockQty'
    ).textContent =
      data.stock || 0;

  }
  catch (err) {
    console.error(err);
  }
}

function filterParts() {
  const input = document.getElementById("partSearch").value.trim().toLowerCase();
  const rows = document.querySelectorAll("#partsTableBody tr");

  const table = document.querySelector('#partsTableBody').closest('table');
  const headers = table.querySelectorAll('thead th');

  // ✅ FIXED INDEXES
  const partNumberTh = headers[1]; // Part Number
  const partNameTh   = headers[2]; // Part Name

  // Remove old indicators
  document.querySelectorAll('.col-match-indicator').forEach(el => el.remove());

  let numberMatchCount = 0;
  let nameMatchCount   = 0;
  let totalVisible     = 0;

  rows.forEach(row => {
    const partNumber = row.children[2]?.textContent.trim().toLowerCase() || '';
    const partName   = row.children[3]?.textContent.trim().toLowerCase() || '';

    const numberMatch = input && partNumber.includes(input);
    const nameMatch   = input && partName.includes(input);

    if (!input || numberMatch || nameMatch) {
      row.style.display = '';
      totalVisible++;

      if (numberMatch) numberMatchCount++;
      if (nameMatch)   nameMatchCount++;
    } else {
      row.style.display = 'none';
    }
  });

  // Remove existing empty row
  const existingEmpty = document.getElementById('searchEmptyRow');
  if (existingEmpty) existingEmpty.remove();

  // Show "no part found"
  if (input && totalVisible === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.id = 'searchEmptyRow';
    emptyRow.innerHTML = `
      <td colspan="13" style="text-align:center;padding:32px 16px;color:#9ca3af;">
        <i class="fa-solid fa-magnifying-glass" style="font-size:22px;display:block;margin-bottom:8px;color:#d1d5db;"></i>
        <span style="font-size:13px;font-weight:600;">No part found</span>
      </td>`;
    document.getElementById('partsTableBody').appendChild(emptyRow);
  }

  // Add arrow to Part Number header
  if (input && numberMatchCount > 0) {
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-circle-arrow-down col-match-indicator';
    icon.style.cssText = 'margin-left:6px;color:#fa788d;font-size:13px;vertical-align:middle;';
    partNumberTh.appendChild(icon);
  }

  // Add arrow to Part Name header
  if (input && nameMatchCount > 0) {
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-circle-arrow-down col-match-indicator';
    icon.style.cssText = 'margin-left:6px;color:#fa788d;font-size:13px;vertical-align:middle;';
    partNameTh.appendChild(icon);
  }
}



function enableDragDrop(zoneEl, handlerFn, variant) {
  if (!zoneEl || zoneEl._dragEnabled) return;
  zoneEl._dragEnabled = true;

  zoneEl.addEventListener('dragover', function(e) {
    e.preventDefault();
    zoneEl.style.borderColor = '#fa788d';
    zoneEl.style.background = '#fff0f3';
  });
  zoneEl.addEventListener('dragleave', function() {
    zoneEl.style.borderColor = '#e5e7eb';
    zoneEl.style.background = '';
  });
  zoneEl.addEventListener('drop', function(e) {
    e.preventDefault();
    zoneEl.style.borderColor = '#e5e7eb';
    zoneEl.style.background = '';
    const fakeInput = { files: e.dataTransfer.files, value: '' };
    handlerFn(fakeInput, variant);
  });
}


document.addEventListener("change", function (e) {

    if (e.target.id === "selectAllService") {

        const checked = e.target.checked;

        document.querySelectorAll(".service-checkbox").forEach(cb => {
            cb.checked = checked;
        });

    }

});

async function saveServiceParts() {

    const parts = [...document.querySelectorAll(".service-checkbox:checked")]
        .map(cb => ({
            id: cb.value,
            is_split: cb.dataset.isSplit
        }));

    if (!parts.length) {
        alert("Select Parts");
        return;
    }

    try {

        const res = await fetch("/api/parts/mark-service", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ parts })
        });

        if (!res.ok) {
            throw new Error();
        }

        // Ignore backend message completely
        showToast("Blocked Successfully", "success");

        loadParts();

    } catch (err) {

        console.error(err);
        alert("Update Failed");

    }
}


function capitalizeFirst(input) {
    if (input.value.length > 0) {
        input.value =
            input.value.charAt(0).toUpperCase() +
            input.value.slice(1);
    }
}

function resetPartData() {

    // Clear upload state
    _uploadTrigger = null;

    // Clear snapshots
    _projectFilesSnapshot = [];
    _stageFilesSnapshot = [];

    // Clear selected part files
    selectedPartId = null;

    // Clear documents UI
    const container = document.getElementById("documentsContainer");
    if (container) container.innerHTML = "";

    // Reset upload popup
    const tbody = document.getElementById("uploadFilesTbody");
    if (tbody) tbody.innerHTML = "";

    const count = document.querySelector(".file-count");
    if (count) count.textContent = "0";
}