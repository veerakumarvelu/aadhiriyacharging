document.getElementById('year').textContent = new Date().getFullYear();

const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('#navLinks a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const value = document.getElementById('sessionSearch').value.trim();
  const result = document.getElementById('searchResult');

  if (!value) {
    result.textContent = 'Enter a vehicle number, invoice number, session ID or charger name.';
    return;
  }

  result.textContent = `Search for "${value}" is ready. Connect your ZEON CSV or API to return live results here.`;
});
