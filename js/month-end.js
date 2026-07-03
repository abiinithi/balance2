// Balance & Savings Buckets — Month End Resolution (month-end.html)

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;
  // Note: no monthRolloverPending check here — this IS the month-end page,
  // core.js already excludes month-end.html from the redirect condition.

  const resContainer = document.getElementById('resolution-buckets-container');
  const btnFinish = document.getElementById('btn-complete-resolution');
  const leftoverBuckets = App.buckets.filter(b => b.type === 'budget' && (b.targetAmount - b.currentAmount) > 0);

  if (leftoverBuckets.length === 0) {
    finalizeSystemMonthShift();
    return;
  }

  const resolutionState = {};

  leftoverBuckets.forEach(b => {
    const leftover = b.targetAmount - b.currentAmount;
    resolutionState[b.id] = { action: null, targetId: null, amount: leftover };

    const box = document.createElement('div');
    box.className = 'resolution-box';

    const savingBuckets = App.buckets.filter(sb => sb.type === 'saving');
    const targetOptions = savingBuckets.map(sb => `<option value="${sb.id}">${sb.name}</option>`).join('');

    box.innerHTML = `
      <div class="resolution-box-header">
        <span>${b.name}</span>
        <span class="resolution-box-balance">${App.formatRupees(leftover)}</span>
      </div>
      <select class="text-input select-action">
        <option value="" disabled selected>Choose action...</option>
        <option value="rollover">Rollover to next month target</option>
        ${savingBuckets.length > 0 ? '<option value="transfer">Transfer to Saving bucket...</option>' : ''}
      </select>
      <select class="text-input select-target" style="display: none; margin-top: 8px;">
        <option value="" disabled selected>Select saving bucket...</option>
        ${targetOptions}
      </select>
    `;

    const actionSelect = box.querySelector('.select-action');
    const targetSelect = box.querySelector('.select-target');

    actionSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      resolutionState[b.id].action = val;
      if (val === 'transfer') {
        targetSelect.style.display = 'block';
        resolutionState[b.id].targetId = targetSelect.value || null;
      } else {
        targetSelect.style.display = 'none';
        resolutionState[b.id].targetId = null;
      }
      validateResolutionProgress();
    });

    targetSelect.addEventListener('change', (e) => {
      resolutionState[b.id].targetId = e.target.value;
      validateResolutionProgress();
    });

    resContainer.appendChild(box);
  });

  function validateResolutionProgress() {
    const isComplete = Object.values(resolutionState).every(s =>
      s.action === 'rollover' || (s.action === 'transfer' && s.targetId)
    );
    btnFinish.disabled = !isComplete;
  }

  btnFinish.addEventListener('click', () => {
    Object.entries(resolutionState).forEach(([bId, state]) => {
      const src = App.buckets.find(x => x.id === bId);
      if (!src) return;

      if (state.action === 'rollover') {
        src.targetAmount += state.amount;
      } else if (state.action === 'transfer') {
        const dest = App.buckets.find(x => x.id === state.targetId);
        if (dest) dest.currentAmount += state.amount;
      }
    });
    finalizeSystemMonthShift();
  });

  function finalizeSystemMonthShift() {
    App.transactions = []; // Clear transaction lists across monthly period blocks
    App.buckets.forEach(b => { if (b.type === 'budget') b.currentAmount = 0; });
    App.currentMonth = App.realCurrentMonth;
    App.saveState();
    window.location.href = '/index.html';
  }
});