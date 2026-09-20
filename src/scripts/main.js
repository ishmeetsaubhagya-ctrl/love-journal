import { getMemories, saveMemory, updateMemory, deleteMemory } from '../services/supabaseClient.js';
import globalVariables from '../config/globalVariables.js';
import generatePalette from './generatePalette.js';

let memories = [];
let activeCategory = 'ALL';
let searchQuery = '';
let sortOption = 'date-desc';
let memoryToDeleteId = null;

const listContainer = document.getElementById('letter-list');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categoryPillsContainer = document.getElementById('category-pills');

// Modal Elements
const memoryModal = document.getElementById('memory-modal');
const memoryForm = document.getElementById('memory-form');
const modalTitle = document.getElementById('modal-title');
const openCreateModalBtn = document.getElementById('open-create-modal-btn');
const closeMemoryModalBtn = document.getElementById('close-memory-modal-btn');
const cancelMemoryBtn = document.getElementById('cancel-memory-btn');

const deleteModal = document.getElementById('delete-modal');
const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteMemoryTitleSpan = document.getElementById('delete-memory-title');

// Initialize App
async function initApp() {
  setupEventListeners();
  await loadAndRenderMemories();
  checkUrlForEdit();
}

// Check if URL has ?editId=...
function checkUrlForEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('editId');
  if (editId) {
    openEditModal(editId);
  }
}

// Load and Render Memories
async function loadAndRenderMemories() {
  if (!listContainer) return;
  memories = await getMemories();
  renderCategoryPills();
  renderMemories();
}

// Dynamically generate Category Pills from dataset
function renderCategoryPills() {
  if (!categoryPillsContainer) return;

  const categoriesSet = new Set();
  memories.forEach(m => {
    if (m.category && m.category.trim()) {
      categoriesSet.add(m.category.trim());
    }
  });

  const categoriesList = Array.from(categoriesSet);

  let html = `<button class="pill ${activeCategory === 'ALL' ? 'active' : ''}" data-category="ALL">✨ All Memories</button>`;
  
  categoriesList.forEach(cat => {
    const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
    html += `<button class="pill ${isActive ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
  });

  categoryPillsContainer.innerHTML = html;
}

function renderMemories() {
  if (!listContainer) return;

  listContainer.innerHTML = '';

  // 1. Filter by category & search query
  let filtered = memories.filter(item => {
    const matchesCategory = (activeCategory === 'ALL') || 
      (item.category && item.category.trim().toLowerCase() === activeCategory.trim().toLowerCase());
    
    const textToSearch = `${item.title || ''} ${item.story || ''} ${item.location || ''} ${item.mood || ''} ${item.category || ''} ${item.author || ''} ${item.date || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || textToSearch.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 2. Sort results
  filtered.sort((a, b) => {
    if (sortOption === 'date-desc') {
      return new Date(b.date || 0) - new Date(a.date || 0);
    } else if (sortOption === 'date-asc') {
      return new Date(a.date || 0) - new Date(b.date || 0);
    } else if (sortOption === 'title-asc') {
      return (a.title || '').localeCompare(b.title || '');
    } else if (sortOption === 'title-desc') {
      return (b.title || '').localeCompare(a.title || '');
    }
    return 0;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💌</div>
        <h3>No Memories Found</h3>
        <p>No moments match your current filter or search criteria.</p>
        <button class="btn-primary" id="empty-record-btn">+ Record A Moment</button>
      </div>
    `;
    const emptyBtn = document.getElementById('empty-record-btn');
    if (emptyBtn) emptyBtn.addEventListener('click', () => openCreateModal());
    return;
  }

  filtered.forEach((letter) => {
    const palette = generatePalette(letter);
    const envelopeBg = letter.envelopeColor || palette.envelope;
    const sealSymbol = '♡';

    const snippetText = letter.story
      ? (letter.story.length > 110 ? letter.story.substring(0, 110) + '...' : letter.story)
      : '';

    const card = document.createElement('div');
    card.className = 'envelope-card-wrapper';

    card.innerHTML = `
      <div class="envelope-actions">
        <button class="action-btn edit-btn" title="Edit Letter" data-id="${letter.id}">✏️ Edit</button>
        <button class="action-btn delete-btn" title="Delete Letter" data-id="${letter.id}">🗑️ Delete</button>
      </div>

      <a href="./src/views/letters.html?id=${letter.id}" class="envelope-link">
        <div class="envelope-wrap">
          <div class="envelope-shadow"></div>
          <div class="envelope" style="background:${envelopeBg}; --envelope-shadow:${palette.shadow};">
            <div class="env-body-svg">
              <svg viewBox="0 0 100 63" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,0 0,63 50,31" fill="${palette.shadow}" />
                <polygon points="100,0 100,63 50,31" fill="${palette.shadow}" />
                <polygon points="0,63 100,63 50,31" fill="${palette.base}" />
              </svg>
            </div>

            <div class="env-flap" style="border-top-color:${palette.flap};">
              <svg viewBox="0 0 100 44" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,0 100,0 50,44" fill="${palette.flap}" />
              </svg>
              <div class="env-seal" style="background:${palette.seal};">${sealSymbol}</div>
            </div>

            <div class="envelope-center">
              <div class="envelope-top-row">
                <span class="envelope-date" style="color:${palette.text};">${letter.date}</span>
                <div class="envelope-tags">
                  ${letter.category ? `<span class="badge category-badge">${letter.category}</span>` : ''}
                  ${letter.mood ? `<span class="badge mood-badge">✨ ${letter.mood}</span>` : ''}
                </div>
              </div>
              <h3 class="envelope-title" style="color:${palette.text};">${letter.title}</h3>
              ${snippetText ? `<p class="envelope-snippet" style="color:${palette.text};">"${snippetText}"</p>` : ''}
              
              <div class="envelope-meta-footer">
                ${letter.location ? `<span class="envelope-location">📍 ${letter.location}</span>` : ''}
                ${letter.driveUrl ? `<span class="envelope-drive-badge">🎬 Photos/Videos Attached</span>` : ''}
              </div>

              <span class="envelope-hint" style="color:${palette.text};">Tap to open letter ♡</span>
            </div>

            <div class="envelope-corner tl"></div>
            <div class="envelope-corner tr"></div>
            <div class="envelope-corner bl"></div>
            <div class="envelope-corner br"></div>
          </div>
        </div>
      </a>
    `;

    // Attach Event Listeners to Edit and Delete Buttons
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openEditModal(letter.id);
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openDeleteModal(letter.id, letter.title);
    });

    listContainer.appendChild(card);
  });
}

// Event Listeners setup
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderMemories();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortOption = e.target.value;
      renderMemories();
    });
  }

  if (categoryPillsContainer) {
    categoryPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill');
      if (btn) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category;
        renderMemories();
      }
    });
  }

  // Create Modal Actions
  if (openCreateModalBtn) {
    openCreateModalBtn.addEventListener('click', () => openCreateModal());
  }

  if (closeMemoryModalBtn) {
    closeMemoryModalBtn.addEventListener('click', () => closeMemoryModal());
  }

  if (cancelMemoryBtn) {
    cancelMemoryBtn.addEventListener('click', () => closeMemoryModal());
  }

  if (memoryForm) {
    memoryForm.addEventListener('submit', handleFormSubmit);
  }

  // Delete Modal Actions
  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
}

// Open Modal for New Entry
function openCreateModal() {
  memoryForm.reset();
  document.getElementById('memory-id').value = '';
  modalTitle.textContent = 'Record A New Moment';
  document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-mood').value = '';
  document.getElementById('form-category').value = '';
  memoryModal.classList.add('visible');
  memoryModal.setAttribute('aria-hidden', 'false');
}

// Open Modal for Editing Existing Entry
function openEditModal(id) {
  const item = memories.find(m => Number(m.id) === Number(id));
  if (!item) return;

  modalTitle.textContent = 'Edit Memory & Envelope';
  document.getElementById('memory-id').value = item.id;
  document.getElementById('form-title').value = item.title || '';
  document.getElementById('form-date').value = item.date || '';
  document.getElementById('form-location').value = item.location || '';
  document.getElementById('form-mood').value = item.mood || '';
  document.getElementById('form-category').value = item.category || '';
  document.getElementById('form-author').value = item.author || 'Saubhagya & Ishmeet';
  document.getElementById('form-drive').value = item.driveUrl || '';
  document.getElementById('form-story').value = item.story || '';

  const colorRadios = document.querySelectorAll('input[name="envelopeColor"]');
  colorRadios.forEach(radio => {
    if (radio.value === item.envelopeColor) {
      radio.checked = true;
    }
  });

  memoryModal.classList.add('visible');
  memoryModal.setAttribute('aria-hidden', 'false');
}

function closeMemoryModal() {
  memoryModal.classList.remove('visible');
  memoryModal.setAttribute('aria-hidden', 'true');
}

// Form Submit Handler (Save or Update)
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('memory-id').value;
  const colorRadio = document.querySelector('input[name="envelopeColor"]:checked');

  const formData = {
    title: document.getElementById('form-title').value.trim(),
    date: document.getElementById('form-date').value,
    location: document.getElementById('form-location').value.trim(),
    mood: document.getElementById('form-mood').value.trim(),
    category: document.getElementById('form-category').value.trim(),
    author: document.getElementById('form-author').value,
    sealSymbol: '♡',
    envelopeColor: colorRadio ? colorRadio.value : '#e8d5b0',
    driveUrl: document.getElementById('form-drive').value.trim(),
    story: document.getElementById('form-story').value.trim()
  };

  const saveBtn = document.getElementById('save-memory-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving Memory...';

  if (id) {
    memories = await updateMemory(id, formData);
  } else {
    memories = await saveMemory(formData);
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Memory ♡';
  closeMemoryModal();
  renderCategoryPills();
  renderMemories();
}

// Open Delete Modal
function openDeleteModal(id, title) {
  memoryToDeleteId = id;
  if (deleteMemoryTitleSpan) deleteMemoryTitleSpan.textContent = `"${title}"`;
  deleteModal.classList.add('visible');
  deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  memoryToDeleteId = null;
  deleteModal.classList.remove('visible');
  deleteModal.setAttribute('aria-hidden', 'true');
}

// Confirm Delete Handler
async function handleConfirmDelete() {
  if (!memoryToDeleteId) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  memories = await deleteMemory(memoryToDeleteId);

  confirmDeleteBtn.disabled = false;
  confirmDeleteBtn.textContent = 'Yes, Delete';
  closeDeleteModal();
  renderCategoryPills();
  renderMemories();
}

// Branding check
if (globalVariables.SHOW_BRANDING) {
  const footer = document.getElementById('footer-link');
  if (footer) footer.textContent = "Made with 💌 Moracarta";
}

initApp();