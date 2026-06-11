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

/* ── Auto-dismiss alerts & toasts ─── */
document.querySelectorAll('.alert[data-auto], .toast[data-auto]').forEach(el => {
  const isToast = el.classList.contains('toast');
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = isToast ? 'translateX(40px) scale(0.95)' : 'translateY(-10px)';
  }, 4500);
  setTimeout(() => el.remove(), 5000);
  el.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
});

/* ── Close button handler ─── */
document.querySelectorAll('.alert button, .toast-close').forEach(btn => {
  btn.addEventListener('click', function() {
    const parent = this.closest('.toast') || this.closest('.alert');
    if (parent) {
      const isToast = parent.classList.contains('toast');
      parent.style.opacity = '0';
      parent.style.transform = isToast ? 'translateX(40px) scale(0.95)' : 'translateY(-10px)';
      setTimeout(() => parent.remove(), 400);
    }
  });
});

/* ── Toast close helper function ─── */
window.closeToast = function(btn) {
  const toast = btn.closest('.toast');
  if (toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px) scale(0.95)';
    setTimeout(() => toast.remove(), 400);
  }
};

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
