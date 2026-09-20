import { getLoadedLetters } from '../loaders/lettersLoader.js';
import { deleteMemory } from '../services/supabaseClient.js';
import generatePalette from './generatePalette.js';

const params = new URLSearchParams(window.location.search);
const requestedId = parseInt(params.get('id'), 10);
const letters = getLoadedLetters();
const letter = letters.find((entry) => Number(entry.id) === requestedId);

const topActions = document.getElementById('letter-top-actions');
const detailEditBtn = document.getElementById('detail-edit-btn');
const detailDeleteBtn = document.getElementById('detail-delete-btn');
const deleteModal = document.getElementById('detail-delete-modal');
const closeDeleteModalBtn = document.getElementById('close-detail-delete-modal-btn');
const cancelDeleteBtn = document.getElementById('cancel-detail-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-detail-delete-btn');

function applyEnvelopePalette(letterItem) {
  const palette = generatePalette(letterItem);
  const envelopeBg = letterItem.envelopeColor || palette.envelope;

  document.querySelector('.env-background').style.background = envelopeBg;

  const flapPolygon = document.querySelector('.env-flap svg polygon');
  if (flapPolygon) {
    flapPolygon.setAttribute('fill', palette.flap);
  }

  const sidePolygons = document.querySelectorAll('.env-body-svg svg polygon');
  if (sidePolygons.length === 3) {
    sidePolygons[0].setAttribute('fill', palette.shadow);
    sidePolygons[1].setAttribute('fill', palette.shadow);
    sidePolygons[2].setAttribute('fill', palette.base);
  }

  const sealEl = document.getElementById('detail-seal-heart');
  if (sealEl && letterItem.sealSymbol) {
    sealEl.textContent = letterItem.sealSymbol;
  }
}

if (!letter) {
  document.getElementById('error-message').style.display = 'block';
  document.getElementById('envelope-wrap').style.display = 'none';
  document.getElementById('letter-wrap').style.display = 'none';
  document.getElementById('letter-nav').style.display = 'none';
} else {
  document.title = `${letter.title} — Saubhagya & Ishmeet`;

  document.getElementById('letter-date').textContent = letter.date;
  document.getElementById('letter-title').textContent = letter.title;
  
  if (letter.mood) {
    document.getElementById('letter-mood').textContent = `✨ ${letter.mood}`;
  }

  if (letter.location) {
    document.getElementById('letter-location').textContent = `📍 ${letter.location}`;
  }

  if (letter.author) {
    document.getElementById('letter-author').textContent = `Written with love by ${letter.author} ♡`;
  } else {
    document.getElementById('letter-author').textContent = `Saubhagya & Ishmeet ♡`;
  }

  // Story text formatting
  document.getElementById('letter-body').innerHTML = letter.story
      .split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim())
      .map(paragraph => `<p>${paragraph.trimEnd()}</p>`)
      .join('');

  // Google Drive & Media Attachment Handling
  if (letter.driveUrl) {
    const driveSection = document.getElementById('drive-attachment-section');
    const driveLinkBtn = document.getElementById('drive-link-btn');
    const drivePreviewContainer = document.getElementById('drive-preview-container');

    if (driveSection && driveLinkBtn && drivePreviewContainer) {
      driveSection.style.display = 'block';
      driveLinkBtn.href = letter.driveUrl;
      renderMediaPreview(letter.driveUrl, drivePreviewContainer);
    }
  }

function renderMediaPreview(url, container) {
  if (!url || !container) return;
  const cleanUrl = url.trim();

  // 1. Google Drive File Link: /file/d/FILE_ID/ or id=FILE_ID
  const fileIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  
  // 2. Google Drive Folder Link: /folders/FOLDER_ID
  const folderIdMatch = cleanUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);

  // 3. Dropbox Link
  const isDropbox = cleanUrl.includes('dropbox.com');

  // 4. Direct Image Extension
  const isDirectImage = /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(cleanUrl);

  // 5. Direct Video Extension
  const isDirectVideo = /\.(mp4|webm|mov|m4v)($|\?)/i.test(cleanUrl);

  // 6. YouTube Link
  const youtubeMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);

  // 7. Vimeo Link
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);

  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    const directImgUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const drivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    const uniqueId = `gdrive_${fileId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    container.innerHTML = `
      <div class="media-preview-box">
        <div class="media-image-wrapper" id="img_wrap_${uniqueId}">
          <img src="${directImgUrl}" 
               alt="Attached Memory Photo" 
               class="drive-media-img" 
               loading="lazy" 
               onerror="this.onerror=null; var w=document.getElementById('img_wrap_${uniqueId}'); if(w) w.style.display='none'; var f=document.getElementById('iframe_wrap_${uniqueId}'); if(f) f.style.display='block';" />
        </div>
        <div class="media-frame-wrapper" id="iframe_wrap_${uniqueId}" style="display:none;">
          <iframe src="${drivePreviewUrl}" 
                  class="drive-iframe-preview" 
                  allow="autoplay; encrypted-media; picture-in-picture" 
                  allowfullscreen 
                  title="Google Drive Media Preview"></iframe>
        </div>
      </div>
    `;
  } else if (folderIdMatch) {
    const folderId = folderIdMatch[1];
    container.innerHTML = `
      <div class="media-frame-wrapper">
        <iframe src="https://drive.google.com/embeddedfolderview?id=${folderId}#grid" 
                class="drive-iframe-preview" 
                title="Google Drive Folder Preview"></iframe>
      </div>
    `;
  } else if (isDropbox) {
    const directDropboxUrl = cleanUrl.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    if (isDirectVideo) {
      container.innerHTML = `
        <div class="media-video-wrapper">
          <video src="${directDropboxUrl}" controls class="drive-media-video"></video>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="media-image-wrapper">
          <img src="${directDropboxUrl}" alt="Attached Photo" class="drive-media-img" loading="lazy" />
        </div>
      `;
    }
  } else if (isDirectImage) {
    container.innerHTML = `
      <div class="media-image-wrapper">
        <img src="${cleanUrl}" alt="Attached Memory Photo" class="drive-media-img" loading="lazy" />
      </div>
    `;
  } else if (isDirectVideo) {
    container.innerHTML = `
      <div class="media-video-wrapper">
        <video src="${cleanUrl}" controls class="drive-media-video"></video>
      </div>
    `;
  } else if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    container.innerHTML = `
      <div class="media-frame-wrapper">
        <iframe src="https://www.youtube.com/embed/${videoId}" 
                class="drive-iframe-preview" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen 
                title="YouTube Video Preview"></iframe>
      </div>
    `;
  } else if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    container.innerHTML = `
      <div class="media-frame-wrapper">
        <iframe src="https://player.vimeo.com/video/${videoId}" 
                class="drive-iframe-preview" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen 
                title="Vimeo Video Preview"></iframe>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="media-frame-wrapper">
        <iframe src="${cleanUrl}" 
                class="drive-iframe-preview" 
                title="Attached Media Preview"></iframe>
      </div>
    `;
  }
}

  if (topActions) topActions.style.display = 'flex';

  applyEnvelopePalette(letter);
  document.querySelector('.envelope-stage').classList.add('ready');

  const sortedLetters = letters.slice().sort((first, second) => first.id - second.id);
  const currentIndex = sortedLetters.findIndex((entry) => Number(entry.id) === requestedId);
  const previousLetter = currentIndex > 0 ? sortedLetters[currentIndex - 1] : null;
  const nextLetter = currentIndex < sortedLetters.length - 1 ? sortedLetters[currentIndex + 1] : null;

  document.getElementById('letter-counter').textContent = `${currentIndex + 1} Of ${sortedLetters.length}`;

  if (previousLetter) {
    const previousButton = document.getElementById('nav-previous');
    previousButton.href = `./letters.html?id=${previousLetter.id}`;
    previousButton.classList.remove('invisible');
  }

  if (nextLetter) {
    const nextButton = document.getElementById('nav-next');
    nextButton.href = `./letters.html?id=${nextLetter.id}`;
    nextButton.classList.remove('invisible');
  }

  startHeartAnimation();

  // Animate the envelope opening
  window.setTimeout(() => {
    document.getElementById('flap').classList.add('open');
    document.getElementById('seal').classList.add('fading');
  }, 400);

  window.setTimeout(() => {
    document.getElementById('flap').classList.add('behind');
  }, 1050);

  window.setTimeout(() => {
    document.getElementById('paper').classList.add('leaving');
  }, 900);

  window.setTimeout(() => {
    document.getElementById('letter-wrap').classList.add('visible');
    document.getElementById('letter-nav').classList.add('visible');
    document.getElementById('envelope-wrap').style.display = 'none';
  }, 2100);

  // Edit action
  if (detailEditBtn) {
    detailEditBtn.addEventListener('click', () => {
      window.location.href = `../../index.html?editId=${letter.id}`;
    });
  }

  // Delete action
  if (detailDeleteBtn) {
    detailDeleteBtn.addEventListener('click', () => {
      deleteModal.classList.add('visible');
      deleteModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDeleteDetail);
}

function closeDeleteModal() {
  deleteModal.classList.remove('visible');
  deleteModal.setAttribute('aria-hidden', 'true');
}

async function handleConfirmDeleteDetail() {
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';
  await deleteMemory(requestedId);
  window.location.href = '../../index.html';
}

function startHeartAnimation() {
  const canvas = document.getElementById('canvas-hearts');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const devicePixelRatio = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.scale(devicePixelRatio, devicePixelRatio);

  const width = window.innerWidth;
  const height = window.innerHeight;
  const colors = ['#c0392b', '#e74c3c', '#e91e63', '#ff4081', '#ad1457', '#f06292', '#ff6b6b', '#d63031', '#ff8a80'];

  function drawHeart(radius) {
    context.beginPath();
    context.moveTo(0, -radius * 0.3);
    context.bezierCurveTo(radius, -radius * 1.1, radius * 1.5, radius * 0.4, 0, radius);
    context.bezierCurveTo(-radius * 1.5, radius * 0.4, -radius, -radius * 1.1, 0, -radius * 0.3);
    context.closePath();
  }

  const totalParticles = 55;
  const particles = [];

  for (let index = 0; index < totalParticles; index += 1) {
    const angle = (Math.random() - 0.5) * (Math.PI / 1.5);
    const velocity = 1.2 + Math.random() * 2.2;
    const radius = 8 + Math.random() * 18;

    particles.push({
      x: width * 0.05 + Math.random() * width * 0.9,
      y: height + radius * 2,
      velocityX: Math.sin(angle) * velocity,
      velocityY: -Math.cos(angle) * velocity,
      radius,
      rotation: (Math.random() - 0.5) * 0.06,
      currentAngle: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0,
      delay: Math.random() * 2500,
      born: false,
      dead: false
    });
  }

  let startTime = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;
    context.clearRect(0, 0, width, height);

    let allDead = true;

    particles.forEach((particle) => {
      if (elapsed < particle.delay) {
        allDead = false;
        return;
      }

      if (!particle.born) particle.born = true;
      if (particle.dead) return;

      allDead = false;
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY -= 0.012;
      particle.velocityX *= 0.998;
      particle.currentAngle += particle.rotation;

      const fraction = 1 - (particle.y / height);
      if (fraction < 0.08) {
        particle.alpha = fraction / 0.08;
      } else if (fraction > 0.55) {
        particle.alpha = Math.max(0, 1 - (fraction - 0.55) / 0.45);
      } else {
        particle.alpha = 1;
      }

      if (particle.y < -particle.radius * 3) {
        particle.dead = true;
        return;
      }

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.currentAngle);
      context.globalAlpha = particle.alpha;
      context.shadowColor = particle.color;
      context.shadowBlur = 6;
      context.fillStyle = particle.color;
      drawHeart(particle.radius);
      context.fill();
      context.restore();
    });

    if (!allDead) {
      window.requestAnimationFrame(animate);
    } else {
      context.clearRect(0, 0, width, height);
    }
  }
  window.requestAnimationFrame(animate);
}