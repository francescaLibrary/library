/**
 * App Module - Pagine e Parole
 * Main application controller
 */

class App {
    constructor() {
        this.dataLoader = window.DataLoader;
        this.renderer = window.TemplateRenderer;
        this.componentLoader = window.ComponentLoader;
    }

    /**
     * Initialize page based on data-page attribute
     */
    async init() {
        const page = document.body.dataset.page;
        
        // Load common components
        await this.componentLoader.loadAllComponents(page);

        // Sub-masthead title per pagina (stile LRB blog)
        const subMast = document.getElementById('subMastTitle');
        if (subMast) {
            const titles = { home: 'Pagine e Parole blog', recensioni: 'Recensioni', libro: 'Recensioni', libreria: 'Libreria' };
            subMast.textContent = titles[page] || 'Pagine e Parole blog';
        }

        // Initialize page-specific content
        switch (page) {
            case 'home':
                await this.initHomePage();
                break;
            case 'recensioni':
                await this.initRecensioniPage();
                break;
            case 'libreria':
                await this.initLibreriaPage();
                break;
            case 'chi-sono':
                await this.initChiSonoPage();
                break;
            case 'libro':
                await this.initLibroPage();
                break;
        }
    }

    /**
     * Initialize home page
     */
    async initHomePage() {
        const [site, genres, stats, latestBooks, favoriteBooks, allBooks] = await Promise.all([
            this.dataLoader.load('site.json'),
            this.dataLoader.getGenres(),
            this.dataLoader.getStats(),
            this.dataLoader.getBooks({ limit: 6, sort: 'date-desc' }),
            this.dataLoader.getBooks({ favorite: true, limit: 3 }),
            this.dataLoader.getBooks({})
        ]);

        // Book of the month
        if (site?.bookOfMonth?.enabled && site?.bookOfMonth?.bookId) {
            const bookOfMonth = await this.dataLoader.getBook(site.bookOfMonth.bookId);
            if (bookOfMonth) {
                const container = document.getElementById('book-of-month');
                if (container) {
                    container.innerHTML = this.renderer.renderFeaturedBook(bookOfMonth, genres);
                }
            }
        }

        // Stats
        const statsContainer = document.getElementById('stats-grid');
        if (statsContainer && stats) {
            statsContainer.innerHTML = this.renderer.renderStats(stats);
        }

        // Latest reviews
        const latestContainer = document.getElementById('latest-reviews');
        if (latestContainer) {
            latestContainer.innerHTML = this.renderer.renderBookGrid(latestBooks, genres);
        }

        // LRB featured: il più recente in evidenza su fondo sky
        const featuredSlot = document.getElementById('lrb-featured-slot');
        if (featuredSlot && latestBooks.length > 0) {
            featuredSlot.innerHTML = this.renderer.renderFeaturedBook(latestBooks[0], genres);
        }

        // Random quote from favorites
        if (favoriteBooks.length > 0) {
            const booksWithQuotes = favoriteBooks.filter(b => b.quotes && b.quotes.length > 0);
            if (booksWithQuotes.length > 0) {
                const randomBook = booksWithQuotes[Math.floor(Math.random() * booksWithQuotes.length)];
                const randomQuote = randomBook.quotes[Math.floor(Math.random() * randomBook.quotes.length)];
                const quoteContainer = document.getElementById('quote-section');
                if (quoteContainer) {
                    quoteContainer.innerHTML = this.renderer.renderQuote(randomQuote, randomBook.title, randomBook.author);
                }
            }
        }

        // Genre chips with counts
        const chipsContainer = document.getElementById('genre-chips');
        if (chipsContainer && genres.length > 0) {
            const counts = {};
            allBooks.forEach(book => {
                (book.genres || []).forEach(g => { counts[g] = (counts[g] || 0) + 1; });
            });
            chipsContainer.innerHTML = this.renderer.renderGenreChips(genres, counts);
        }

        // CTA box
        const ctaContainer = document.getElementById('home-cta');
        if (ctaContainer && site?.cta) {
            ctaContainer.innerHTML = this.renderer.renderCTA(site.cta, site?.social?.email?.address);
        }
    }

    /**
     * Initialize recensioni page
     */
    async initRecensioniPage() {
        const [genres, years] = await Promise.all([
            this.dataLoader.getGenres(),
            this.dataLoader.getYearsRead()
        ]);

        // Populate filter dropdowns
        const genreSelect = document.getElementById('filter-genre');
        const ratingSelect = document.getElementById('filter-rating');
        const yearSelect = document.getElementById('filter-year');
        const searchInput = document.getElementById('filter-search');
        const sortSelect = document.getElementById('filter-sort');

        if (genreSelect) {
            genreSelect.innerHTML = this.renderer.renderGenreOptions(genres);
        }
        if (ratingSelect) {
            ratingSelect.innerHTML = this.renderer.renderRatingOptions();
        }
        if (yearSelect) {
            yearSelect.innerHTML = this.renderer.renderYearOptions(years);
        }

        // Preset filters from URL (e.g. recensioni.html?genere=fantasy)
        const params = new URLSearchParams(window.location.search);
        if (params.get('genere') && genreSelect) genreSelect.value = params.get('genere');
        if (params.get('voto') && ratingSelect) ratingSelect.value = params.get('voto');
        if (params.get('anno') && yearSelect) yearSelect.value = params.get('anno');
        if (params.get('cerca') && searchInput) searchInput.value = params.get('cerca');
        if (params.get('ordina') && sortSelect) sortSelect.value = params.get('ordina');

        // Initial load
        await this.loadFilteredBooks();

        // Set up filter listeners
        this.setupFilters();
    }

    /**
     * Load filtered books
     */
    async loadFilteredBooks() {
        const genre = document.getElementById('filter-genre')?.value || '';
        const rating = document.getElementById('filter-rating')?.value || '';
        const year = document.getElementById('filter-year')?.value || '';
        const search = document.getElementById('filter-search')?.value || '';
        const sort = document.getElementById('filter-sort')?.value || 'date-desc';

        const filters = {
            genre: genre || undefined,
            rating: rating || undefined,
            yearRead: year || undefined,
            search: search || undefined,
            sort: sort
        };

        const [books, genres] = await Promise.all([
            this.dataLoader.getBooks(filters),
            this.dataLoader.getGenres()
        ]);

        const container = document.getElementById('books-grid');
        const countElement = document.getElementById('results-count');

        if (container) {
            container.innerHTML = this.renderer.renderBookGrid(books, genres);
        }

        if (countElement) {
            countElement.innerHTML = `<strong>${books.length}</strong> ${books.length === 1 ? 'libro trovato' : 'libri trovati'}`;
        }
    }

    /**
     * Setup filter event listeners
     */
    setupFilters() {
        const filterElements = ['filter-genre', 'filter-rating', 'filter-year', 'filter-sort'];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.loadFilteredBooks());
            }
        });

        // Search with debounce
        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => this.loadFilteredBooks(), 300);
            });
        }

        // LRB tabs Latest / Best of
        document.querySelectorAll('.lrb-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lrb-tab').forEach(b => {
                    b.classList.remove('is-active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('is-active');
                btn.setAttribute('aria-selected', 'true');
                const sort = document.getElementById('filter-sort');
                const rating = document.getElementById('filter-rating');
                if (btn.dataset.tab === 'best') {
                    if (sort) sort.value = 'rating-desc';
                    if (sort) sort.dispatchEvent(new Event('change'));
                    setTimeout(() => {
                        document.querySelectorAll('#books-grid .lrb-card').forEach(c => {
                            c.style.display = Number(c.dataset.rating) >= 4 ? '' : 'none';
                        });
                    }, 100);
                } else {
                    if (sort) sort.value = 'date-desc';
                    if (rating) rating.value = '';
                    if (sort) sort.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    /**
     * Initialize libreria page
     */
    async initLibreriaPage() {
        const books = await this.dataLoader.getBooks({ sort: 'date-desc' });

        const container = document.getElementById('library-grid');
        if (container) {
            container.innerHTML = this.renderer.renderLibraryGrid(books);
        }

        const countElement = document.getElementById('library-count');
        if (countElement) {
            countElement.textContent = books.length;
        }
    }

    /**
     * Initialize chi-sono page
     */
    async initChiSonoPage() {
        const [personal, site, stats] = await Promise.all([
            this.dataLoader.load('personal.json'),
            this.dataLoader.load('site.json'),
            this.dataLoader.getStats()
        ]);

        if (!personal) return;

        // Profile info
        const nameEl = document.getElementById('about-name');
        const roleEl = document.getElementById('about-role');
        const bioEl = document.getElementById('about-bio');
        const bioExtEl = document.getElementById('about-bio-extended');

        if (nameEl) nameEl.textContent = personal.name;
        if (roleEl) roleEl.textContent = personal.role;
        if (bioEl) bioEl.textContent = personal.bio;
        if (bioExtEl) bioExtEl.textContent = personal.bioExtended;

        // Reading goal
        const goalContainer = document.getElementById('reading-goal');
        if (goalContainer && personal.readingGoal) {
            goalContainer.innerHTML = this.renderer.renderReadingGoal(personal.readingGoal);
        }

        // Favorite genres
        const genresContainer = document.getElementById('favorite-genres');
        if (genresContainer && personal.favoriteGenres) {
            genresContainer.innerHTML = this.renderer.renderFavoriteGenres(personal.favoriteGenres);
        }

        // Fun facts
        const factsContainer = document.getElementById('fun-facts');
        if (factsContainer && personal.funFacts) {
            factsContainer.innerHTML = this.renderer.renderFunFacts(personal.funFacts);
        }

        // Contact cards
        const contactContainer = document.getElementById('contact-cards');
        if (contactContainer && site?.social) {
            contactContainer.innerHTML = this.renderer.renderContactCards(site.social);
        }

        // Stats
        const statsContainer = document.getElementById('about-stats');
        if (statsContainer && stats) {
            statsContainer.innerHTML = this.renderer.renderStats(stats);
        }
    }

    /**
     * Initialize single book page
     */
    async initLibroPage() {
        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            this.showBookNotFound();
            return;
        }

        const [book, genres, allBooks, site] = await Promise.all([
            this.dataLoader.getBook(bookId),
            this.dataLoader.getGenres(),
            this.dataLoader.getBooks({ sort: 'date-desc' }).catch(() => []),
            this.dataLoader.load('site.json').catch(() => null)
        ]);

        if (!book) {
            this.showBookNotFound();
            return;
        }

        document.title = `${book.title} - Pagine e Parole`;

        await this.populateBookPage(book, genres, { allBooks, site });
    }

    /**
     * Populate book page with data
     */
    async populateBookPage(book, genres, ctx = {}) {
        const { allBooks = [], site = null } = ctx;
        // Breadcrumb
        const crumbEl = document.getElementById('crumb-title');
        if (crumbEl) crumbEl.textContent = book.title;

        // Kicker + data stile LRB
        const kickerEl = document.getElementById('book-kicker');
        if (kickerEl) kickerEl.textContent = 'Recensione';
        const dateEl = document.getElementById('book-date');
        if (dateEl && this.renderer.formatDateLRB) dateEl.textContent = this.renderer.formatDateLRB(book.dateRead);

        // Word count
        const words = (book.review || '').split(/\s+/).filter(Boolean).length;
        const wcEl = document.getElementById('book-wordcount');
        if (wcEl) wcEl.textContent = words ? `${words.toLocaleString('it-IT')} parole · ${Math.max(1, Math.round(words / 200))} min di lettura` : '';

        // Share
        const pageUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(`${book.title} di ${book.author}`);
        const setHref = (id, href) => { const el = document.getElementById(id); if (el) el.href = href; };
        setHref('share-facebook', `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`);
        setHref('share-email', `mailto:?subject=${shareText}&body=${pageUrl}`);
        const printBtn = document.getElementById('share-print');
        if (printBtn) printBtn.addEventListener('click', () => window.print());

        // Scheda libro beige
        const cardEl = document.getElementById('book-bookcard');
        if (cardEl) {
            cardEl.innerHTML = `
                <div><dt>Editore</dt><dd>${book.publisher || 'N/D'}</dd></div>
                <div><dt>Pagine</dt><dd>${book.pages || 'N/D'}</dd></div>
                <div><dt>Anno</dt><dd>${book.year || 'N/D'}</dd></div>`;
        }

        // Caption
        const captionEl = document.getElementById('book-caption');
        if (captionEl) captionEl.textContent = `Copertina di ${book.title}${book.publisher ? `, ${book.publisher}` : ''}${book.year ? ` ${book.year}` : ''}.`;

        // Cover
        const coverContainer = document.getElementById('book-cover');
        if (coverContainer) {
            coverContainer.innerHTML = `
                <img src="${book.cover}"
                      alt="Copertina di ${book.title}"
                      width="400" height="600" decoding="async"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="book-single-cover-placeholder" style="display: none;">
                    <span class="title">${book.title}</span>
                </div>
            `;
        }

        // Title and author
        const titleEl = document.getElementById('book-title');
        const authorEl = document.getElementById('book-author');
        if (titleEl) titleEl.textContent = book.title;
        if (authorEl) authorEl.textContent = `di ${book.author}`;

        // Meta row
        const metaEl = document.getElementById('book-meta');
        if (metaEl) metaEl.innerHTML = this.renderer.renderBookMeta(book);

        // Rating
        const ratingContainer = document.getElementById('book-rating');
        if (ratingContainer) {
            ratingContainer.innerHTML = this.renderer.renderRatingWithLabel(book.rating);
        }

        // Genres
        const genresContainer = document.getElementById('book-genres');
        if (genresContainer) {
            genresContainer.innerHTML = this.renderer.renderGenreTags(book.genres, genres);
        }

        // Review
        const reviewEl = document.getElementById('book-review');
        if (reviewEl) {
            reviewEl.innerHTML = book.review.split('\n').map(p => `<p>${p}</p>`).join('');
        }

        // Quotes
        const quotesContainer = document.getElementById('book-quotes');
        const quotesSection = document.getElementById('quotes-section');
        if (quotesContainer && book.quotes && book.quotes.length > 0) {
            quotesContainer.innerHTML = book.quotes.map(quote => 
                this.renderer.renderQuote(quote, book.title, book.author)
            ).join('');
        } else if (quotesSection) {
            quotesSection.style.display = 'none';
        }

        // Details
        const detailsContainer = document.getElementById('book-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Pagine</span>
                    <span class="book-single-details-value">${book.pages || 'N/D'}</span>
                </div>
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Anno</span>
                    <span class="book-single-details-value">${book.year || 'N/D'}</span>
                </div>
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Editore</span>
                    <span class="book-single-details-value">${book.publisher || 'N/D'}</span>
                </div>
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Letto</span>
                    <span class="book-single-details-value">${this.renderer.formatDate(book.dateRead)}</span>
                </div>
            `;
        }

        // Tags
        const tagsContainer = document.getElementById('book-tags');
        if (tagsContainer && book.tags) {
            tagsContainer.innerHTML = book.tags.map(tag =>
                `<span class="tag">#${tag}</span>`
            ).join('');
        }

        // Related books (shared genres, excluding self) + prev/next + sidebar
        try {
            const ordered = [...allBooks].sort((a, b) => String(b.dateRead).localeCompare(String(a.dateRead)));
            const idx = ordered.findIndex(b => b.id === book.id);
            const prev = idx >= 0 ? ordered[idx + 1] : null;
            const next = idx > 0 ? ordered[idx - 1] : null;
            const fillCard = (id, item) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (!item) { el.style.display = 'none'; return; }
                el.href = `libro.html?id=${item.id}`;
                const t = el.querySelector('.prevnext-title');
                const e = el.querySelector('.prevnext-excerpt');
                if (t) t.textContent = item.title;
                if (e) e.textContent = String(item.review || '').split('\n')[0].slice(0, 140);
            };
            fillCard('prev-post', prev);
            fillCard('next-post', next);

            const related = ordered
                .filter(b => b.id !== book.id && (b.genres || []).some(g => (book.genres || []).includes(g)))
                .slice(0, 3);
            const relatedSection = document.getElementById('related-section');
            const relatedContainer = document.getElementById('related-books');
            if (relatedSection && relatedContainer && related.length > 0) {
                relatedContainer.innerHTML = this.renderer.renderBookGrid(related, genres);
                relatedSection.style.display = '';
            }

            const relEl = document.getElementById('sidebar-related');
            if (relEl) {
                const rel = ordered.filter(b => b.id !== book.id && (b.genres || []).some(g => (book.genres || []).includes(g))).slice(0, 4);
                relEl.innerHTML = rel.length
                    ? rel.map(b => `<li><a href="libro.html?id=${b.id}">${b.title}</a><span class="sidebar-list-meta">${b.author}</span></li>`).join('')
                    : '<li>Nessun articolo correlato.</li>';
            }
            const moreEl = document.getElementById('sidebar-more');
            const firstGenre = (book.genres || [])[0];
            if (moreEl && firstGenre) {
                const more = ordered.filter(b => b.id !== book.id && (b.genres || []).includes(firstGenre)).slice(0, 4);
                moreEl.innerHTML = more.length
                    ? more.map(b => `<li><a href="libro.html?id=${b.id}">${b.title}</a><span class="sidebar-list-meta">${b.author}</span></li>`).join('')
                    : '<li>Nessun altro titolo.</li>';
            }
            const authorBox = document.getElementById('sidebar-author');
            if (authorBox) authorBox.innerHTML = `<p style="font-size:.92rem;line-height:1.6;color:var(--ink-2)"><strong style="color:var(--ink)">${book.author}</strong></p>`;
            const emailEl = document.getElementById('sidebar-contact-email');
            if (emailEl && site?.social?.email?.address) { emailEl.href = `mailto:${site.social.email.address}`; emailEl.textContent = site.social.email.address; }
        } catch (e) {
            console.warn('Related books failed:', e);
        }
    }

    /**
     * Show book not found message
     */
    showBookNotFound() {
        const container = document.querySelector('.book-single');
        if (container) {
            container.innerHTML = `
                <div class="container">
                    <div class="empty-state">
                        <h3 class="empty-state-title">Libro non trovato</h3>
                        <p class="empty-state-text">Il libro che stai cercando non esiste.</p>
                        <a href="recensioni.html" class="btn btn-primary mt-lg">Torna alle recensioni</a>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App = new App();
    window.App.init();
});
