// Smooth scroll for navigation links (offset for fixed nav, except blocks which are full-viewport)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        if (target.classList && target.classList.contains('block')) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            const navH = 70;
            const y = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    });
});

// Side rail: dots jump to sections, arrow flows down (wraps to top at the end)
(function initRail() {
    const rail = document.querySelector('.rail');
    if (!rail) return;
    const order = ['#top', '#projects', '#about', '#contact'];
    const dots = Array.from(rail.querySelectorAll('.rail__dot'));
    const downBtn = rail.querySelector('.rail__down');

    function scrollToTarget(sel) {
        const target = document.querySelector(sel);
        if (!target) return;
        const navH = 70;
        const y = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => scrollToTarget(dot.dataset.target));
    });

    // Highlight the dot for the section currently in view
    const sections = order.map(sel => document.querySelector(sel)).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = '#' + entry.target.id;
            dots.forEach(d => d.classList.toggle('is-active', d.dataset.target === id));
        });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));

    // Down arrow: go to next section, wrap to top after contact
    downBtn.addEventListener('click', () => {
        const pos = window.scrollY + 80;
        let next = order[0];
        for (const sel of order) {
            const el = document.querySelector(sel);
            if (el && el.getBoundingClientRect().top + window.scrollY - 90 > pos) {
                next = sel;
                break;
            }
        }
        // If we're at/past the last section, wrap to top
        const last = document.querySelector(order[order.length - 1]);
        if (last && pos >= last.getBoundingClientRect().top + window.scrollY + last.offsetHeight - window.innerHeight - 40) {
            next = order[0];
        }
        scrollToTarget(next);
        downBtn.textContent = next === order[0] ? '↑' : '↓';
    });

    // Keep arrow glyph in sync while scrolling
    window.addEventListener('scroll', () => {
        const last = document.querySelector(order[order.length - 1]);
        if (!last) return;
        const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 60;
        downBtn.textContent = nearBottom ? '↑' : '↓';
        downBtn.setAttribute('aria-label', nearBottom ? 'Back to top' : 'Scroll to next section');
    }, { passive: true });
})();

// Navbar background on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.4)';
    } else {
        nav.style.boxShadow = 'none';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate compact about elements on scroll
document.querySelectorAll('.about__stat, .about__skills-strip .tag').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Projects carousel — glide with arrows, dots, counter, drag/swipe & keyboard
(function initCarousel() {
    const track = document.querySelector('.carousel__track');
    const viewport = document.querySelector('.carousel__viewport');
    if (!track || !viewport) return;

    const slides = Array.from(track.children);
    const prevBtn = document.querySelector('.carousel__arrow--prev');
    const nextBtn = document.querySelector('.carousel__arrow--next');
    const dotsWrap = document.querySelector('.carousel__dots');
    const nowEl = document.getElementById('carouselNow');
    const totalEl = document.getElementById('carouselTotal');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (totalEl) totalEl.textContent = slides.length;

    let index = 0;
    let perView = 3;

    function calcPerView() {
        const w = window.innerWidth;
        if (w <= 820) return 1;
        if (w <= 1150) return 2;
        return 3;
    }

    function maxIndex() {
        return Math.max(0, slides.length - perView);
    }

    // Build dots (one per page position)
    function buildDots() {
        dotsWrap.innerHTML = '';
        for (let i = 0; i <= maxIndex(); i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel__dot' + (i === index ? ' carousel__dot--active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.addEventListener('click', () => { goTo(i); restartAutoplay(); });
            dotsWrap.appendChild(dot);
        }
    }

    function slideOffset(i) {
        if (!slides.length) return 0;
        const slideW = slides[0].getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        return i * (slideW + gap);
    }

    function render() {
        perView = calcPerView();
        if (index > maxIndex()) index = maxIndex();
        buildDots();
        track.style.transform = 'translateX(' + (-slideOffset(index)) + 'px)';
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === maxIndex();
        if (nowEl) nowEl.textContent = Math.min(index + 1, slides.length);
    }

    function goTo(i) {
        index = Math.min(Math.max(0, i), maxIndex());
        const dots = dotsWrap.children;
        for (let d = 0; d < dots.length; d++) {
            dots[d].classList.toggle('carousel__dot--active', d === index);
        }
        track.style.transform = 'translateX(' + (-slideOffset(index)) + 'px)';
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === maxIndex();
        if (nowEl) nowEl.textContent = Math.min(index + 1, slides.length);
    }

    prevBtn.addEventListener('click', () => { goTo(index - 1); restartAutoplay(); });
    nextBtn.addEventListener('click', () => { goTo(index + 1); restartAutoplay(); });

    // Keyboard support
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { goTo(index - 1); restartAutoplay(); }
        if (e.key === 'ArrowRight') { goTo(index + 1); restartAutoplay(); }
    });

    // Pointer drag + touch swipe (mouse drag on desktop counts too)
    let startX = null;
    let dragging = false;
    viewport.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        dragging = true;
        try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
        stopAutoplay();
    });
    viewport.addEventListener('pointerup', (e) => {
        if (!dragging || startX === null) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
        startX = null;
        dragging = false;
        restartAutoplay();
    });
    viewport.addEventListener('pointercancel', () => {
        startX = null;
        dragging = false;
        restartAutoplay();
    });

    // Autoplay — advance every 5s, loop back to start, pause on hover/focus/touch/hidden tab
    let autoplayTimer = null;
    function startAutoplay() {
        stopAutoplay();
        if (reduceMotion) return;
        if (document.hidden) return;
        if (maxIndex() === 0) return;
        autoplayTimer = setInterval(() => {
            goTo(index >= maxIndex() ? 0 : index + 1);
        }, 5000);
    }
    function stopAutoplay() {
        if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }
    function restartAutoplay() {
        startAutoplay();
    }
    dotsWrap.addEventListener('click', restartAutoplay);

    const carousel = document.querySelector('.carousel');
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    viewport.addEventListener('focusin', stopAutoplay);
    viewport.addEventListener('focusout', startAutoplay);
    viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAutoplay();
        else startAutoplay();
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
    });
    render();
    startAutoplay();
})();
