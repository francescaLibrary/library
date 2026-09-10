/**
 * Data Loader Module - Pagine e Parole
 * Handles fetching and caching JSON data
 */

class DataLoader {
    constructor() {
        this.cache = {};
        this.basePath = 'data/';
    }

    /**
     * Load JSON file
     * @param {string} filename - JSON filename
     * @returns {Promise<Object>}
     */
    async load(filename) {
        if (this.cache[filename]) {
            return this.cache[filename];
        }

        try {
            const response = await fetch(this.basePath + filename);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}`);
            }
            const data = await response.json();
            this.cache[filename] = data;
            return data;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    }

    /**
     * Load all data files
     * @returns {Promise<Object>}
     */
    async loadAll() {
        const [site, personal, books, categories] = await Promise.all([
            this.load('site.json'),
            this.load('personal.json'),
            this.load('books.json'),
            this.load('categories.json')
        ]);

        return { site, personal, books, categories };
    }

    /**
     * Get book by ID
     * @param {string} id - Book ID
     * @returns {Promise<Object|null>}
     */
    async getBook(id) {
        const data = await this.load('books.json');
        if (!data || !data.books) return null;
        return data.books.find(book => book.id === id) || null;
    }

    /**
     * Get books filtered by criteria
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>}
     */
    async getBooks(filters = {}) {
        const data = await this.load('books.json');
        if (!data || !data.books) return [];

        let books = [...data.books];

        // Filter by genre
        if (filters.genre) {
            books = books.filter(book => 
                book.genres && book.genres.includes(filters.genre)
            );
        }

        // Filter by rating
        if (filters.rating) {
            books = books.filter(book => book.rating === parseInt(filters.rating));
        }

        // Filter by favorite
        if (filters.favorite) {
            books = books.filter(book => book.favorite === true);
        }

        // Filter by year read
        if (filters.yearRead) {
            books = books.filter(book => 
                book.dateRead && book.dateRead.startsWith(filters.yearRead)
            );
        }

        // Search by title or author
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            books = books.filter(book => 
                book.title.toLowerCase().includes(searchLower) ||
                book.author.toLowerCase().includes(searchLower)
            );
        }

        // Sort
        if (filters.sort) {
            switch (filters.sort) {
                case 'date-desc':
                    books.sort((a, b) => (b.dateRead || '').localeCompare(a.dateRead || ''));
                    break;
                case 'date-asc':
                    books.sort((a, b) => (a.dateRead || '').localeCompare(b.dateRead || ''));
                    break;
                case 'rating-desc':
                    books.sort((a, b) => b.rating - a.rating);
                    break;
                case 'rating-asc':
                    books.sort((a, b) => a.rating - b.rating);
                    break;
                case 'title-asc':
                    books.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'title-desc':
                    books.sort((a, b) => b.title.localeCompare(a.title));
                    break;
            }
        } else {
            // Default: sort by date read (newest first)
            books.sort((a, b) => (b.dateRead || '').localeCompare(a.dateRead || ''));
        }

        // Limit
        if (filters.limit) {
            books = books.slice(0, filters.limit);
        }

        return books;
    }

    /**
     * Get genre by ID
     * @param {string} id - Genre ID
     * @returns {Promise<Object|null>}
     */
    async getGenre(id) {
        const data = await this.load('categories.json');
        if (!data || !data.genres) return null;
        return data.genres.find(genre => genre.id === id) || null;
    }

    /**
     * Get all genres
     * @returns {Promise<Array>}
     */
    async getGenres() {
        const data = await this.load('categories.json');
        return data?.genres || [];
    }

    /**
     * Calculate reading statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        const data = await this.load('books.json');
        if (!data || !data.books) {
            return {
                totalBooks: 0,
                totalPages: 0,
                averageRating: 0,
                favoriteCount: 0
            };
        }

        const books = data.books;
        const totalBooks = books.length;
        const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
        const averageRating = totalBooks > 0 
            ? (books.reduce((sum, book) => sum + book.rating, 0) / totalBooks).toFixed(1)
            : 0;
        const favoriteCount = books.filter(book => book.favorite).length;

        // Most read author
        const authorCounts = {};
        books.forEach(book => {
            authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
        });
        const topAuthor = Object.entries(authorCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            totalBooks,
            totalPages,
            averageRating,
            favoriteCount,
            topAuthor: topAuthor ? { name: topAuthor[0], count: topAuthor[1] } : null
        };
    }

    /**
     * Get unique years from books read
     * @returns {Promise<Array>}
     */
    async getYearsRead() {
        const data = await this.load('books.json');
        if (!data || !data.books) return [];

        const years = new Set();
        data.books.forEach(book => {
            if (book.dateRead) {
                years.add(book.dateRead.substring(0, 4));
            }
        });

        return Array.from(years).sort((a, b) => b - a);
    }
}

// Export singleton instance
window.DataLoader = new DataLoader();
