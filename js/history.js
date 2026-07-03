// Balance & Savings Buckets — History (history.html)

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;
  if (App.monthRolloverPending) return;

  const historyListEl = document.getElementById('history-list');

  function renderTransactions() {
    historyListEl.innerHTML = '';
    if (App.transactions.length === 0) {
      historyListEl.innerHTML = '<div class="buckets-empty">NO TRANSACTIONS</div>';
      return;
    }

    const sorted = [...App.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(t => {
      const bucket = App.buckets.find(b => b.id === t.bucketId);
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
          <span class="history-amount ${t.type}">${t.type === 'deposit' ? '+' : '-'}${App.formatRupees(t.amount)}</span>
          <button class="history-delete" data-txid="${t.id}">DELETE</button>
        </div>
      `;
      historyListEl.appendChild(item);
    });
  }

  historyListEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('history-delete')) {
      const txId = e.target.getAttribute('data-txid');
      const t = App.transactions.find(x => x.id === txId);
      if (!t) return;

      const bucket = App.buckets.find(b => b.id === t.bucketId);
      if (bucket) {
        if (bucket.type === 'budget') {
          bucket.currentAmount += (t.type === 'withdraw') ? -t.amount : t.amount;
        } else {
          bucket.currentAmount += (t.type === 'deposit') ? -t.amount : t.amount;
        }
      }
      App.transactions = App.transactions.filter(x => x.id !== txId);
      App.saveState();
      renderTransactions();
    }
  });

  renderTransactions();
});