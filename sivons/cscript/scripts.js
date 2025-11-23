(() => {
  // Utility Helpers
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);

  const safeAddListener = (selector, event, handler) => {
    const el = qs(selector);
    if (el) el.addEventListener(event, handler);
  };

  const debounce = (fn, delay = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  // Soft alert box (non-blocking UI warning)
  const showProtectionAlert = (() => {
    let alertVisible = false;

    return function () {
      if (alertVisible) return;
      alertVisible = true;

      const box = document.createElement('div');
      box.className = 'protection-alert';
      box.textContent =
        'This content is protected. Screenshots are watermarked.';

      Object.assign(box.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        padding: '12px 20px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        zIndex: '99999',
        opacity: '0',
        transition: 'opacity .3s',
      });

      document.body.appendChild(box);
      requestAnimationFrame(() => (box.style.opacity = '1'));

      setTimeout(() => {
        box.style.opacity = '0';
        setTimeout(() => box.remove(), 500);
        alertVisible = false;
      }, 2000);
    };
  })();

  // Artwork Data
  const artworks = [
    {
      id: 1,
      title: 'S.I.V.O.N.S Logo Recreated',
      filename: '2.jpg',
      date: '2025-11-23',
      version: '1',
    },
    {
      id: 2,
      title: 'S.I.V.O.N.S Flyer Design',
      filename: '1.jpg',
      date: '2025-11-23',
      version: '1',
    },
    {
      id: 3,
      title: 'S.I.V.O.N.S Flyer Mockup',
      filename: '3.jpg',
      date: '2025-11-23',
      version: '1',
    },
  ];

  let currentArtworkIndex = 0;

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    loadArtworkThumbnails();
    loadCurrentArtwork();

    safeAddListener('#prevBtn', 'click', showPreviousArtwork);
    safeAddListener('#nextBtn', 'click', showNextArtwork);

    setupProtection();
    setupFooterEffects();
  });

  // -------------------------------
  // GALLERY FUNCTIONS
  // -------------------------------
  function loadArtworkThumbnails() {
    const list = qs('#artworkList');
    if (!list) return;

    list.innerHTML = '';
    artworks.forEach((art, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'artwork-thumb';

      thumb.addEventListener('click', () => {
        currentArtworkIndex = index;
        loadCurrentArtwork();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      thumb.innerHTML = `
        <div class="thumb-img">
          <img src="view/${art.filename}" alt="${art.title}" loading="lazy">
        </div>
        <div class="thumb-info">
          <div class="thumb-title">${art.title}</div>
          <div class="thumb-date">${formatDate(art.date)}</div>
        </div>
      `;

      list.appendChild(thumb);
    });
  }

  function loadCurrentArtwork() {
    const art = artworks[currentArtworkIndex];
    if (!art) return;

    const titleEl = qs('#currentArtworkTitle');
    const metaEl = qs('#currentArtworkMeta');
    const descEl = qs('#currentArtworkDescription');
    const container = qs('#imageContainer');

    if (titleEl) titleEl.textContent = art.title;
    if (metaEl)
      metaEl.textContent = `Created: ${formatDate(art.date)} | Version: ${
        art.version
      }`;
    if (descEl) descEl.textContent = art.description;

    if (!container) return;

    container
      .querySelectorAll('img.protected-image')
      .forEach((img) => img.remove());

    const img = document.createElement('img');
    img.className = 'protected-image';
    img.src = `view/${art.filename}`;
    img.alt = art.title;

    img.onerror = () => {
      img.src = 'fallback.png';
    };

    container.prepend(img);
    updateNavigationButtons();
  }

  function showPreviousArtwork() {
    if (currentArtworkIndex > 0) {
      currentArtworkIndex--;
      loadCurrentArtwork();
    }
  }

  function showNextArtwork() {
    if (currentArtworkIndex < artworks.length - 1) {
      currentArtworkIndex++;
      loadCurrentArtwork();
    }
  }

  function updateNavigationButtons() {
    const prev = qs('#prevBtn');
    const next = qs('#nextBtn');

    if (prev) prev.disabled = currentArtworkIndex === 0;
    if (next) next.disabled = currentArtworkIndex === artworks.length - 1;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // -------------------------------
  // ADVANCED PROTECTION SYSTEM
  // -------------------------------
  function setupProtection() {
    // STRICT Right-Click Block
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showProtectionAlert();
    });

    // PRINTSCREEN Key Blocking (Windows)
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        showProtectionAlert();
        try {
          await navigator.clipboard.writeText('');
        } catch {}
      }
    });

    // Screenshot Overlay Detection via Fast Visibility Change
    let lastHidden = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        lastHidden = Date.now();
      }
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastHidden < 300) {
          showProtectionAlert();
          blurImages();
        }
      }
    });

    // Screenshot Tools Stealing Focus
    window.addEventListener('blur', () => {
      showProtectionAlert();
      blurImages();
    });

    // Block dragging images
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG') e.preventDefault();
    });

    // Block copy / clipboard
    document.addEventListener('copy', async (e) => {
      e.preventDefault();
      showProtectionAlert();
      try {
        await navigator.clipboard.writeText('');
      } catch {}
    });

    document.addEventListener('cut', (e) => e.preventDefault());

    // DevTools & Screenshot Extension Detection
    let devtoolsFlag = false;
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devtoolsFlag) {
          devtoolsFlag = true;
          showProtectionAlert();
          blurImages();
        }
      } else {
        devtoolsFlag = false;
      }
    };
    setInterval(detectDevTools, 400);

    // Print Block
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Temporary Image Blur on Threat
    function blurImages() {
      const imgs = qsa('.protected-image');
      imgs.forEach((img) => {
        img.style.filter = 'blur(22px)';
        img.style.transition = 'filter .2s';
        setTimeout(() => (img.style.filter = ''), 1200);
      });
    }
  }

  // -------------------------------
  // Back To Top Button
  // -------------------------------
  const backToTopBtn = document.querySelector('.back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // -------------------------------
  // FOOTER EFFECTS
  // -------------------------------
  function setupFooterEffects() {
    const footer = qs('footer');
    if (!footer) return;

    const handleScroll = debounce(() => {
      const scrollY = window.scrollY;
      const winH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const footerH = footer.offsetHeight;

      footer.style.backgroundPositionY = `${scrollY * 0.3}px`;

      if (scrollY + winH > docH - footerH) {
        footer.classList.add('reveal');
      } else {
        footer.classList.remove('reveal');
      }
    }, 50);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          footer.classList.toggle('reveal', entry.isIntersecting)
        );
      },
      { threshold: 0.1 }
    );

    observer.observe(footer);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();
  }
})();
