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
        const [site, genres, stats, latestBooks, favoriteBooks] = await Promise.all([
            this.dataLoader.load('site.json'),
            this.dataLoader.getGenres(),
            this.dataLoader.getStats(),
            this.dataLoader.getBooks({ limit: 6, sort: 'date-desc' }),
            this.dataLoader.getBooks({ favorite: true, limit: 3 })
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

        if (genreSelect) {
            genreSelect.innerHTML = this.renderer.renderGenreOptions(genres);
        }
        if (ratingSelect) {
            ratingSelect.innerHTML = this.renderer.renderRatingOptions();
        }
        if (yearSelect) {
            yearSelect.innerHTML = this.renderer.renderYearOptions(years);
        }

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
        // Get book ID from URL
        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            this.showBookNotFound();
            return;
        }

        const [book, genres] = await Promise.all([
            this.dataLoader.getBook(bookId),
            this.dataLoader.getGenres()
        ]);

        if (!book) {
            this.showBookNotFound();
            return;
        }

        // Update page title
        document.title = `${book.title} - Pagine e Parole`;

        // Populate book data
        this.populateBookPage(book, genres);
    }

    /**
     * Populate book page with data
     */
    populateBookPage(book, genres) {
        // Cover
        const coverContainer = document.getElementById('book-cover');
        if (coverContainer) {
            coverContainer.innerHTML = `
                <img src="${book.cover}"
                      alt="Copertina di ${book.title}"
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
        if (authorEl) authorEl.textContent = book.author;

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
