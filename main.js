// ====== MENU + SCROLL BEHAVIOR (container-based) ======
const menu = document.getElementById('menu');
const toggle = document.getElementById('menuToggle');
const scroll = document.getElementById('scroll');
const intro = document.getElementById('intro');
const footer = document.getElementById('footer');

const whiteSections = document.querySelectorAll('.reviews-mobile-text, .contact-section');

function toggleMenuOpen() {
  if (!menu) return;
  menu.classList.toggle('open');
}

if (toggle) {
  toggle.addEventListener('click', toggleMenuOpen);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggleMenuOpen();
  });
}

// Smooth-scroll nav links inside the scroll container
if (scroll) {
  document.querySelectorAll('nav a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href) return;

      e.preventDefault();

      // Responsive routing for sections that only exist per breakpoint
      let id = href.slice(1);

      // Video: mobile uses #video, desktop uses #video1
      if (id === 'video') {
        id = window.matchMedia('(min-width: 769px)').matches ? 'video1' : 'video';
      }

      const target = document.getElementById(id);
      if (!target) return;

      scroll.scrollTo({
        top: target.offsetTop,
        behavior: 'smooth'
      });

      if (menu) menu.classList.remove('open');
    });
  });
}

if (scroll && menu && intro) {
  const updateMenu = () => {
    menu.classList.remove('open');
    menu.classList.toggle('visible', scroll.scrollTop >= intro.offsetTop - 10);

    const centerY = scroll.scrollTop + (scroll.clientHeight / 2);
    let invert = false;

    whiteSections.forEach((sec) => {
      if (sec.offsetParent === null) return;

      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (centerY >= top && centerY <= bottom) invert = true;
    });

    menu.classList.toggle('invert', invert);
  };

  scroll.addEventListener('scroll', updateMenu);
  updateMenu(); // IMPORTANT: sets state on load
}

// Footer visibility
const contact = document.getElementById('contact');
if (scroll && footer && contact) {
  const footerObserver = new IntersectionObserver(
    ([entry]) => {
      footer.classList.toggle('visible', entry.isIntersecting);
    },
    { root: scroll, threshold: 0.6 }
  );
  footerObserver.observe(contact);
}

// ====== PHOTO SLIDER ======
(() => {
  const section = document.getElementById('photo');
  if (!section) return;

  const layers = section.querySelectorAll('.photo-layer');
  const dotsWrap = section.querySelector('.photo-dots');
  if (!layers || layers.length < 3) return;

  const photos = [
    'photos/photo1.jpg',
    'photos/photo2.jpg',
    'photos/photo3.jpg',
    'photos/photo4.jpg',
    'photos/photo5.jpg',
    'photos/photo6.jpg',
    'photos/photo7.jpg',
    'photos/photo8.jpg',
    'photos/photo9.jpg',
    'photos/photo10.jpg',
    'photos/photo11.jpg',
    'photos/photo12.jpg'
  ];

  let index = Number(sessionStorage.getItem('photoIndex')) || 0;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let moved = false;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    photos.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === index ? ' active' : '');
      dotsWrap.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsWrap) return;
    dotsWrap.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  function createImg(i) {
    const img = document.createElement('img');
    img.src = photos[(i + photos.length) % photos.length];
    img.draggable = false;
    return img;
  }

  function render() {
    layers.forEach(l => (l.innerHTML = ''));
    layers[0].appendChild(createImg(index - 1));
    layers[1].appendChild(createImg(index));
    layers[2].appendChild(createImg(index + 1));
    sessionStorage.setItem('photoIndex', index);
    updateDots();
  }

  function move(dir) {
    index = (index + dir + photos.length) % photos.length;
    render();
  }

  section.addEventListener('click', () => {
    if (dragging || moved) return;
    move(1);
  });

  section.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    moved = false;
    section.setPointerCapture(e.pointerId);
  });

  section.addEventListener('pointermove', (e) => {
    if (!dragging || moved) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy) * 0.6 && Math.abs(dx) > 40) {
      move(dx < 0 ? 1 : -1);
      moved = true;
    }
  });

  section.addEventListener('pointerup', () => {
    dragging = false;
    moved = false;
  });

  section.addEventListener('pointercancel', () => {
    dragging = false;
    moved = false;
  });

  buildDots();
  render();
})();

// ====== VIDEO HELPERS (iOS-friendly) ======
function prepVideo(video) {
  if (!video) return;
  video.muted = true;
  video.controls = false;

  // iOS attributes, force-set
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  video.playsInline = true;
}

function safePlay(video) {
  if (!video) return;
  prepVideo(video);
  try {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (_) {}
}


// ====== MOBILE SNAP VIDEOS: PAUSE MANAGEMENT + RESET ON REAL ENTRY ======
(() => {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  if (!scroll) return;

  // Only observe snap sections that contain a video
  const sections = Array.from(document.querySelectorAll('section.snap')).filter(sec => {
    return !!sec.querySelector('video');
  });

  // Track whether a section has been "fully out" since last play,
  // so we only reset on real re-entry.
  const canReset = new WeakMap();
  sections.forEach(sec => canReset.set(sec, true));

  const pauseAllExcept = (current) => {
    document.querySelectorAll('section.snap video').forEach(v => {
      if (v !== current) {
        try { v.pause(); } catch (_) {}
      }
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const sec = entry.target;
        const video = sec.querySelector('video');
        if (!video) return;

        if (entry.isIntersecting) {
          pauseAllExcept(video);

          prepVideo(video);

          // Reset only if it was fully out before
          if (canReset.get(sec)) {
            try { video.currentTime = 0; } catch (_) {}
            canReset.set(sec, false);
          }

          safePlay(video);
        } else {
          // Mark as resettable only when mostly out of view
          if (entry.intersectionRatio < 0.1) {
            canReset.set(sec, true);
          }
          try { video.pause(); } catch (_) {}
        }
      });
    },
    { root: scroll, threshold: 0.65 }
  );

  sections.forEach(sec => io.observe(sec));
})();
