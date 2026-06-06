/* ── Image preview on file input ─── */
document.querySelectorAll('input[type=file][data-preview]').forEach(input => {
  input.addEventListener('change', function () {
    const previewId = this.dataset.preview;
    const container = document.getElementById(previewId);
    if (!container) return;
    container.innerHTML = '';
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrap = document.createElement('div');
        wrap.className = 'img-preview-item';
        wrap.innerHTML = `<img src="${e.target.result}" /><button class="remove" type="button" onclick="this.parentNode.remove()">✕</button>`;
        container.appendChild(wrap);
      };
      reader.readAsDataURL(file);
    });
  });
});

/* ── Confirm delete ─── */
document.querySelectorAll('[data-confirm]').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const msg = this.dataset.confirm || 'Are you sure you want to delete this?';
    if (!confirm(msg)) e.preventDefault();
  });
});

/* ── Live search in tables ─── */
const searchInput = document.getElementById('tableSearch');
if (searchInput) {
  searchInput.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ── Column filters ─── */
document.querySelectorAll('[data-filter-column]').forEach(select => {
  select.addEventListener('change', function () {
    const column = Number(this.dataset.filterColumn);
    const value = this.value.toLowerCase();
    document.querySelectorAll('tbody tr').forEach(row => {
      const cell = row.querySelectorAll('td')[column];
      if (!cell || !value) {
        row.style.display = '';
        return;
      }
      row.style.display = cell.textContent.toLowerCase().includes(value) ? '' : 'none';
    });
  });
});

/* ── Auto-dismiss alerts ─── */
document.querySelectorAll('.alert[data-auto]').forEach(el => {
  setTimeout(() => el.style.opacity = '0', 3000);
  setTimeout(() => el.remove(), 3500);
  el.style.transition = 'opacity 0.5s';
});

/* ── Topbar admin name ─── */
const now = new Date();
const greeting = document.getElementById('greeting');
if (greeting) {
  const h = now.getHours();
  greeting.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/* ── Sidebar active state ─── */
document.querySelectorAll('.nav-item').forEach(item => {
  if (item.getAttribute('href') === window.location.pathname) {
    item.classList.add('active');
  }
});
