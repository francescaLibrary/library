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

    esc(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    formatDateLRB(dateStr) {
        if (!dateStr) return '';
        const MONTHS_EN = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        const [y, m, d] = dateStr.split('-').map(Number);
        if (!y || !m) return dateStr;
        const day = d ? `${String(d).padStart(2, '0')} ` : '';
        return `${day}${MONTHS_EN[m - 1]} ${y}`;
    }

    lrbExcerpt(book, max = 150) {
        const first = String(book.review || '').split('\n').map(s => s.trim()).find(Boolean) || '';
        return first.length > max ? first.slice(0, max).trimEnd() + '…' : first;
    }

    lrbKicker(book, genres = []) {
        const g = genres.find(x => x.id === (book.genres || [])[0]);
        if (book.favorite) return 'Scelta della redazione';
        return g ? g.name : 'Recensione';
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
        const date = this.formatDateLRB(book.dateRead);
        return `
            <a href="libro.html?id=${book.id}" class="lrb-card" data-rating="${book.rating}">
                <div class="lrb-card-media">
                    <img src="${book.cover}" alt="Copertina di ${this.esc(book.title)}"
                         width="400" height="600" loading="lazy" decoding="async"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="lrb-card-placeholder" style="display:none;">
                        <span>${this.esc(book.title)}</span>
                    </div>
                </div>
                <div class="lrb-card-body">
                    <p class="lrb-kicker">${this.esc(this.lrbKicker(book, genres))}</p>
                    <h3 class="lrb-card-title">${this.esc(book.title)}</h3>
                    <p class="lrb-card-author">di ${this.esc(book.author)}</p>
                    ${date ? `<p class="lrb-card-date">${date}</p>` : ''}
                    <p class="lrb-card-excerpt">${this.esc(this.lrbExcerpt(book))}</p>
                    <p class="lrb-card-vote">Voto ${book.rating}/5 — ${this.ratingLabels[book.rating] || ''}</p>
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
        const date = this.formatDateLRB(book.dateRead);
        return `
            <div class="lrb-featured-grid">
                <div class="lrb-featured-text">
                    <p class="lrb-kicker">Latest</p>
                    <h2 class="lrb-featured-title">${this.esc(book.title)}</h2>
                    <p class="lrb-featured-author">di ${this.esc(book.author)}</p>
                    ${date ? `<p class="lrb-featured-date">${date}</p>` : ''}
                    <p class="lrb-featured-excerpt">${this.esc(this.lrbExcerpt(book, 220))}</p>
                    <a class="lrb-circle-btn" href="libro.html?id=${book.id}"
                       aria-label="Leggi la recensione di ${this.esc(book.title)}">&gt;</a>
                </div>
                <div class="lrb-featured-media">
                    <img src="${book.cover}" alt="Copertina di ${this.esc(book.title)}"
                         width="400" height="600" loading="lazy" decoding="async"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="lrb-card-placeholder" style="display:none;">
                        <span>${this.esc(book.title)}</span>
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
            <a href="libro.html?id=${book.id}" class="lrb-shelf-item" aria-label="${this.esc(book.title)} di ${this.esc(book.author)}">
                <span class="lrb-shelf-cover">
                    <img src="${book.cover}" alt="Copertina di ${this.esc(book.title)}"
                         width="400" height="600" loading="lazy" decoding="async"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="lrb-card-placeholder" style="display:none;">
                        <span>${this.esc((book.title || 'P').charAt(0))}</span>
                    </span>
                </span>
                <span class="lrb-shelf-title">${this.esc(book.title)}</span>
                <span class="lrb-shelf-author">${this.esc(book.author)}</span>
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
            <blockquote class="lrb-quote">
                <p class="lrb-quote-text">"${quote}"</p>
                <cite class="lrb-quote-source">${title} — ${author}</cite>
            </blockquote>
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
        if (book.rating) parts.push(`<span>Voto <strong>${book.rating}/5</strong></span>`);
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
