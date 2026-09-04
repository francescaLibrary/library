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
        try {
            const [site, genres, stats, latestBooks, allBooks] = await Promise.all([
                this.dataLoader.load('site.json'),
                this.dataLoader.getGenres(),
                this.dataLoader.getStats(),
                this.dataLoader.getBooks({ limit: 6, sort: 'date-desc' }),
                this.dataLoader.getBooks({})
            ]);

            // Book of the month
            if (site?.bookOfMonth?.enabled && site?.bookOfMonth?.bookId) {
                const bookOfMonth = await this.dataLoader.getBook(site.bookOfMonth.bookId);
                if (bookOfMonth) {
                    const container = document.getElementById('book-of-month');
                    if (container) {
                        container.innerHTML = this.renderer.renderFeaturedBook(bookOfMonth, 'Libro del mese');
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

            // In evidenza: il più recente su fondo sky
            const featuredSlot = document.getElementById('lrb-featured-slot');
            if (featuredSlot && latestBooks.length > 0) {
                featuredSlot.innerHTML = this.renderer.renderFeaturedBook(latestBooks[0], 'In evidenza');
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
        } catch (e) {
            console.warn('Home non caricata:', e);
            this.showLoadError('latest-reviews', 'recensioni.html');
        }
    }

    /**
     * Messaggio d'errore con riprova quando i dati non si caricano
     */
    showLoadError(containerId, fallbackHref = 'index.html') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3 class="empty-state-title">Contenuti non disponibili</h3>
                    <p class="empty-state-text">Controlla la connessione e ricarica la pagina. Il sito va aperto via http, non come file.</p>
                    <p class="empty-state-text"><button type="button" class="btn btn-primary mt-lg" onclick="window.location.reload()">Riprova</button></p>
                </div>`;
        }
    }

    /**
     * Initialize recensioni page
     */
    async initRecensioniPage() {
        try {
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
        } catch (e) {
            console.warn('Recensioni non caricate:', e);
            this.showLoadError('books-grid');
        }

        this.initSurprise('surprise-btn');
    }

    /**
     * Load filtered books (con supporto vista "I migliori": voto >= 4)
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

        let [books, genres] = await Promise.all([
            this.dataLoader.getBooks(filters),
            this.dataLoader.getGenres()
        ]);

        if (this.bestOnly) {
            books = books.filter(b => Number(b.rating) >= 4);
        }

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
     * Libro casuale: naviga a una scheda a sorpresa
     */
    initSurprise(buttonId) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
                const books = await this.dataLoader.getBooks({});
                if (books.length) {
                    const pick = books[Math.floor(Math.random() * books.length)];
                    window.location.href = 'libro.html?id=' + encodeURIComponent(pick.id);
                    return;
                }
            } catch (e) {
                console.warn('Libro a sorpresa non disponibile:', e);
            }
            btn.disabled = false;
        });
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

        // Viste Ultime / I migliori (toggle semplice, filtro dati reale)
        document.querySelectorAll('.lrb-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lrb-tab').forEach(b => {
                    b.classList.remove('is-active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('is-active');
                btn.setAttribute('aria-pressed', 'true');
                const sort = document.getElementById('filter-sort');
                const rating = document.getElementById('filter-rating');
                if (btn.dataset.tab === 'best') {
                    this.bestOnly = true;
                    if (sort) sort.value = 'rating-desc';
                } else {
                    this.bestOnly = false;
                    if (sort) sort.value = 'date-desc';
                    if (rating) rating.value = '';
                }
                this.loadFilteredBooks();
            });
        });
    }

    /**
     * Initialize libreria page
     */
    async initLibreriaPage() {
        try {
            const books = await this.dataLoader.getBooks({ sort: 'date-desc' });

            const container = document.getElementById('library-grid');
            if (container) {
                container.innerHTML = this.renderer.renderLibraryGrid(books);
            }

            const countElement = document.getElementById('library-count');
            if (countElement) {
                countElement.textContent = books.length;
            }
        } catch (e) {
            console.warn('Libreria non caricata:', e);
            this.showLoadError('library-grid', 'recensioni.html');
        }

        this.initSurprise('surprise-btn-library');
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

        const [book, genres, allBooks] = await Promise.all([
            this.dataLoader.getBook(bookId),
            this.dataLoader.getGenres(),
            this.dataLoader.getBooks({ sort: 'date-desc' }).catch(() => [])
        ]);

        if (!book) {
            this.showBookNotFound();
            return;
        }

        document.title = `${book.title} - Pagine e Parole`;

        await this.populateBookPage(book, genres, { allBooks });
    }

    /**
     * Populate book page with data
     */
    async populateBookPage(book, genres, ctx = {}) {
        const { allBooks = [] } = ctx;
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

        // Share via email (bottone, niente salti di pagina) + stampa
        const pageUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(`${book.title} di ${book.author}`);
        const emailBtn = document.getElementById('share-email');
        if (emailBtn) {
            emailBtn.addEventListener('click', () => {
                window.location.href = `mailto:?subject=${shareText}&body=${pageUrl}`;
            });
        }
        const printBtn = document.getElementById('share-print');
        if (printBtn) printBtn.addEventListener('click', () => window.print());

        // Dove acquistarlo: Feltrinelli + IBS (ricerca per titolo e autore)
        const buyEl = document.getElementById('buy-links');
        if (buyEl) {
            const q = encodeURIComponent(`${book.title} ${book.author}`);
            buyEl.innerHTML = `
                <a class="buy-link" href="https://www.lafeltrinelli.it/catalogsearch/result/?q=${q}" target="_blank" rel="noopener">Cerca su Feltrinelli</a>
                <a class="buy-link" href="https://www.ibs.it/search/?q=${q}" target="_blank" rel="noopener">Cerca su IBS</a>`;
        }

        // Copia link della recensione
        const copyBtn = document.getElementById('share-copy');
        const copyLabel = document.getElementById('share-copy-feedback');
        if (copyBtn) {
            copyBtn.disabled = false;
            let resetTimer;
            copyBtn.addEventListener('click', async () => {
                const url = window.location.href;
                let ok = false;
                try {
                    await navigator.clipboard.writeText(url);
                    ok = true;
                } catch (e) {
                    const ta = document.createElement('textarea');
                    ta.value = url;
                    ta.setAttribute('readonly', '');
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
                    ta.remove();
                }
                if (copyLabel) copyLabel.textContent = ok ? 'Copiato' : 'Copia non riuscita';
                copyBtn.classList.toggle('is-copied', ok);
                clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    if (copyLabel) copyLabel.textContent = 'Copia link';
                    copyBtn.classList.remove('is-copied');
                }, 2000);
            });
        }

        // JSON-LD per motori di ricerca (la pagina è renderizzata via JS)
        document.getElementById('book-jsonld')?.remove();
        const ld = {
            '@context': 'https://schema.org',
            '@type': 'Book',
            name: book.title,
            author: { '@type': 'Person', name: book.author },
            url: window.location.href
        };
        if (book.publisher) ld.publisher = { '@type': 'Organization', name: book.publisher };
        if (book.pages) ld.numberOfPages = Number(book.pages);
        if (book.year) ld.datePublished = String(book.year);
        if (book.rating) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: String(book.rating), bestRating: '5', reviewCount: '1' };
        const ldEl = document.createElement('script');
        ldEl.type = 'application/ld+json';
        ldEl.id = 'book-jsonld';
        ldEl.textContent = JSON.stringify(ld);
        document.head.appendChild(ldEl);

        // Barra di avanzamento lettura
        this.initReadingProgress();

        // Scheda libro beige
        const cardEl = document.getElementById('book-bookcard');
        if (cardEl) {
            const esc = this.renderer.esc.bind(this.renderer);
            cardEl.innerHTML = `
                <div><dt>Editore</dt><dd>${esc(book.publisher) || 'N/D'}</dd></div>
                <div><dt>Pagine</dt><dd>${esc(book.pages) || 'N/D'}</dd></div>
                <div><dt>Anno</dt><dd>${esc(book.year) || 'N/D'}</dd></div>`;
        }

        // Caption
        const captionEl = document.getElementById('book-caption');
        if (captionEl) captionEl.textContent = `Copertina di ${book.title}${book.publisher ? `, ${book.publisher}` : ''}${book.year ? ` ${book.year}` : ''}.`;

        // Cover (testo con escape contro markup rotto)
        const coverContainer = document.getElementById('book-cover');
        if (coverContainer) {
            const escCover = this.renderer.esc(book.title);
            coverContainer.innerHTML = `
                <img src="${book.cover}"
                      alt="Copertina di ${escCover}"
                      width="400" height="600" decoding="async"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="book-single-cover-placeholder" style="display: none;">
                    <span class="title">${escCover}</span>
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

        // Review (paragrafi con escape)
        const reviewEl = document.getElementById('book-review');
        if (reviewEl) {
            reviewEl.innerHTML = String(book.review || '').split('\n')
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .map(p => `<p>${this.renderer.esc(p)}</p>`)
                .join('');
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
            const escD = this.renderer.esc.bind(this.renderer);
            detailsContainer.innerHTML = `
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Pagine</span>
                    <span class="book-single-details-value">${escD(book.pages) || 'N/D'}</span>
                </div>
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Anno</span>
                    <span class="book-single-details-value">${escD(book.year) || 'N/D'}</span>
                </div>
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Editore</span>
                    <span class="book-single-details-value">${escD(book.publisher) || 'N/D'}</span>
                </div>
                <div class="book-single-details-item">
                    <span class="book-single-details-label">Letto</span>
                    <span class="book-single-details-value">${escD(this.renderer.formatDate(book.dateRead))}</span>
                </div>
            `;
        }

        // Tags
        const tagsContainer = document.getElementById('book-tags');
        if (tagsContainer && book.tags) {
            tagsContainer.innerHTML = book.tags.map(tag =>
                `<span class="tag">#${this.renderer.esc(tag)}</span>`
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
            const prevnextNav = document.getElementById('prevnext-nav');
            if (prevnextNav && (prev || next)) prevnextNav.hidden = false;

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
                const escR = this.renderer.esc.bind(this.renderer);
                const rel = ordered.filter(b => b.id !== book.id && (b.genres || []).some(g => (book.genres || []).includes(g))).slice(0, 4);
                relEl.innerHTML = rel.length
                    ? rel.map(b => `<li><a href="libro.html?id=${b.id}">${escR(b.title)}</a><span class="sidebar-list-meta">${escR(b.author)}</span></li>`).join('')
                    : '<li>Nessun articolo correlato.</li>';
            }
            const moreEl = document.getElementById('sidebar-more');
            const moreTitle = document.getElementById('sidebar-more-title');
            const firstGenre = (book.genres || [])[0];
            const genreName = (id) => (genres || []).find((g) => g.id === id)?.name || id;
            if (moreTitle && firstGenre) moreTitle.textContent = `Altro in ${genreName(firstGenre)}`;
            if (moreEl && firstGenre) {
                const escM = this.renderer.esc.bind(this.renderer);
                const more = ordered.filter(b => b.id !== book.id && (b.genres || []).includes(firstGenre)).slice(0, 4);
                moreEl.innerHTML = more.length
                    ? more.map(b => `<li><a href="libro.html?id=${b.id}">${escM(b.title)}</a><span class="sidebar-list-meta">${escM(b.author)}</span></li>`).join('')
                    : '<li>Nessun altro titolo.</li>';
            }
        } catch (e) {
            console.warn('Related books failed:', e);
        }
    }

    /**
     * Barra di avanzamento lettura (solo pagina libro)
     */
    initReadingProgress() {
        const wrap = document.getElementById('readingProgress');
        const bar = document.getElementById('readingProgressBar');
        const main = document.querySelector('.book-single-main');
        if (!wrap || !bar || !main) {
            if (wrap) wrap.hidden = true;
            return;
        }
        let ticking = false;
        const update = () => {
            ticking = false;
            const rect = main.getBoundingClientRect();
            const total = main.offsetHeight - window.innerHeight;
            if (total <= 0) { bar.style.transform = 'scaleX(1)'; return; }
            const passed = Math.min(Math.max(-rect.top, 0), total);
            bar.style.transform = 'scaleX(' + (passed / total).toFixed(4) + ')';
        };
        const onScroll = () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
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
