let memories = JSON.parse(localStorage.getItem('memories') || '[]');
let trash = JSON.parse(localStorage.getItem('trash') || '[]');

function saveAll() {
  localStorage.setItem('memories', JSON.stringify(memories));
  localStorage.setItem('trash', JSON.stringify(trash));
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(section => section.classList.add('hidden'));
  document.getElementById(tab + 'Tab').classList.remove('hidden');
  if (tab === 'home') renderGallery();
  else if (tab === 'trash') renderTrash();
}

function uploadImages() {
  const input = document.getElementById('imageUpload');
  const category = document.getElementById('categorySelect').value;
  Array.from(input.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      memories.push({
        id: Date.now() + Math.random(),
        src: e.target.result,
        category,
        date: new Date().toISOString()
      });
      saveAll();
      renderGallery();
    };
    reader.readAsDataURL(file);
  });
}

function renderGallery() {
  const container = document.getElementById('galleryContainer');
  container.innerHTML = '';
  const grouped = groupByDate(memories);
  for (const group in grouped) {
    const title = document.createElement('h3');
    title.textContent = group;
    container.appendChild(title);
    grouped[group].forEach(mem => container.appendChild(memoryCard(mem, true)));
  }
}

function memoryCard(mem, deletable = false) {
  const card = document.createElement('div');
  card.className = 'memory-card';
  const img = document.createElement('img');
  img.src = mem.src;
  img.onclick = () => openLightbox(mem.src);
  card.appendChild(img);

  if (deletable) {
    const del = document.createElement('button');
    del.textContent = '🗑️';
    del.onclick = () => {
      if (confirm('This image will stay in trash for 15 days, then be deleted.')) {
        trash.push({ ...mem, deletedAt: new Date().toISOString() });
        memories = memories.filter(m => m.id !== mem.id);
        saveAll();
        renderGallery();
      }
    };
    card.appendChild(del);
  }

  return card;
}

function renderTrash() {
  const container = document.getElementById('trashContainer');
  container.innerHTML = '';
  const now = Date.now();
  trash = trash.filter(item => now - new Date(item.deletedAt).getTime() < 15 * 24 * 60 * 60 * 1000);
  trash.forEach(mem => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    const img = document.createElement('img');
    img.src = mem.src;
    card.appendChild(img);
    const btns = document.createElement('div');
    btns.className = 'trash-buttons';

    const restore = document.createElement('button');
    restore.textContent = 'Restore';
    restore.onclick = () => {
      memories.push(mem);
      trash = trash.filter(t => t.id !== mem.id);
      saveAll();
      renderTrash();
    };

    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.onclick = () => {
      trash = trash.filter(t => t.id !== mem.id);
      saveAll();
      renderTrash();
    };

    btns.appendChild(restore);
    btns.appendChild(remove);
    card.appendChild(btns);
    container.appendChild(card);
  });
}

function groupByDate(list) {
  const groups = {};
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  list.forEach(mem => {
    const d = new Date(mem.date);
    const key = `${d.getFullYear()} ${d.getMonth() < 6 ? 'Jan-Jun' : 'Jul-Dec'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(mem);
  });
  return groups;
}

function searchMemories() {
  const text = document.getElementById('searchInput').value.toLowerCase();
  const month = document.getElementById('searchMonth').value;
  const cat = document.getElementById('searchCategory').value;
  const result = memories.filter(mem => {
    const d = new Date(mem.date);
    const matchText = cat ? mem.category === cat : true;
    const matchDate = month ? mem.date.startsWith(month) : true;
    return (mem.category.includes(text) || mem.date.includes(text)) && matchText && matchDate;
  });

  const container = document.getElementById('searchResults');
  container.innerHTML = '';
  result.forEach(mem => container.appendChild(memoryCard(mem, true)));
}

function openLightbox(src) {
  document.getElementById('lightboxImage').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

// Theme + Font
const themes = {
  blue: { '--bg-color': '#e0f7fa', '--accent-color': '#90caf9' },
  peach: { '--bg-color': '#ffe0b2', '--accent-color': '#ffab91' },
  green: { '--bg-color': '#e0f2f1', '--accent-color': '#a5d6a7' },
  purple: { '--bg-color': '#f3e5f5', '--accent-color': '#ce93d8' },
};

document.getElementById('themeSelector').onchange = (e) => {
  const selected = themes[e.target.value];
  for (const key in selected) {
    document.documentElement.style.setProperty(key, selected[key]);
  }
  localStorage.setItem('theme', e.target.value);
};

document.getElementById('fontSelector').onchange = (e) => {
  const font = e.target.value;
  const map = {
    poppins: "'Poppins', sans-serif",
    roboto: "'Roboto', sans-serif",
    courier: "'Courier New', monospace",
    playfair: "'Playfair Display', serif"
  };
  document.documentElement.style.setProperty('--font-family', map[font]);
  localStorage.setItem('font', font);
};

// Restore saved settings
window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'blue';
  const savedFont = localStorage.getItem('font') || 'poppins';
  document.getElementById('themeSelector').value = savedTheme;
  document.getElementById('fontSelector').value = savedFont;
  document.getElementById('themeSelector').onchange({ target: { value: savedTheme } });
  document.getElementById('fontSelector').onchange({ target: { value: savedFont } });
  renderGallery();
};
