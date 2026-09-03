# 📚 Pagine e Parole - Blog di Recensioni Libri

Un blog elegante e professionale per recensioni di libri, costruito con HTML, CSS e JavaScript vanilla.

## ✨ Caratteristiche

- **Sistema JSON-based**: Tutti i contenuti sono gestiti tramite file JSON facilmente modificabili
- **Rating 1-5 stelle**: Sistema di valutazione visivo con etichette
- **Filtri avanzati**: Cerca per genere, voto, anno, titolo o autore
- **Responsive Design**: Ottimizzato per desktop, tablet e mobile
- **Copertine libri**: Supporto immagini con placeholder automatico
- **Citazioni preferite**: Sezione dedicata alle frasi più belle
- **Statistiche automatiche**: Conteggio libri, pagine, media voti
- **Copertine reali**: `assets/covers/` contiene le copertine (fonte demo: Open Library Covers API — sostituibili con le edizioni italiane)
- **Libri correlati**: in fondo a ogni scheda, fino a 3 libri dello stesso genere
- **Chip generi in home**: con conteggio, link a `recensioni.html?genere=<id>` (supportati anche `?voto=`, `?anno=`, `?cerca=`, `?ordina=`)
- **Contenuti demo**: 6 libri con `"demo": true` (1984, Dune, Piccolo Principe, Harry Potter 1, Twilight, After) — recensioni e voti da sostituire

## 📁 Struttura del Progetto

```
book_blog/
├── index.html          # Homepage
├── recensioni.html     # Catalogo recensioni con filtri
├── libreria.html       # Vista griglia copertine
├── chi-sono.html       # Pagina about
├── libro.html          # Singola recensione
├── css/
│   ├── base.css        # Variabili e stili base
│   ├── navigation.css  # Navbar
│   ├── components.css  # Componenti UI
│   └── pages.css       # Stili pagine
├── js/
│   ├── data-loader.js      # Caricamento JSON
│   ├── template-renderer.js # Rendering templates
│   ├── component-loader.js  # Componenti HTML
│   └── app.js              # Controller principale
├── data/
│   ├── site.json           # Configurazione sito
│   ├── personal.json       # Info blogger
│   ├── books.json          # Libri e recensioni
│   └── categories.json     # Generi letterari
├── components/
│   ├── navbar.html
│   └── footer.html
└── assets/
    ├── covers/         # Copertine libri
    └── images/         # Immagini profilo
```

## 🚀 Come Usare

### 1. Personalizzare le Informazioni

Modifica `data/personal.json` con i tuoi dati:
- Nome e ruolo
- Biografia
- Generi preferiti
- Obiettivo di lettura
- Link social

### 2. Aggiungere un Libro

Aggiungi un nuovo oggetto in `data/books.json`:

```json
{
  "id": "nome-libro",
  "title": "Titolo del Libro",
  "author": "Nome Autore",
  "cover": "assets/covers/nome-libro.jpg",
  "genres": ["narrativa-contemporanea", "giallo-thriller"],
  "year": 2023,
  "pages": 350,
  "publisher": "Editore",
  "dateRead": "2025-01",
  "rating": 4,
  "favorite": true,
  "review": "La tua recensione...",
  "quotes": ["Una citazione memorabile..."],
  "tags": ["tag1", "tag2"]
}
```

### 3. Aggiungere una Copertina

1. Salva l'immagine della copertina in `assets/covers/`
2. Usa il nome file nel campo `cover` del libro
3. Se l'immagine non è disponibile, viene mostrato un placeholder

### 4. Modificare il Libro del Mese

In `data/site.json`, modifica:

```json
"bookOfMonth": {
  "enabled": true,
  "bookId": "id-del-libro"
}
```

### 5. Generi Disponibili

I generi sono definiti in `data/categories.json`:
- narrativa-contemporanea
- giallo-thriller
- romanzo-storico
- classici
- saga-familiare
- fantasy
- biografia
- saggistica
- romanzo-formazione
- rosa-sentimentale

## 🎨 Personalizzazione Colori

Variabili CSS in `css/base.css` (edizione editoriale):

```css
:root {
    --paper: #FCFBF7;       /* Carta */
    --paper-warm: #F4EFE7;  /* Carta calda (citazione) */
    --ink: #1C1917;         /* Inchiostro */
    --ink-deep: #131110;    /* Stacco scuro (libro del mese) */
    --accent: #9A3412;      /* Terracotta (eyebrow) */
}
```

Sezioni home: hero (carta) → statistiche (fascia bianca) → ultime recensioni → libro del mese (**stacco scuro**, unico momento dark) → generi → citazione (calda) → contatti.

## 🧹 Sostituire i contenuti demo

1. In `data/books.json` elimina i 6 oggetti con `"demo": true` (o riscrivi recensione/voto e togli il flag)
2. Sostituisci i JPG in `assets/covers/` con le tue edizioni (stesso nome file = zero modifiche al JSON)
3. Il sito richiede `http://` (es. `python3 -m http.server`) perché i JSON sono caricati via `fetch`

## 📱 Hosting

Il sito è statico e può essere hostato su:
- GitHub Pages
- Netlify
- Vercel
- Qualsiasi hosting web

## 📝 Note

- Le immagini delle copertine sono placeholder - aggiungere le proprie
- L'immagine profilo va in `assets/images/profile.jpg`
- Il sito funziona completamente offline una volta caricati i file

---

Creato con ❤️ per gli amanti dei libri
