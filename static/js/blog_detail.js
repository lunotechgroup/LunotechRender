// static/js/blog_detail.js

document.addEventListener('DOMContentLoaded', () => {
    const socialShareBar = document.getElementById('social-share-bar');
    const heroImage = document.getElementById('hero-image');
    const footer = document.getElementById('page-footer');
    const copyLinkBtn = document.getElementById('copy-link-btn');

    // --- 1. Copy to Clipboard Functionality ---
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy link: ', err);
            });
        });
    }

    // --- 2. Animate Social Bar on Scroll (Desktop Only) ---
    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');
    
    // State variables to track scroll position
    let isPastHero = false;
    let isBeforeFooter = true;

    // A single function to decide if the bar should be visible
    function updateVisibility() {
        if (isPastHero && isBeforeFooter) {
            socialShareBar.classList.add('visible');
        } else {
            socialShareBar.classList.remove('visible');
        }
    }

    function setupScrollAnimation(isDesktop) {
        if (!isDesktop || !socialShareBar) return;

        // If there is no hero image, we are automatically "past" it.
        if (!heroImage) {
            isPastHero = true;
            updateVisibility();
        }

        // Observer 1: Manages the `isPastHero` state
        if (heroImage) {
            const heroObserver = new IntersectionObserver((entries) => {
                const [entry] = entries;
                isPastHero = !entry.isIntersecting; // We are "past" when it's NOT intersecting
                updateVisibility();
            }, { rootMargin: '-100px 0px 0px 0px', threshold: 0 });
            heroObserver.observe(heroImage);
        }

        // Observer 2: Manages the `isBeforeFooter` state
        if (footer) {
            const footerObserver = new IntersectionObserver((entries) => {
                const [entry] = entries;
                isBeforeFooter = !entry.isIntersecting; // We are "before" when it's NOT intersecting
                updateVisibility();
            }, { rootMargin: '0px 0px -150px 0px', threshold: 0 });
            footerObserver.observe(footer);
        }
    }

    // Run the setup function on initial load
    setupScrollAnimation(desktopMediaQuery.matches);
});