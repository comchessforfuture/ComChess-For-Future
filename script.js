/* =========================================================
   script.js — ComChess For Future
   - Drawer/hamburger (nếu có)
   - Đánh dấu nút menu hiện tại (optional)
   - Dropdown "Our Program" (optional)
   - Center Carousel #topNews:
     * Vuốt/bấm luôn auto-snap vào giữa
     * CHỈ item ở giữa nhấp nháy
     * Item ở giữa KHÔNG bo góc
   ========================================================= */

(() => {
  'use strict';

  /* =============== HAMBURGER / DRAWER (tùy trang) =============== */
  const hamburger = document.querySelector('.hamburger');
  const navList   = document.querySelector('.nav ul');
  if (hamburger && navList) {
    const toggleMenu = (e) => {
      e?.stopPropagation();
      const open = navList.classList.toggle('open');
      document.body.classList.toggle('nav-open', open);
    };

    // Reset listeners nếu file được load nhiều lần
    const b = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(b, hamburger);
    b.addEventListener('click', toggleMenu);

    // Click ngoài để đóng
    document.addEventListener('click', (e) => {
      if (!navList.classList.contains('open')) return;
      if (e.target.closest('.nav')) return;
      navList.classList.remove('open');
      document.body.classList.remove('nav-open');
    });

    // ESC để đóng
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        navList.classList.remove('open');
        document.body.classList.remove('nav-open');
      }
    });
  }

  /* =============== HIGHLIGHT MENU HIỆN TẠI (optional) =============== */
  try {
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.menu').forEach(btn => {
      const href = btn.getAttribute('onclick')?.match(/'(.*)'/)?.[1] || '';
      if (href === here) btn.classList.add('active');
    });
  } catch (_) { /* ignore */ }

  /* =============== DROPDOWN "OUR PROGRAM" (optional) =============== */
  (function(){
    const programBtn = document.querySelector('#programBtn');
    const dropdown   = document.querySelector('.dropdown');
    if (!(programBtn && dropdown)) return;

    programBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dropdown.classList.remove('open');
    });
  })();

  /* =============== CENTER CAROUSEL (#topNews) =============== */
  (function initTopNewsCarousel(){
    const host = document.querySelector('#topNews');
    if (!host || host.dataset.ccInited === '1') return;
    host.dataset.ccInited = '1';

    // 1) Tiêm CSS: chỉ item ở giữa nhấp nháy + KHÔNG bo góc
    const STYLE_ID = 'cc-style-topnews';
    if (!document.getElementById(STYLE_ID)) {
      const css = `
#topNews .cc-track{ scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch }
#topNews .cc-item{ scroll-snap-align:center; transform:scale(.88); opacity:.8; transition:transform .3s ease, opacity .3s ease }
#topNews .cc-item.active{ transform:scale(1.15); opacity:1; z-index:2 }
/* Ảnh mặc định có bo nhẹ... */
#topNews .cc-item img{ width:100%; display:block; border-radius:14px; box-shadow:0 8px 28px rgba(11,18,32,.14) }
/* ...nhưng ảnh ĐƯỢC CHỌN (ở giữa) KHÔNG bo góc */
#topNews .cc-item.active img{ border-radius:0 }
#topNews .cc-item.side{ animation:none } /* tắt nhấp nháy hai bên nếu CSS cũ còn */
@keyframes centerBlink{
  from{ filter:brightness(1); box-shadow:0 8px 28px rgba(11,18,32,.14) }
  to  { filter:brightness(1.06); box-shadow:0 8px 28px rgba(11,18,32,.18), 0 0 18px rgba(255,255,255,.6) }
}
#topNews .cc-item.active img{ animation:centerBlink 1.4s ease-in-out infinite alternate }
@media (prefers-reduced-motion:reduce){
  #topNews .cc-item, #topNews .cc-track{ transition:none }
  #topNews .cc-item.active img{ animation:none }
}
      `.trim();
      const styleTag = document.createElement('style');
      styleTag.id = STYLE_ID;
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
    }

    // 2) Chuẩn hóa DOM (#topNews có thể đã có .cc-track/.cc-item)
    let track = host.querySelector('.cc-track');

    const buildFromImages = () => {
      const rawImgs = [...host.querySelectorAll(':scope > img, :scope > .carousel-item img, :scope > img.d-block')];
      if (!rawImgs.length) return false;
      host.innerHTML = `
        <div class="cc-track" style="display:flex;gap:clamp(10px,2.4vw,20px);padding:8px clamp(5vw,8vw,12vw);overflow-x:auto;scrollbar-width:none"></div>
        <button class="cc-prev" aria-label="Previous">&#10094;</button>
        <button class="cc-next" aria-label="Next">&#10095;</button>
      `;
      track = host.querySelector('.cc-track');
      track.style.msOverflowStyle = 'none';
      track.style.scrollbarWidth = 'none';
      track.addEventListener('wheel', () => {}, { passive:true }); // nudge for iOS

      rawImgs.forEach(img => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || '';
        const item = document.createElement('div');
        item.className = 'cc-item';
        item.style.flex = '0 0 clamp(60%,64vw,70%)';
        item.innerHTML = `<img src="${src}" alt="${alt}">`;
        track.appendChild(item);
      });
      return true;
    };

    if (!track) {
      buildFromImages();
      track = host.querySelector('.cc-track');
    }
    if (!host.querySelector('.cc-prev')) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'cc-prev';
      prevBtn.setAttribute('aria-label','Previous');
      prevBtn.innerHTML = '&#10094;';
      host.appendChild(prevBtn);
    }
    if (!host.querySelector('.cc-next')) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'cc-next';
      nextBtn.setAttribute('aria-label','Next');
      nextBtn.innerHTML = '&#10095;';
      host.appendChild(nextBtn);
    }

    if (!track) return;
    const items = [...track.querySelectorAll('.cc-item')];
    if (!items.length) return;

    // 3) Tính index gần giữa nhất của viewport track
    const centerIndex = () => {
      const centerX = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      items.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        const elCenter = (rect.left - trackRect.left) + rect.width/2 + track.scrollLeft;
        const dist = Math.abs(elCenter - centerX);
        if (dist < bestDist) { bestDist = dist; best = idx; }
      });
      return best;
    };

    // 4) Active state
    let activeIdx = -1;
    const setActive = (i) => {
      if (i === activeIdx) return;
      items.forEach(el => el.classList.remove('active'));
      items[i]?.classList.add('active');
      activeIdx = i;
    };

    const scrollToIndex = (i, smooth = true) => {
      if (!items[i]) return;
      items[i].scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        inline: 'center',
        block: 'nearest'
      });
    };

    // 6) Auto-snap: sau khi dừng vuốt một nhịp -> chốt đúng giữa
    let ticking = false;
    let stopTimer;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setActive(centerIndex());
          ticking = false;
        });
      }
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        const i = centerIndex();
        setActive(i);
        scrollToIndex(i, true); // CHỐT giữa luôn
      }, 120);
    };
    track.addEventListener('scroll', onScroll, { passive: true });

    // 'scrollend' (nếu trình duyệt hỗ trợ) -> snap lần nữa cho chắc
    if ('onscrollend' in window) {
      track.addEventListener('scrollend', () => {
        const i = centerIndex();
        setActive(i);
        scrollToIndex(i, true);
      });
    }

    // 7) Click ảnh => vào giữa ngay
    items.forEach((el, idx) => {
      el.addEventListener('click', () => {
        setActive(idx);
        scrollToIndex(idx, true);
      });
    });

    // 8) Nút prev/next (PC)
    const btnPrev = host.querySelector('.cc-prev');
    const btnNext = host.querySelector('.cc-next');
    const current = () => (activeIdx >= 0 ? activeIdx : centerIndex());

    btnNext?.addEventListener('click', () => {
      const i = (current() + 1) % items.length;
      setActive(i);
      scrollToIndex(i, true);
    });
    btnPrev?.addEventListener('click', () => {
      const i = (current() - 1 + items.length) % items.length;
      setActive(i);
      scrollToIndex(i, true);
    });

    // 9) Khởi tạo + khi resize
    const initActive = () => {
      const i = centerIndex();
      setActive(i);
      //scrollToIndex(i, false);
    };
    window.addEventListener('resize', () => setTimeout(initActive, 50));
    initActive();
  })();

})();