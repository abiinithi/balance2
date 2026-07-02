// Nothing OS Balance & Savings Buckets — Multi-Page Application Engine

document.addEventListener('DOMContentLoaded', () => {
  // --- Global State ---
  let buckets = [];
  let transactions = [];
  let currentMonth = '';

  // --- Core Utility Functions ---
  function generateId() {
    return 'b_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  function formatRupees(amount) {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    return `₹${formatted}`;
  }

  function loadState() {
    try { buckets = JSON.parse(localStorage.getItem('buckets')) || []; } catch (e) { buckets = []; }
    try { transactions = JSON.parse(localStorage.getItem('transactions')) || []; } catch (e) { transactions = []; }
    currentMonth = localStorage.getItem('currentMonth') || '';
  }

  function saveState() {
    localStorage.setItem('buckets', JSON.stringify(buckets));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('currentMonth', currentMonth);
  }

  function processTransaction(bucketId, amount, type, note) {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;

    transactions.push({
      id: generateId(),
      bucketId,
      amount,
      type,
      note,
      date: new Date().toISOString()
    });

    if (bucket.type === 'budget') {
      if (type === 'withdraw') bucket.currentAmount += amount;
      if (type === 'deposit') bucket.currentAmount -= amount;
    } else {
      if (type === 'deposit') bucket.currentAmount += amount;
      if (type === 'withdraw') bucket.currentAmount -= amount;
    }
    saveState();
  }

  // --- Run Global Lifecycle Instantiation ---
  loadState();

  const today = new Date();
  const realCurrentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentPath = window.location.pathname;

  // Initialize fresh month timestamp if empty
  if (!currentMonth) {
    currentMonth = realCurrentMonth;
    saveState();
  }

  // Intercept routing structure if system transitions across calendar months
  if (currentMonth !== realCurrentMonth && !currentPath.includes('month-end.html')) {
    window.location.href = '/month-end.html';
    return;
  }

  // =========================================================================
  // ROUTE 1: DASHBOARD VIEW (index.html)
  // =========================================================================
  if (currentPath === '/' || currentPath.includes('index.html')) {
    const balanceAmountEl = document.getElementById('balance-amount');
    const widgetBucketSelect = document.getElementById('widget-bucket-select');
    const bucketsListEl = document.getElementById('buckets-list');

    function populateDashboardSelect() {
      widgetBucketSelect.innerHTML = '<option value="total">TOTAL BALANCE</option>';
      buckets.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name.toUpperCase();
        widgetBucketSelect.appendChild(opt);
      });
    }

    function updateMainUI() {
      let displayValue = 0;
      const selected = widgetBucketSelect.value;
      
      if (selected === 'total') {
        displayValue = buckets
          .filter(b => b.type === 'budget')
          .reduce((acc, b) => acc + (b.targetAmount - b.currentAmount), 0);
      } else {
        const bucket = buckets.find(b => b.id === selected);
        if (bucket) {
          displayValue = bucket.type === 'budget' ? (bucket.targetAmount - bucket.currentAmount) : bucket.currentAmount;
        }
      }

      balanceAmountEl.textContent = formatRupees(displayValue);
      const length = balanceAmountEl.textContent.length;
      balanceAmountEl.style.fontSize = length > 12 ? '26px' : length > 8 ? '32px' : '42px';
    }

    function renderBuckets() {
      bucketsListEl.innerHTML = '';
      if (buckets.length === 0) {
        bucketsListEl.innerHTML = '<div class="buckets-empty">NO BUCKETS YET</div>';
        return;
      }

      buckets.forEach(bucket => {
        const item = document.createElement('a');
        item.className = 'bucket-item';
        item.href = `/manage-bucket.html?id=${bucket.id}`;
        item.style.textDecoration = 'none';

        const isBudget = bucket.type === 'budget';
        const valueDisplay = isBudget ? (bucket.targetAmount - bucket.currentAmount) : bucket.currentAmount;
        const pct = bucket.targetAmount > 0 ? Math.round((bucket.currentAmount / bucket.targetAmount) * 100) : 0;

        item.innerHTML = `
          <div style="display: flex; flex-direction: column;">
            <span class="bucket-name">${bucket.name}</span>
            <span style="font-family: var(--font-sans); font-size: 9px; color: var(--text-secondary); margin-top: 4px;">${bucket.type.toUpperCase()}</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end;">
            <span class="bucket-balance">${formatRupees(valueDisplay)}</span>
            <span style="font-family: var(--font-sans); font-size: 9px; color: var(--text-secondary); margin-top: 4px;">
              ${isBudget ? `REMAINING OF ${formatRupees(bucket.targetAmount)}` : `${pct}% OF ${formatRupees(bucket.targetAmount)}`}
            </span>
          </div>
        `;
        bucketsListEl.appendChild(item);
      });
    }

    widgetBucketSelect.addEventListener('change', updateMainUI);
    populateDashboardSelect();
    updateMainUI();
    renderBuckets();
  }

  // =========================================================================
  // ROUTE 2: TRANSACTION WRAPPER VIEW (transaction.html)
  // =========================================================================
  if (currentPath.includes('transaction.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('type') || 'incoming'; // incoming or outgoing

    const pageWrapper = document.getElementById('transaction-page-wrapper');
    const titleEl = document.getElementById('transaction-type-title');
    const prefixEl = document.getElementById('transaction-prefix');
    const amountInput = document.getElementById('input-transaction-amount');
    const bucketSelect = document.getElementById('select-transaction-bucket');
    const noteInput = document.getElementById('input-transaction-note');
    const btnConfirm = document.getElementById('btn-confirm-transaction');

    // Adapt layout contextual visual flags
    if (mode === 'outgoing') {
      pageWrapper.classList.replace('incoming', 'outgoing');
      titleEl.textContent = 'OUTGOING AMOUNT';
      prefixEl.textContent = '-';
    } else {
      titleEl.textContent = 'INCOMING AMOUNT';
      prefixEl.textContent = '+';
    }

    // Populate transaction options mapping
    bucketSelect.innerHTML = buckets.length === 0 
      ? '<option value="">No buckets available</option>' 
      : buckets.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    setTimeout(() => amountInput.focus(), 150);

    btnConfirm.addEventListener('click', () => {
      const amount = parseFloat(amountInput.value);
      const bucketId = bucketSelect.value;
      const note = noteInput.value.trim();

      if (isNaN(amount) || amount <= 0 || !bucketId) return;

      const txType = mode === 'incoming' ? 'deposit' : 'withdraw';
      processTransaction(bucketId, amount, txType, note);
      window.location.href = '/index.html';
    });

    noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnConfirm.click(); });
  }

  // =========================================================================
  // ROUTE 3: TRANSACTION LOG / RECORDS (history.html)
  // =========================================================================
  if (currentPath.includes('history.html')) {
    const historyListEl = document.getElementById('history-list');

    function renderTransactions() {
      historyListEl.innerHTML = '';
      if (transactions.length === 0) {
        historyListEl.innerHTML = '<div class="buckets-empty">NO TRANSACTIONS</div>';
        return;
      }

      const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      sorted.forEach(t => {
        const bucket = buckets.find(b => b.id === t.bucketId);
        const item = document.createElement('div');
        item.className = 'history-item';

        const d = new Date(t.date);
        const timestamp = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
          <div class="history-item-left">
            <span class="history-date">${timestamp}</span>
            <span class="history-note">${t.note || 'No note'}</span>
            <span class="history-bucket">${bucket ? bucket.name.toUpperCase() : 'DELETED BUCKET'}</span>
          </div>
          <div class="history-item-right">
            <span class="history-amount ${t.type}">${t.type === 'deposit' ? '+' : '-'}${formatRupees(t.amount)}</span>
            <button class="history-delete" data-txid="${t.id}">DELETE</button>
          </div>
        `;
        historyListEl.appendChild(item);
      });
    }

    historyListEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('history-delete')) {
        const txId = e.target.getAttribute('data-txid');
        const t = transactions.find(x => x.id === txId);
        if (!t) return;

        const bucket = buckets.find(b => b.id === t.bucketId);
        if (bucket) {
          if (bucket.type === 'budget') {
            bucket.currentAmount += (t.type === 'withdraw') ? -t.amount : t.amount;
          } else {
            bucket.currentAmount += (t.type === 'deposit') ? -t.amount : t.amount;
          }
        }
        transactions = transactions.filter(x => x.id !== txId);
        saveState();
        renderTransactions();
      }
    });

    renderTransactions();
  }

  // =========================================================================
  // ROUTE 4: NEW SAVINGS CONTAINER INTERFACE (create-bucket.html)
  // =========================================================================
  if (currentPath.includes('create-bucket.html')) {
    const bType = document.getElementById('select-create-bucket-type');
    const bName = document.getElementById('input-create-bucket-name');
    const bTarget = document.getElementById('input-create-bucket-target');
    const btnSubmit = document.getElementById('btn-submit-create-bucket');

    setTimeout(() => bName.focus(), 150);

    btnSubmit.addEventListener('click', () => {
      const name = bName.value.trim();
      if (!name) return;

      buckets.push({
        id: generateId(),
        name,
        type: bType.value,
        targetAmount: parseFloat(bTarget.value) || 0,
        currentAmount: 0
      });
      saveState();
      window.location.href = '/index.html';
    });
  }

  // =========================================================================
  // ROUTE 5: WORKSPACE INTERFACE SPECIFICS (manage-bucket.html)
  // =========================================================================
  if (currentPath.includes('manage-bucket.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    const bucket = buckets.find(b => b.id === targetId);

    if (!bucket) {
      window.location.href = '/index.html';
      return;
    }

    const titleEl = document.getElementById('bucket-manager-title');
    const nameInput = document.getElementById('input-bucket-name');
    const targetInput = document.getElementById('input-bucket-target');
    const amountInput = document.getElementById('input-bucket-amount');
    
    const btnDelete = document.getElementById('btn-delete-bucket');
    const btnWithdraw = document.getElementById('btn-withdraw-bucket');
    const btnDeposit = document.getElementById('btn-deposit-bucket');

    titleEl.textContent = `MANAGE: ${bucket.name.toUpperCase()}`;
    nameInput.value = bucket.name;
    targetInput.value = bucket.targetAmount;

    setTimeout(() => amountInput.focus(), 150);

    function handleDirectAdjustment(type) {
      const amt = parseFloat(amountInput.value);
      if (isNaN(amt) || amt <= 0) return;
      processTransaction(targetId, amt, type, 'Direct adjustment');
      window.location.href = '/index.html';
    }

    nameInput.addEventListener('change', () => {
      if (nameInput.value.trim()) {
        bucket.name = nameInput.value.trim();
        saveState();
        titleEl.textContent = `MANAGE: ${bucket.name.toUpperCase()}`;
      }
    });

    targetInput.addEventListener('change', () => {
      const val = parseFloat(targetInput.value);
      if (!isNaN(val)) {
        bucket.targetAmount = val;
        saveState();
      }
    });

    btnDeposit.addEventListener('click', () => handleDirectAdjustment('deposit'));
    btnWithdraw.addEventListener('click', () => handleDirectAdjustment('withdraw'));

    btnDelete.addEventListener('click', () => {
      buckets = buckets.filter(b => b.id !== targetId);
      transactions = transactions.filter(t => t.bucketId !== targetId);
      saveState();
      window.location.href = '/index.html';
    });
  }

  // =========================================================================
  // ROUTE 6: PERIOD INTERCEPTOR ROUTER SCREEN (month-end.html)
  // =========================================================================
  if (currentPath.includes('month-end.html')) {
    const resContainer = document.getElementById('resolution-buckets-container');
    const btnFinish = document.getElementById('btn-complete-resolution');
    const leftoverBuckets = buckets.filter(b => b.type === 'budget' && (b.targetAmount - b.currentAmount) > 0);

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

      const savingBuckets = buckets.filter(sb => sb.type === 'saving');
      const targetOptions = savingBuckets.map(sb => `<option value="${sb.id}">${sb.name}</option>`).join('');

      box.innerHTML = `
        <div class="resolution-box-header">
          <span>${b.name}</span>
          <span class="resolution-box-balance">${formatRupees(leftover)}</span>
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
        const src = buckets.find(x => x.id === bId);
        if (!src) return;

        if (state.action === 'rollover') {
          src.targetAmount += state.amount;
        } else if (state.action === 'transfer') {
          const dest = buckets.find(x => x.id === state.targetId);
          if (dest) dest.currentAmount += state.amount;
        }
      });
      finalizeSystemMonthShift();
    });

    function finalizeSystemMonthShift() {
      transactions = []; // Clear transaction lists across monthly period blocks
      buckets.forEach(b => { if (b.type === 'budget') b.currentAmount = 0; });
      currentMonth = realCurrentMonth;
      saveState();
      window.location.href = '/index.html';
    }
  }
});