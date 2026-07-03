// Balance & Savings Buckets — Manage Bucket (manage-bucket.html)

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;
  if (App.monthRolloverPending) return;

  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('id');
  const bucket = App.buckets.find(b => b.id === targetId);

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
    App.processTransaction(targetId, amt, type, 'Direct adjustment');
    window.location.href = '/index.html';
  }

  nameInput.addEventListener('change', () => {
    if (nameInput.value.trim()) {
      bucket.name = nameInput.value.trim();
      App.saveState();
      titleEl.textContent = `MANAGE: ${bucket.name.toUpperCase()}`;
    }
  });

  targetInput.addEventListener('change', () => {
    const val = parseFloat(targetInput.value);
    if (!isNaN(val)) {
      bucket.targetAmount = val;
      App.saveState();
    }
  });

  btnDeposit.addEventListener('click', () => handleDirectAdjustment('deposit'));
  btnWithdraw.addEventListener('click', () => handleDirectAdjustment('withdraw'));

  btnDelete.addEventListener('click', () => {
    App.buckets = App.buckets.filter(b => b.id !== targetId);
    App.transactions = App.transactions.filter(t => t.bucketId !== targetId);
    App.saveState();
    window.location.href = '/index.html';
  });
});