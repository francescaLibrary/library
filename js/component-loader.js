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
    }

    /**
     * Initialize mobile menu
     */
    initMobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const links = document.querySelector('.nav-links');

        if (toggle && links) {
            toggle.addEventListener('click', () => {
                const isOpen = links.classList.toggle('active');
                // Animate hamburger → X
                toggle.classList.toggle('open', isOpen);
                // Accessibility
                toggle.setAttribute('aria-expanded', isOpen);
            });

            // Close menu when clicking a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    links.classList.remove('active');
                    toggle.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !links.contains(e.target)) {
                    links.classList.remove('active');
                    toggle.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
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
            email: siteData?.social?.email?.address || '',
            instagram: siteData?.social?.instagram?.url || '',
            goodreads: siteData?.social?.goodreads?.url || '',
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
