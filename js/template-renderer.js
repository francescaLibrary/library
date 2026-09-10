/**
 * Template Renderer — Pagine e Parole · Edizione editoriale
 * Nessuna emoji: solo tipografia.
 */

class TemplateRenderer {
    constructor() {
        this.ratingLabels = {
            5: 'Capolavoro',
            4: 'Ottimo',
            3: 'Buono',
            2: 'Discreto',
            1: 'Deludente'
        };
    }

    renderRating(rating, size = 'normal') {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(`<span class="rating-star ${i <= rating ? 'filled' : ''}">★</span>`);
        }
        const sizeClass = size === 'large' ? 'rating-large' : '';
        return `<div class="rating ${sizeClass}" aria-label="${rating} su 5">${stars.join('')}</div>`;
    }

    renderRatingWithLabel(rating) {
        return `
            ${this.renderRating(rating, 'large')}
            <span class="rating-label">${this.ratingLabels[rating] || ''} · ${rating}/5</span>
        `;
    }

    renderGenreTags(genreIds, allGenres) {
        if (!genreIds || !allGenres) return '';
        return genreIds.map(id => {
            const genre = allGenres.find(g => g.id === id);
            if (!genre) return '';
            return `<span class="tag">${genre.name}</span>`;
        }).join('');
    }

    renderBookCover(book) {
        return `
            <img src="${book.cover}"
                  alt="Copertina di ${book.title}"
                  width="400" height="600"
                  loading="lazy" decoding="async"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="book-card-cover-placeholder" style="display: none;">
                <span class="title">${book.title}</span>
                <span class="author">${book.author}</span>
            </div>
        `;
    }

    renderBookCard(book, genres = []) {
        return `
            <a href="libro.html?id=${book.id}" class="book-card">
                <div class="book-card-cover">
                    ${this.renderBookCover(book)}
                    ${book.favorite ? '<span class="book-card-favorite">Preferito</span>' : ''}
                </div>
                <div class="book-card-body">
                    <h3 class="book-card-title">${book.title}</h3>
                    <p class="book-card-author">${book.author}</p>
                    <div class="book-card-meta">
                        <div class="book-card-rating">
                            ${this.renderRating(book.rating)}
                        </div>
                    </div>
                    <div class="book-card-genres">
                        ${this.renderGenreTags(book.genres?.slice(0, 2), genres)}
                    </div>
                </div>
            </a>
        `;
    }

    renderBookGrid(books, genres = []) {
        if (!books || books.length === 0) {
            return `
                <div class="empty-state">
                    <h3 class="empty-state-title">Nessun libro trovato</h3>
                    <p class="empty-state-text">Prova a modificare i filtri di ricerca.</p>
                </div>
            `;
        }
        return books.map(book => this.renderBookCard(book, genres)).join('');
    }

    renderFeaturedBook(book, genres = []) {
        const excerpt = (book.review || '').split('\n')[0];
        return `
            <div class="featured-book-card">
                <div class="featured-book-cover">
                    <img src="${book.cover}"
                          alt="Copertina di ${book.title}"
                          width="400" height="600"
                          loading="lazy" decoding="async"
                          onerror="this.parentElement.innerHTML='<div class=\\'book-card-cover-placeholder\\' style=\\'height:100%;display:flex;\\'><span class=\\'title\\'>${book.title}</span></div>';">
                </div>
                <div class="featured-book-body">
                    <span class="featured-book-badge">Libro del mese</span>
                    <h2 class="featured-book-title">${book.title}</h2>
                    <p class="featured-book-author">${book.author}</p>
                    <p class="featured-book-excerpt">${excerpt}</p>
                    <div class="featured-book-footer">
                        <div class="book-card-rating">
                            ${this.renderRatingWithLabel(book.rating)}
                        </div>
                        <a href="libro.html?id=${book.id}" class="btn btn-primary">Leggi la recensione</a>
                    </div>
                </div>
            </div>
        `;
    }

    renderStats(stats) {
        return `
            <div class="stat-card">
                <span class="stat-number">${stats.totalBooks}</span>
                <span class="stat-label">Libri letti</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${stats.totalPages.toLocaleString('it-IT')}</span>
                <span class="stat-label">Pagine totali</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${stats.averageRating}</span>
                <span class="stat-label">Voto medio</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${stats.favoriteCount}</span>
                <span class="stat-label">Preferiti</span>
            </div>
        `;
    }

    renderLibraryItem(book) {
        return `
            <a href="libro.html?id=${book.id}" class="library-item" aria-label="${book.title} di ${book.author}">
                <img src="${book.cover}"
                      alt="Copertina di ${book.title}"
                      width="400" height="600"
                      loading="lazy" decoding="async"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="library-item-placeholder" style="display: none;">${(book.title || 'P').charAt(0)}</div>
                <div class="library-item-overlay">
                    <span class="library-item-title">${book.title}</span>
                    <div class="library-item-rating">
                        ${this.renderRating(book.rating, 'small')}
                    </div>
                </div>
            </a>
        `;
    }

    renderLibraryGrid(books) {
        if (!books || books.length === 0) {
            return `
                <div class="empty-state">
                    <h3 class="empty-state-title">La libreria è vuota</h3>
                </div>
            `;
        }
        return books.map(book => this.renderLibraryItem(book)).join('');
    }

    renderQuote(quote, title, author) {
        return `
            <div class="quote-card">
                <p class="quote-text">“${quote}”</p>
                <div class="quote-source">
                    <span class="quote-source-title">${title}</span>
                    <span>— ${author}</span>
                </div>
            </div>
        `;
    }

    /**
     * Genre chips with counts (home) — link to filtered recensioni page
     * @param {Array} genres - All genres
     * @param {Object} counts - { genreId: count }
     */
    renderGenreChips(genres, counts = {}) {
        return genres
            .filter(g => (counts[g.id] || 0) > 0)
            .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
            .map(g => `
                <a class="genre-chip" href="recensioni.html?genere=${g.id}">
                    ${g.name}
                    <span class="genre-chip-count">${counts[g.id]}</span>
                </a>
            `).join('');
    }

    /**
     * Newsletter/CTA box (home)
     * @param {Object} cta - { title, description }
     * @param {string} email - contact email
     */
    renderCTA(cta, email = '') {
        if (!cta) return '';
        return `
            <div class="cta-box">
                <h2 class="cta-box-title">${cta.title}</h2>
                <p class="cta-box-text">${cta.description}</p>
                ${email ? `<a class="btn btn-primary" href="mailto:${email}">Scrivimi</a>` : ''}
            </div>
        `;
    }

    /**
     * Inline meta row for single book page
     */
    renderBookMeta(book) {
        const parts = [];
        if (book.year) parts.push(`<span><strong>${book.year}</strong></span>`);
        if (book.pages) parts.push(`<span><strong>${book.pages}</strong> pagine</span>`);
        if (book.publisher) parts.push(`<span>${book.publisher}</span>`);
        if (book.dateRead) parts.push(`<span>Letto nel <strong>${this.formatDate(book.dateRead)}</strong></span>`);
        return parts.join('<span aria-hidden="true">·</span>');
    }

    renderGenreOptions(genres, selected = '') {        let html = '<option value="">Tutti i generi</option>';
        genres.forEach(genre => {
            html += `<option value="${genre.id}" ${genre.id === selected ? 'selected' : ''}>${genre.name}</option>`;
        });
        return html;
    }

    renderRatingOptions(selected = '') {
        let html = '<option value="">Tutti i voti</option>';
        for (let i = 5; i >= 1; i--) {
            html += `<option value="${i}" ${i.toString() === selected ? 'selected' : ''}>${'★'.repeat(i)} — ${this.ratingLabels[i]}</option>`;
        }
        return html;
    }

    renderYearOptions(years, selected = '') {
        let html = '<option value="">Tutti gli anni</option>';
        years.forEach(year => {
            html += `<option value="${year}" ${year === selected ? 'selected' : ''}>${year}</option>`;
        });
        return html;
    }

    renderFavoriteGenres(genres) {
        return genres.map(genre => `
            <div class="genre-card">
                <h3 class="genre-card-name">${genre.name}</h3>
                <p class="genre-card-description">${genre.description}</p>
            </div>
        `).join('');
    }

    renderFunFacts(facts) {
        return facts.map(fact => `
            <div class="fun-fact">
                <span class="fun-fact-text">${fact.text}</span>
            </div>
        `).join('');
    }

    renderReadingGoal(goal) {
        const percentage = Math.min((goal.current / goal.target) * 100, 100);
        return `
            <div class="reading-goal">
                <div class="reading-goal-header">
                    <span class="reading-goal-title">Obiettivo ${goal.year}</span>
                    <span class="reading-goal-count">${goal.current} / ${goal.target}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <p class="reading-goal-text">
                    ${goal.current >= goal.target
                        ? 'Obiettivo raggiunto.'
                        : `Ancora ${goal.target - goal.current} libri da leggere.`}
                </p>
            </div>
        `;
    }

    renderContactCards(social) {
        return `
            <a href="mailto:${social.email.address}" class="contact-card">
                <span class="contact-card-label">Email</span>
                <span class="contact-card-value">${social.email.address}</span>
            </a>
            <a href="${social.instagram.url}" target="_blank" rel="noopener" class="contact-card">
                <span class="contact-card-label">Instagram</span>
                <span class="contact-card-value">@${social.instagram.username}</span>
            </a>
            <a href="${social.goodreads.url}" target="_blank" rel="noopener" class="contact-card">
                <span class="contact-card-label">Goodreads</span>
                <span class="contact-card-value">@${social.goodreads.username}</span>
            </a>
        `;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const months = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        const [year, month] = dateStr.split('-');
        return `${months[parseInt(month) - 1]} ${year}`;
    }
}

window.TemplateRenderer = new TemplateRenderer();
