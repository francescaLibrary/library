/**
 * Component Loader Module - Pagine e Parole
 * Loads reusable HTML components
 */

class ComponentLoader {
    constructor() {
        this.componentsPath = 'components/';
        this.loadedComponents = {};
    }

    /**
     * Load a component HTML file
     * @param {string} name - Component name (without .html)
     * @returns {Promise<string>}
     */
    async loadComponent(name) {
        if (this.loadedComponents[name]) {
            return this.loadedComponents[name];
        }

        try {
            const response = await fetch(`${this.componentsPath}${name}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${name}`);
            }
            const html = await response.text();
            this.loadedComponents[name] = html;
            return html;
        } catch (error) {
            console.error(`Error loading component ${name}:`, error);
            return '';
        }
    }

    /**
     * Insert component into element
     * @param {string} selector - CSS selector
     * @param {string} componentName - Component name
     * @param {Object} data - Data for template replacement
     */
    async insertComponent(selector, componentName, data = {}) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
            return;
        }

        let html = await this.loadComponent(componentName);
        
        // Replace template variables
        if (data) {
            Object.keys(data).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, data[key]);
            });
        }

        element.innerHTML = html;
    }

    /**
     * Load navbar with active state
     * @param {string} activePage - Current page name
     */
    async loadNavbar(activePage = '') {
        await this.insertComponent('#navbar', 'navbar');
        
        // Set active state
        if (activePage) {
            const links = document.querySelectorAll('.nav-link');
            links.forEach(link => {
                if (link.dataset.page === activePage) {
                    link.classList.add('active');
                }
            });
        }

        // Mobile menu toggle
        this.initMobileMenu();

        // Global search
        this.initSearch();
    }

    /**
     * Global site search with live results
     */
    initSearch() {
        const panel = document.getElementById('searchPanel');
        const input = document.getElementById('globalSearchInput');
        const results = document.getElementById('searchResults');
        const closeBtn = document.getElementById('searchClose');
        if (!panel || !input || !results) return;

        const esc = (s) => String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        const open = () => {
            panel.hidden = false;
            panel.setAttribute('aria-hidden', 'false');
            document.querySelectorAll('[data-search-open]').forEach(b => b.setAttribute('aria-expanded', 'true'));
            input.focus();
        };
        const close = (refocus = false) => {
            const trigger = document.querySelector('[data-search-open]');
            panel.hidden = true;
            panel.setAttribute('aria-hidden', 'true');
            document.querySelectorAll('[data-search-open]').forEach(b => b.setAttribute('aria-expanded', 'false'));
            input.value = '';
            results.innerHTML = '';
            if (refocus && trigger) trigger.focus();
        };

        document.querySelectorAll('[data-search-open]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                panel.hidden ? open() : close();
            });
        });
        if (closeBtn) closeBtn.addEventListener('click', () => close(true));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !panel.hidden) close(true);
            // Shortcut "/" per aprire la ricerca
            if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (!panel.hidden) { input.focus(); return; }
            e.preventDefault();
            open();
        });
        document.addEventListener('click', (e) => {
            if (!panel.hidden && !panel.contains(e.target) &&
                !e.target.closest('[data-search-open]')) {
                close();
            }
        });

        let timeout;
        input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                const q = input.value.trim();
                if (q.length < 2) {
                    results.innerHTML = '<p class="search-hint">Scrivi almeno 2 caratteri per cercare tra titoli, autori e recensioni.</p>';
                    return;
                }
                const books = await window.DataLoader.getBooks({ search: q, limit: 7 });
                if (!books.length) {
                    results.innerHTML = `<p class="search-empty">Nessun risultato per &ldquo;${esc(q)}&rdquo;.</p>
                        <a class="search-all" href="recensioni.html">Sfoglia tutte le recensioni &rarr;</a>`;
                    return;
                }
                results.innerHTML = books.map(b => `
                    <a class="search-hit" href="libro.html?id=${b.id}">
                        <span class="search-hit-title">${esc(b.title)}</span>
                        <span class="search-hit-author">di ${esc(b.author)}</span>
                    </a>`).join('') +
                    `<a class="search-all" href="recensioni.html?cerca=${encodeURIComponent(q)}">Vedi tutti i risultati &rarr;</a>`;
            }, 200);
        });
    }

    /**
     * Initialize mobile menu (drawer con chiusura Esc e focus trap leggero)
     */
    initMobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const links = document.querySelector('.nav-links');

        if (toggle && links) {
            const close = () => {
                links.classList.remove('active');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            };
            const open = () => {
                links.classList.add('active');
                toggle.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
                const first = links.querySelector('.nav-link');
                if (first) first.focus();
            };

            toggle.addEventListener('click', () => {
                links.classList.contains('active') ? close() : open();
            });

            // Chiudi con Esc
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && links.classList.contains('active')) {
                    close();
                    toggle.focus();
                }
                // Focus trap leggero dentro il drawer
                if (e.key === 'Tab' && links.classList.contains('active')) {
                    const focusables = links.querySelectorAll('a[href], button:not([disabled])');
                    if (!focusables.length) return;
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            });

            // Close menu when clicking a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', close);
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !links.contains(e.target)) {
                    close();
                }
            });
        }
    }

    /**
     * Load footer
     * @param {Object} data - Footer data
     */
    async loadFooter(data = {}) {
        const siteData = await window.DataLoader.load('site.json');
        const footerData = {
            siteName: siteData?.name || 'Pagine e Parole',
            year: new Date().getFullYear(),
            ...data
        };
        await this.insertComponent('#footer', 'footer', footerData);
    }

    /**
     * Load all standard components
     * @param {string} activePage - Current page name
     */
    async loadAllComponents(activePage = '') {
        await Promise.all([
            this.loadNavbar(activePage),
            this.loadFooter()
        ]);
    }
}

// Export singleton instance
window.ComponentLoader = new ComponentLoader();
