// Balance & Savings Buckets — Core Engine
// Loaded on every page, before the page-specific script.
// Exposes shared state and utilities on window.App.

window.App = {};

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;

  // --- Global State ---
  App.buckets = [];
  App.transactions = [];
  App.currentMonth = '';

  // --- Core Utility Functions ---
  App.generateId = function () {
    return 'b_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  };

  App.formatRupees = function (amount) {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    return `₹${formatted}`;
  };

  App.loadState = function () {
    try { App.buckets = JSON.parse(localStorage.getItem('buckets')) || []; } catch (e) { App.buckets = []; }
    try { App.transactions = JSON.parse(localStorage.getItem('transactions')) || []; } catch (e) { App.transactions = []; }
    App.currentMonth = localStorage.getItem('currentMonth') || '';
  };

  App.saveState = function () {
    localStorage.setItem('buckets', JSON.stringify(App.buckets));
    localStorage.setItem('transactions', JSON.stringify(App.transactions));
    localStorage.setItem('currentMonth', App.currentMonth);
  };

  App.processTransaction = function (bucketId, amount, type, note) {
    const bucket = App.buckets.find(b => b.id === bucketId);
    if (!bucket) return;

    App.transactions.push({
      id: App.generateId(),
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
    App.saveState();
  };

  // --- Run Global Lifecycle Instantiation ---
  App.loadState();

  const today = new Date();
  App.realCurrentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  App.currentPath = window.location.pathname;

  // Initialize fresh month timestamp if empty
  if (!App.currentMonth) {
    App.currentMonth = App.realCurrentMonth;
    App.saveState();
  }

  // Intercept routing structure if system transitions across calendar months.
  // Page scripts check App.monthRolloverPending and bail out early if true,
  // so they don't touch the DOM of a page we're about to navigate away from.
  App.monthRolloverPending = (App.currentMonth !== App.realCurrentMonth && !App.currentPath.includes('month-end.html'));

  if (App.monthRolloverPending) {
    window.location.href = '/month-end.html';
  }
});