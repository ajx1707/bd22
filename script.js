'use strict';
/* ============================================================
   BIRTHDAY DIARY — script.js
   Stage orchestration & flip-book navigation
   ============================================================ */

const TOTAL_PAGES = 5;
let currentPage   = -1; // -1=closed, 0=cover open, 1-5=pages flipped

/* ── Element refs ── */
const shelfScene  = document.getElementById('bookshelf-scene');
const fallingBook = document.getElementById('falling-book');
const promptEl    = document.getElementById('prompt-overlay');
const openBtn     = document.getElementById('open-btn');
const fbScene     = document.getElementById('flipbook-scene');
const coverEl     = document.getElementById('cover-clickable');
const prevBtn     = document.getElementById('prev-btn');
const nextBtn     = document.getElementById('next-btn');
const bookNav     = document.getElementById('book-nav');
const dots        = document.querySelectorAll('.dot');

/* ============================================================
   STAGE 1 — BOOKSHELF: after 2 s, book falls
   ============================================================ */
window.addEventListener('load', () => {
    setTimeout(triggerFall, 1000);  /* 1s to glance at shelf, then fall starts */
});

/* saved book landing coords so showPrompt can position itself */
let _bookLandedLeft = 0, _bookLandedTop = 0, _bookW = 0, _bookH = 0;

function triggerFall() {
    const rect = fallingBook.getBoundingClientRect();

    /* detach from shelf flow at exact current position */
    Object.assign(fallingBook.style, {
        position: 'fixed',
        top:      rect.top    + 'px',
        left:     rect.left   + 'px',
        width:    rect.width  + 'px',
        height:   rect.height + 'px',
        margin:   '0',
        zIndex:   '500',
        animation: 'none'
    });

    /* dust burst from the empty shelf slot */
    emitDust(rect.left + rect.width / 2, rect.top, 10, true);

    const tTop  = window.innerHeight - rect.height - 88;  /* near the floor */
    const tLeft = (window.innerWidth  / 2) - (rect.width  / 2);  /* centred horizontally */
    _bookLandedLeft = tLeft;
    _bookLandedTop  = tTop;
    _bookW = rect.width;
    _bookH = rect.height;

    /* two-frame trick so the browser registers the start position */
    requestAnimationFrame(() => requestAnimationFrame(() => {
        Object.assign(fallingBook.style, {
            transition: [
                'top 2s cubic-bezier(0.55, 0, 1, 0.45)',   /* 2-second fall */
                'left 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
                'transform 2s ease',
                'box-shadow 1s ease'
            ].join(', '),
            top:       (tTop + 30) + 'px',
            left:       tLeft + 'px',
            transform: 'rotate(-8deg)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 55px rgba(212,175,55,0.4)'
        });
    }));

    /* bounce up — after 2s fall */
    setTimeout(() => {
        Object.assign(fallingBook.style, {
            transition: 'top 0.3s ease-out, transform 0.3s ease',
            top:        (tTop - 12) + 'px',
            transform:  'rotate(-5deg)'
        });
    }, 2050);

    /* settle + landing dust — 2.4s from start */
    setTimeout(() => {
        Object.assign(fallingBook.style, {
            transition: 'top 0.25s ease-in, transform 0.25s ease',
            top:        tTop + 'px',
            transform:  'rotate(-6deg)'
        });
        emitDust(tLeft + _bookW / 2, tTop + _bookH - 10, 14, false);
    }, 2400);

    /* show prompt 2s after settling = 4.4s from triggerFall */
    setTimeout(showPrompt, 4400);
}

/* ── Dust particle burst ── */
function emitDust(cx, cy, count, goUp) {
    for (let i = 0; i < count; i++) {
        const d = document.createElement('div');
        const size  = Math.random() * 5 + 2;          /* fine dust */
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * 80 + 20;
        const dx    = Math.cos(angle) * dist;
        const dy    = goUp
            ? -(Math.random() * 55 + 15)              /* shelf dust goes up */
            : -(Math.random() * 40 + 10);             /* landing dust also rises */
        const delay = Math.random() * 250;
        const dur   = Math.random() * 800 + 800;
        /* warm brownish dust colour, varying opacity */
        const r = Math.floor(180 + Math.random() * 40);
        const g = Math.floor(130 + Math.random() * 40);
        const b = Math.floor(60  + Math.random() * 40);
        const a = (Math.random() * 0.45 + 0.25).toFixed(2);

        d.className = 'dust-puff';
        Object.assign(d.style, {
            width:  size + 'px',
            height: size + 'px',
            left:   cx   + 'px',
            top:    cy   + 'px',
            '--dx': dx   + 'px',
            '--dy': dy   + 'px',
            background: `rgba(${r},${g},${b},${a})`,
            animationDelay:    delay + 'ms',
            animationDuration: dur   + 'ms'
        });
        document.body.appendChild(d);
        setTimeout(() => d.remove(), delay + dur + 50);
    }
}

function showPrompt() {
    /* float the cloud ABOVE the fallen book, horizontally centred on it */
    const cloudW   = 186;
    const cloudH   = 150;  /* approx height of the cloud box */
    const popLeft  = _bookLandedLeft + (_bookW / 2) - (cloudW / 2);
    const popTop   = _bookLandedTop  - cloudH - 55;  /* above the book */

    Object.assign(promptEl.style, {
        left: Math.max(10, popLeft) + 'px',
        top:  Math.max(10, popTop)  + 'px'
    });

    promptEl.classList.add('visible');
}

/* ============================================================
   STAGE 2 — OPEN: transition to flip book
   ============================================================ */
openBtn.addEventListener('click', openDiary);

function openDiary() {
    /* fade out shelf */
    shelfScene.classList.add('blurring');

    /* fade out falling book */
    Object.assign(fallingBook.style, {
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        opacity:    '0',
        transform:  'rotate(-6deg) scale(0.82) translateY(-25px)'
    });

    /* fade out prompt */
    Object.assign(promptEl.style, {
        transition: 'opacity 0.5s ease',
        opacity:    '0'
    });

    setTimeout(() => {
        shelfScene.style.display  = 'none';
        fallingBook.style.display = 'none';
        promptEl.style.display    = 'none';

        /* reveal flip book */
        fbScene.classList.remove('hidden');
        requestAnimationFrame(() => fbScene.classList.add('visible'));
    }, 900);
}

/* ============================================================
   STAGE 3 — FLIP BOOK navigation
   ============================================================ */

/* cover click opens the book */
coverEl.addEventListener('click', () => {
    if (currentPage === -1) goToPage(0);
});

coverEl.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && currentPage === -1) {
        e.preventDefault();
        goToPage(0);
    }
});

prevBtn.addEventListener('click', () => {
    if (currentPage > -1) goToPage(currentPage - 1);
});

nextBtn.addEventListener('click', () => {
    if (currentPage < TOTAL_PAGES) goToPage(currentPage + 1);
});

/* clicking dots navigates directly */
dots.forEach(dot => {
    dot.addEventListener('click', () => goToPage(parseInt(dot.dataset.pg)));
});

function goToPage(pg) {
    currentPage = pg;

    /* update checkboxes — CSS handles the visual flip animation */
    document.getElementById('cover_checkbox').checked = currentPage >= 0;
    for (let i = 1; i <= TOTAL_PAGES; i++) {
        document.getElementById(`page${i}_checkbox`).checked = currentPage >= i;
    }

    /* shift the nav to follow the book when it opens */
    bookNav.style.transform  = currentPage >= 0 ? 'translateX(210px)' : 'translateX(0)';
    bookNav.style.transition = 'transform 1s ease';

    updateUI();
}

function updateUI() {
    /* dots */
    dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.pg) === currentPage));

    /* buttons */
    prevBtn.disabled = currentPage <= -1;
    nextBtn.disabled = currentPage >= TOTAL_PAGES;
}

/* ============================================================
   RESPONSIVE HINT
   ============================================================ */
function checkResponsive() {
    if (window.innerWidth < 680 && !document.getElementById('resp-note')) {
        const note = document.createElement('p');
        note.id = 'resp-note';
        Object.assign(note.style, {
            position:   'fixed',
            bottom:     '12px',
            left:       '50%',
            transform:  'translateX(-50%)',
            fontSize:   '0.72rem',
            color:      'rgba(212,175,55,0.55)',
            fontFamily: 'Caveat, cursive',
            zIndex:     '9999',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
        });
        note.textContent = 'Best viewed on a wider screen 🌸';
        document.body.appendChild(note);
    }
}

checkResponsive();
window.addEventListener('resize', checkResponsive);