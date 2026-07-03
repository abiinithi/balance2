// Balance & Savings Buckets — Transaction (transaction.html)

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;
  if (App.monthRolloverPending) return;

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
  bucketSelect.innerHTML = App.buckets.length === 0
    ? '<option value="">No buckets available</option>'
    : App.buckets.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

  setTimeout(() => amountInput.focus(), 150);

  btnConfirm.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const bucketId = bucketSelect.value;
    const note = noteInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !bucketId) return;

    const txType = mode === 'incoming' ? 'deposit' : 'withdraw';
    App.processTransaction(bucketId, amount, txType, note);
    window.location.href = '/index.html';
  });

  noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnConfirm.click(); });
});