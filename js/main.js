// Configuration - Replace with your Google Sheets Published CSV URLs
const SHEETS_CONFIG = {
    malayalam: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=0&single=true&output=csv',
    tamil: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=647669946&single=true&output=csv',
    telugu: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=737507955&single=true&output=csv',
    kannada: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=718356028&single=true&output=csv',
    hindi: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=1047532705&single=true&output=csv',
    other: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=1162950769&single=true&output=csv'
};

// Global variables
let currentLanguage = '';
let allSongs = [];
let filteredSongs = [];
let currentPlayer = null;
let activeFilters = {};

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Get language class name for styling
function getLanguageClass(language) {
    if (!language) return '';
    return language.toLowerCase().replace(/\s+/g, '-');
}

// Fetch songs from Google Sheets CSV
async function fetchSongsFromSheet(sheetUrl) {
    try {
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const songs = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = parseCSVLine(lines[i]);
        const song = {};
        
        headers.forEach((header, index) => {
            song[header] = values[index] ? values[index].trim() : '';
        });
        
        // Add ALL songs, even without YouTube links
        if (song.song || song.title) {
            songs.push(song);
        }
    }
    
    return songs;
}

// Parse CSV line handling quoted commas
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    
    return values.map(v => v.replace(/^"|"$/g, ''));
}

// Get decade from year
function getDecade(year) {
    if (!year) return null;
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return null;
    return Math.floor(yearNum / 10) * 10;
}

// Display songs in grid
function displaySongs(songs) {
    const container = document.getElementById('songsGrid');
    if (!container) return;
    
    if (songs.length === 0) {
        container.innerHTML = '<div class="loading">No songs found</div>';
        return;
    }
    
    container.innerHTML = songs.map(song => createSongCard(song)).join('');
    
    // Add click handlers
    document.querySelectorAll('.song-card').forEach((card, index) => {
        card.addEventListener('click', () => playYouTubeVideo(songs[index]));
    });
    
    // Update stats
    updateStats(songs.length);
    updateActiveFiltersDisplay();
}

// Create song card HTML
function createSongCard(song) {
    const title = song.song || song.title || 'Untitled';
    const movie = song.movie || song.film || song.album || '';
    const year = song.year || '';
    const composer = song.composer || song['music director'] || song.music || '';
    const cosinger = song.cosinger || song['co-singer'] || song.singer || '';
    const genre = song.genre || song.category || '';
    const language = song.language || '';
    const type = song.type || '';
    const languageClass = getLanguageClass(language);
    const youtubeUrl = song.youtube || song['youtube link'] || song.link || '';
    const hasVideo = !!youtubeUrl;
    
    // Format co-singers nicely (split by comma and rejoin with proper spacing)
    let cosingerDisplay = cosinger;
    if (cosinger) {
        const singers = cosinger.split(',').map(s => s.trim()).filter(s => s.length > 0);
        cosingerDisplay = singers.join(', ');
    }
    
    return `
        <div class="song-card ${!hasVideo ? 'no-video' : ''}" data-genre="${genre}" data-type="${type}">
            <div class="song-thumbnail">
                ${hasVideo ? '🎵' : '🚫'}
                ${hasVideo ? '<div class="play-overlay"><div class="play-icon">▶</div></div>' : '<div class="no-video-overlay"><div class="no-video-text">No Video</div></div>'}
            </div>
            <div class="song-info">
                <h3>${title}</h3>
                ${language ? `<div class="language-badge ${languageClass}">${language}</div>` : ''}
                <div class="song-details">
                    ${type ? `<div class="song-detail"><strong>Type:</strong> ${type}</div>` : ''}
                    ${movie ? `<div class="song-detail"><strong>Movie:</strong> ${movie}</div>` : ''}
                    ${year ? `<div class="song-detail"><strong>Year:</strong> ${year}</div>` : ''}
                    ${composer ? `<div class="song-detail"><strong>Music:</strong> ${composer}</div>` : ''}
                    ${cosingerDisplay ? `<div class="song-detail"><strong>Co-Singer:</strong> ${cosingerDisplay}</div>` : ''}
                </div>
                ${genre ? `<div class="tags"><span class="tag">${genre}</span></div>` : ''}
            </div>
        </div>
    `;
}

// Play YouTube video in mini player
function playYouTubeVideo(song) {
    const youtubeUrl = song.youtube || song['youtube link'] || song.link || '';
    const videoId = getYouTubeVideoId(youtubeUrl);
    
    if (!videoId) {
        alert('YouTube video not available for this song');
        return;
    }
    
    const miniPlayer = document.getElementById('miniPlayer');
    const playerContainer = document.getElementById('playerContainer');
    const songTitle = document.getElementById('playerSongTitle');
    const songDetails = document.getElementById('playerSongDetails');
    
    const title = song.song || song.title || 'Untitled';
    const movie = song.movie || song.film || song.album || '';
    const cosinger = song.cosinger || song['co-singer'] || '';
    
    songTitle.textContent = title;
    songDetails.textContent = [movie, cosinger].filter(Boolean).join(' • ');
    
    // Create YouTube iframe that plays IN the page
    playerContainer.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
    
    // Show mini player
    miniPlayer.classList.remove('hidden');
    miniPlayer.classList.remove('minimized');
    
    // Scroll to player smoothly
    miniPlayer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        activeFilters.search = searchTerm;
        applyAllFilters();
    });
}

// Filter functionality
function setupFilters() {
    // Type filter
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyAllFilters);
    }
    
    // Language filter (for Other Languages page)
    const languageFilter = document.getElementById('languageFilter');
    if (languageFilter) {
        languageFilter.addEventListener('change', applyAllFilters);
    }
    
    // Genre filter
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
        genreFilter.addEventListener('change', applyAllFilters);
    }
    
    // Composer filter
    const composerFilter = document.getElementById('composerFilter');
    if (composerFilter) {
        composerFilter.addEventListener('change', applyAllFilters);
    }
    
    // Co-singer filter
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (cosingerFilter) {
        cosingerFilter.addEventListener('change', applyAllFilters);
    }
    
    // Decade filter
    const decadeFilter = document.getElementById('decadeFilter');
    if (decadeFilter) {
        decadeFilter.addEventListener('change', applyAllFilters);
    }
    
    // Year range inputs
    const yearFromInput = document.getElementById('yearFrom');
    const yearToInput = document.getElementById('yearTo');
    if (yearFromInput && yearToInput) {
        yearFromInput.addEventListener('input', applyAllFilters);
        yearToInput.addEventListener('input', applyAllFilters);
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Quick filter buttons
    setupQuickFilters();
}

// Setup quick filter buttons
function setupQuickFilters() {
    const quickFilters = document.querySelectorAll('.quick-filter-btn');
    quickFilters.forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            applyQuickFilter(filterType);
        });
    });
}

// Apply quick filters
function applyQuickFilter(filterType) {
    clearAllFilters();
    
    const currentYear = new Date().getFullYear();
    
    switch(filterType) {
        case 'recent':
            // Last 10 years
            document.getElementById('yearFrom').value = currentYear - 10;
            document.getElementById('yearTo').value = currentYear;
            break;
        case 'classic':
            // 1960-1990
            document.getElementById('yearFrom').value = 1960;
            document.getElementById('yearTo').value = 1990;
            break;
        case 'golden':
            // 1970-1985
            document.getElementById('yearFrom').value = 1970;
            document.getElementById('yearTo').value = 1985;
            break;
        case 'modern':
            // 1990-2010
            document.getElementById('yearFrom').value = 1990;
            document.getElementById('yearTo').value = 2010;
            break;
    }
    
    applyAllFilters();
}

// Apply all filters
function applyAllFilters() {
    let filtered = [...allSongs];
    
    // Search filter
    if (activeFilters.search) {
        const searchTerm = activeFilters.search;
        filtered = filtered.filter(song => {
            const searchFields = [
                song.song || '',
                song.title || '',
                song.movie || '',
                song.film || '',
                song.album || '',
                song.composer || '',
                song['music director'] || '',
                song.cosinger || '',
                song['co-singer'] || '',
                song.language || '',
                song.type || ''
            ].join(' ').toLowerCase();
            
            return searchFields.includes(searchTerm);
        });
    }
    
    // Type filter
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter && typeFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.type || '').toLowerCase() === typeFilter.value.toLowerCase()
        );
    }
    
    // Language filter
    const languageFilter = document.getElementById('languageFilter');
    if (languageFilter && languageFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.language || '').toLowerCase() === languageFilter.value.toLowerCase()
        );
    }
    
    // Genre filter
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter && genreFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.genre || '').toLowerCase() === genreFilter.value.toLowerCase()
        );
    }
    
    // Composer filter
    const composerFilter = document.getElementById('composerFilter');
    if (composerFilter && composerFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.composer || song['music director'] || '').toLowerCase() === composerFilter.value.toLowerCase()
        );
    }
    
    // ========== UPDATED: Co-singer filter - splits comma-separated values ==========
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (cosingerFilter && cosingerFilter.value !== 'all') {
        const selectedSinger = cosingerFilter.value.toLowerCase();
        filtered = filtered.filter(song => {
            const cosinger = song.cosinger || song['co-singer'] || '';
            if (!cosinger) return false;
            
            // Split by comma and check if selected singer is in the list
            const singers = cosinger.split(',').map(s => s.trim().toLowerCase());
            return singers.includes(selectedSinger);
        });
    }
    // ========== END UPDATED CODE ==========
    
    // Decade filter
    const decadeFilter = document.getElementById('decadeFilter');
    if (decadeFilter && decadeFilter.value !== 'all') {
        const decade = parseInt(decadeFilter.value);
        filtered = filtered.filter(song => {
            const songDecade = getDecade(song.year);
            return songDecade === decade;
        });
    }
    
    // Year range filter
    const yearFrom = document.getElementById('yearFrom');
    const yearTo = document.getElementById('yearTo');
    if (yearFrom && yearTo) {
        const fromYear = parseInt(yearFrom.value) || 0;
        const toYear = parseInt(yearTo.value) || 9999;
        
        if (fromYear > 0 || toYear < 9999) {
            filtered = filtered.filter(song => {
                const songYear = parseInt(song.year);
                if (isNaN(songYear)) return false;
                return songYear >= fromYear && songYear <= toYear;
            });
        }
    }
    
    filteredSongs = filtered;
    displaySongs(filtered);
}

// Clear all filters
function clearAllFilters() {
    // Clear dropdowns
    const selects = document.querySelectorAll('.filter-select');
    selects.forEach(select => select.value = 'all');
    
    // Clear year inputs
    const yearFrom = document.getElementById('yearFrom');
    const yearTo = document.getElementById('yearTo');
    if (yearFrom) yearFrom.value = '';
    if (yearTo) yearTo.value = '';
    
    // Clear search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // Clear active filters
    activeFilters = {};
    
    // Reset display
    filteredSongs = allSongs;
    displaySongs(allSongs);
}

// Update active filters display
function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    
    const filters = [];
    
    // Check each filter
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter && typeFilter.value !== 'all') {
        filters.push({ label: 'Type', value: typeFilter.options[typeFilter.selectedIndex].text });
    }
    
    const languageFilter = document.getElementById('languageFilter');
    if (languageFilter && languageFilter.value !== 'all') {
        filters.push({ label: 'Language', value: languageFilter.options[languageFilter.selectedIndex].text });
    }
    
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter && genreFilter.value !== 'all') {
        filters.push({ label: 'Genre', value: genreFilter.options[genreFilter.selectedIndex].text });
    }
    
    const composerFilter = document.getElementById('composerFilter');
    if (composerFilter && composerFilter.value !== 'all') {
        filters.push({ label: 'Composer', value: composerFilter.options[composerFilter.selectedIndex].text });
    }
    
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (cosingerFilter && cosingerFilter.value !== 'all') {
        filters.push({ label: 'Co-Singer', value: cosingerFilter.options[cosingerFilter.selectedIndex].text });
    }
    
    const decadeFilter = document.getElementById('decadeFilter');
    if (decadeFilter && decadeFilter.value !== 'all') {
        filters.push({ label: 'Decade', value: decadeFilter.options[decadeFilter.selectedIndex].text });
    }
    
    const yearFrom = document.getElementById('yearFrom');
    const yearTo = document.getElementById('yearTo');
    if (yearFrom && yearTo && (yearFrom.value || yearTo.value)) {
        const from = yearFrom.value || '?';
        const to = yearTo.value || '?';
        filters.push({ label: 'Year Range', value: `${from} - ${to}` });
    }
    
    if (filters.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = filters.map(f => 
        `<span class="active-filter">${f.label}: ${f.value}</span>`
    ).join('');
}

// Populate filter dropdowns
function populateFilters(songs) {
    populateTypeFilter(songs);
    populateLanguageFilter(songs);
    populateGenreFilter(songs);
    populateComposerFilter(songs);
    populateCosingerFilter(songs);
    populateDecadeFilter(songs);
}

function populateTypeFilter(songs) {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) return;
    
    const types = [...new Set(songs.map(s => s.type).filter(Boolean))];
    types.sort();
    
    typeFilter.innerHTML = '<option value="all">All Types</option>' + 
        types.map(t => `<option value="${t}">${t}</option>`).join('');
}

function populateLanguageFilter(songs) {
    const languageFilter = document.getElementById('languageFilter');
    if (!languageFilter) return;
    
    const languages = [...new Set(songs.map(s => s.language).filter(Boolean))];
    languages.sort();
    
    languageFilter.innerHTML = '<option value="all">All Languages</option>' + 
        languages.map(l => `<option value="${l}">${l}</option>`).join('');
}

function populateGenreFilter(songs) {
    const genreFilter = document.getElementById('genreFilter');
    if (!genreFilter) return;
    
    const genres = [...new Set(songs.map(s => s.genre || s.category).filter(Boolean))];
    genres.sort();
    
    genreFilter.innerHTML = '<option value="all">All Genres</option>' + 
        genres.map(g => `<option value="${g}">${g}</option>`).join('');
}

function populateComposerFilter(songs) {
    const composerFilter = document.getElementById('composerFilter');
    if (!composerFilter) return;
    
    const composers = [...new Set(songs.map(s => s.composer || s['music director']).filter(Boolean))];
    composers.sort();
    
    composerFilter.innerHTML = '<option value="all">All Composers</option>' + 
        composers.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ========== UPDATED: populateCosingerFilter - splits comma-separated values ==========
function populateCosingerFilter(songs) {
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (!cosingerFilter) return;
    
    // Collect all individual co-singers by splitting comma-separated values
    const cosingersSet = new Set();
    
    songs.forEach(song => {
        const cosinger = song.cosinger || song['co-singer'] || '';
        if (cosinger) {
            // Split by comma, trim whitespace, and add each singer individually
            const singers = cosinger.split(',').map(s => s.trim()).filter(s => s.length > 0);
            singers.forEach(singer => cosingersSet.add(singer));
        }
    });
    
    // Convert to array and sort alphabetically
    const cosingers = [...cosingersSet].sort();
    
    cosingerFilter.innerHTML = '<option value="all">All Co-Singers</option>' + 
        cosingers.map(c => `<option value="${c}">${c}</option>`).join('');
}
// ========== END UPDATED CODE ==========

function populateDecadeFilter(songs) {
    const decadeFilter = document.getElementById('decadeFilter');
    if (!decadeFilter) return;
    
    const decades = [...new Set(songs.map(s => getDecade(s.year)).filter(d => d !== null))];
    decades.sort((a, b) => a - b);
    
    decadeFilter.innerHTML = '<option value="all">All Decades</option>' + 
        decades.map(d => `<option value="${d}">${d}s</option>`).join('');
}

// Update stats display
function updateStats(count) {
    const statsDisplay = document.getElementById('statsDisplay');
    if (statsDisplay) {
        statsDisplay.textContent = `Showing ${count} of ${allSongs.length} songs`;
    }
}

// Mini player controls
function setupMiniPlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    const minimizeBtn = document.getElementById('minimizePlayer');
    const closeBtn = document.getElementById('closePlayer');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            miniPlayer.classList.toggle('minimized');
            minimizeBtn.textContent = miniPlayer.classList.contains('minimized') ? '▲' : '▼';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            miniPlayer.classList.add('hidden');
            const playerContainer = document.getElementById('playerContainer');
            playerContainer.innerHTML = '';
        });
    }
}

// Initialize page
async function initializePage() {
    // Determine current language from page
    const path = window.location.pathname;
    currentLanguage = path.split('/').pop().replace('.html', '');
    
    // Setup mini player
    setupMiniPlayer();
    
    // If on a language page, load songs
    if (SHEETS_CONFIG[currentLanguage]) {
        const container = document.getElementById('songsGrid');
        if (container) {
            container.innerHTML = '<div class="loading">Loading songs</div>';
            
            // Fetch songs
            allSongs = await fetchSongsFromSheet(SHEETS_CONFIG[currentLanguage]);
            filteredSongs = allSongs;
            
            // Display songs
            displaySongs(allSongs);
            
            // Setup search and filters
            setupSearch();
            setupFilters();
            populateFilters(allSongs);
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializePage);
