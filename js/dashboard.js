// Balance & Savings Buckets — Dashboard (index.html)

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;
  if (App.monthRolloverPending) return;

  const balanceAmountEl = document.getElementById('balance-amount');
  const widgetBucketSelect = document.getElementById('widget-bucket-select');
  const bucketsListEl = document.getElementById('buckets-list');

  function populateDashboardSelect() {
    widgetBucketSelect.innerHTML = '<option value="total">TOTAL BALANCE</option>';
    App.buckets.forEach(b => {
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
      displayValue = App.buckets
        .filter(b => b.type === 'budget')
        .reduce((acc, b) => acc + (b.targetAmount - b.currentAmount), 0);
    } else {
      const bucket = App.buckets.find(b => b.id === selected);
      if (bucket) {
        displayValue = bucket.type === 'budget' ? (bucket.targetAmount - bucket.currentAmount) : bucket.currentAmount;
      }
    }

    balanceAmountEl.textContent = App.formatRupees(displayValue);
    const length = balanceAmountEl.textContent.length;
    balanceAmountEl.style.fontSize = length > 12 ? '26px' : length > 8 ? '32px' : '42px';
  }

  function renderBuckets() {
    bucketsListEl.innerHTML = '';
    if (App.buckets.length === 0) {
      bucketsListEl.innerHTML = '<div class="buckets-empty">NO BUCKETS YET</div>';
      return;
    }

    App.buckets.forEach(bucket => {
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
          <span class="bucket-balance">${App.formatRupees(valueDisplay)}</span>
          <span style="font-family: var(--font-sans); font-size: 9px; color: var(--text-secondary); margin-top: 4px;">
            ${isBudget ? `REMAINING OF ${App.formatRupees(bucket.targetAmount)}` : `${pct}% OF ${App.formatRupees(bucket.targetAmount)}`}
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

  // --- Swipe Gesture Logic ---
  const widgetCard = document.getElementById('widget-card');
  let touchStartY = 0;
  let touchEndY = 0;
  const swipeThreshold = 60; // Adjust this number for sensitivity (in pixels)

  if (widgetCard) {
    widgetCard.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    widgetCard.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      handleWidgetSwipe();
    }, { passive: true });
  }

  function handleWidgetSwipe() {
    const distance = touchEndY - touchStartY;

    // Swipe Down (reveals top hint) -> Go to incoming transaction
    if (distance > swipeThreshold) {
      window.location.href = "/transaction.html?type=incoming";
    }
    // Swipe Up (reveals bottom hint) -> Go to outgoing transaction
    else if (distance < -swipeThreshold) {
      window.location.href = "/transaction.html?type=outgoing";
    }
  }
});