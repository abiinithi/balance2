// Balance & Savings Buckets — Create Bucket (create-bucket.html)

document.addEventListener('DOMContentLoaded', () => {
  const App = window.App;
  if (App.monthRolloverPending) return;

  const bType = document.getElementById('select-create-bucket-type');
  const bName = document.getElementById('input-create-bucket-name');
  const bTarget = document.getElementById('input-create-bucket-target');
  const btnSubmit = document.getElementById('btn-submit-create-bucket');

  // --- Button Toggle Styling Logic (Using Existing Classes) ---
  // Safely targets only the buttons with data-value attributes
  const toggleButtons = document.querySelectorAll('button[data-value]');

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // 1. Remove the solid 'submit' styling from all choices
      toggleButtons.forEach(b => b.classList.remove('submit'));

      // 2. Add the solid 'submit' styling to the selected choice
      btn.classList.add('submit');

      // 3. Update the hidden input tracker for the push state array
      bType.value = btn.getAttribute('data-value');
    });
  });
  // -------------------------------------------------------------

  setTimeout(() => bName.focus(), 150);

  btnSubmit.addEventListener('click', () => {
    const name = bName.value.trim();
    if (!name) return;

    App.buckets.push({
      id: App.generateId(),
      name,
      type: bType.value,
      targetAmount: parseFloat(bTarget.value) || 0,
      currentAmount: 0
    });
    App.saveState();
    window.location.href = '/index.html';
  });
});