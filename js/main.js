// Configuration - Replace with your Google Sheets Published CSV URLs
const SHEETS_CONFIG = {
    malayalam: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=0&single=true&output=csv',
    tamil: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=647669946&single=true&output=csv',
    telugu: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=737507955&single=true&output=csv',
    kannada: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=718356028&single=true&output=csv',
    hindi: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=1047532705&single=true&output=csv'
};

// Global variables
let currentLanguage = '';
let allSongs = [];
let filteredSongs = [];
let currentPlayer = null;

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
        
        // MODIFICATION 1: Add ALL songs, even without YouTube links
        if (song.song || song.title) {  // Only need a song title to add it
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
}

// Create song card HTML
function createSongCard(song) {
    const title = song.song || song.title || 'Untitled';
    const movie = song.movie || song.film || song.album || '';
    const year = song.year || '';
    const composer = song.composer || song['music director'] || song.music || '';
    const cosinger = song.cosinger || song['co-singer'] || song.singer || '';
    const genre = song.genre || song.category || '';
    const youtubeUrl = song.youtube || song['youtube link'] || song.link || '';
    const hasVideo = !!youtubeUrl;
    
    return `
        <div class="song-card ${!hasVideo ? 'no-video' : ''}" data-genre="${genre}">
            <div class="song-thumbnail">
                ${hasVideo ? '🎵' : '🚫'}
                ${hasVideo ? '<div class="play-overlay"><div class="play-icon">▶</div></div>' : '<div class="no-video-overlay"><div class="no-video-text">No Video</div></div>'}
            </div>
            <div class="song-info">
                <h3>${title}</h3>
                <div class="song-details">
                    ${movie ? `<div class="song-detail"><strong>Movie:</strong> ${movie}</div>` : ''}
                    ${year ? `<div class="song-detail"><strong>Year:</strong> ${year}</div>` : ''}
                    ${composer ? `<div class="song-detail"><strong>Music:</strong> ${composer}</div>` : ''}
                    ${cosinger ? `<div class="song-detail"><strong>Co-Singer:</strong> ${cosinger}</div>` : ''}
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
    
    // MODIFICATION 3: Create YouTube iframe that plays IN the page (not opening new page)
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
        
        const filtered = allSongs.filter(song => {
            const searchFields = [
                song.song || '',
                song.title || '',
                song.movie || '',
                song.film || '',
                song.album || '',
                song.composer || '',
                song['music director'] || '',
                song.cosinger || '',
                song['co-singer'] || ''
            ].join(' ').toLowerCase();
            
            return searchFields.includes(searchTerm);
        });
        
        filteredSongs = filtered;
        displaySongs(filtered);
    });
}

// Filter functionality
function setupFilters() {
    // Genre filter
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
        genreFilter.addEventListener('change', applyFilters);
    }
    
    // Composer filter
    const composerFilter = document.getElementById('composerFilter');
    if (composerFilter) {
        composerFilter.addEventListener('change', applyFilters);
    }
    
    // Co-singer filter
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (cosingerFilter) {
        cosingerFilter.addEventListener('change', applyFilters);
    }
}

// Apply all filters
function applyFilters() {
    let filtered = [...allSongs];
    
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter && genreFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.genre || '').toLowerCase() === genreFilter.value.toLowerCase()
        );
    }
    
    const composerFilter = document.getElementById('composerFilter');
    if (composerFilter && composerFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.composer || song['music director'] || '').toLowerCase() === composerFilter.value.toLowerCase()
        );
    }
    
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (cosingerFilter && cosingerFilter.value !== 'all') {
        filtered = filtered.filter(song => 
            (song.cosinger || song['co-singer'] || '').toLowerCase().includes(cosingerFilter.value.toLowerCase())
        );
    }
    
    filteredSongs = filtered;
    displaySongs(filtered);
}

// Populate filter dropdowns
function populateFilters(songs) {
    populateGenreFilter(songs);
    populateComposerFilter(songs);
    populateCosingerFilter(songs);
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

function populateCosingerFilter(songs) {
    const cosingerFilter = document.getElementById('cosingerFilter');
    if (!cosingerFilter) return;
    
    const cosingers = [...new Set(songs.map(s => s.cosinger || s['co-singer']).filter(Boolean))];
    cosingers.sort();
    
    cosingerFilter.innerHTML = '<option value="all">All Co-Singers</option>' + 
        cosingers.map(c => `<option value="${c}">${c}</option>`).join('');
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
