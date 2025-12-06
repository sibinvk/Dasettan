// Phase 3: Favorites & Playlists System
// Uses localStorage for data persistence

// Storage keys
const STORAGE_KEYS = {
    FAVORITES: 'yesudas_favorites',
    PLAYLISTS: 'yesudas_playlists',
    RECENT: 'yesudas_recent_played'
};

// Global state
let favorites = [];
let playlists = [];
let recentPlayed = [];
let currentPlaylist = null;
let currentSongForAction = null;

// Initialize
function initializeFavorites() {
    loadFromStorage();
    setupTabs();
    setupModals();
    renderAllTabs();
    updateCounts();
}

// Load data from localStorage
function loadFromStorage() {
    favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
    playlists = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYLISTS) || '[]');
    recentPlayed = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT) || '[]');
}

// Save data to localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentPlayed));
}

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Switch tabs
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Render all tabs
function renderAllTabs() {
    renderFavorites();
    renderPlaylists();
    renderRecent();
}

// Render favorites
function renderFavorites() {
    const container = document.querySelector('#favoritesSongs .songs-grid');
    const emptyState = document.getElementById('emptyFavorites');
    
    if (favorites.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = favorites.map(song => createSongCard(song, 'favorite')).join('');
    attachSongHandlers();
}

// Render playlists
function renderPlaylists() {
    const container = document.getElementById('playlistsList');
    const emptyState = document.getElementById('emptyPlaylists');
    
    if (playlists.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = playlists.map(playlist => createPlaylistCard(playlist)).join('');
    attachPlaylistHandlers();
}

// Render recent
function renderRecent() {
    const container = document.querySelector('#recentSongs .songs-grid');
    const emptyState = document.getElementById('emptyRecent');
    
    if (recentPlayed.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = recentPlayed.map(song => createSongCard(song, 'recent')).join('');
    attachSongHandlers();
}

// Create song card
function createSongCard(song, context = '') {
    const youtubeUrl = song.youtube || song.youtubeLink || song.link || '';
    const hasVideo = !!youtubeUrl;
    
    return `
        <div class="song-card ${!hasVideo ? 'no-video' : ''}" data-song-id="${song.id || ''}">
            <div class="song-thumbnail">
                ${hasVideo ? '🎵' : '🚫'}
                ${hasVideo ? '<div class="play-overlay"><div class="play-icon">▶</div></div>' : '<div class="no-video-overlay"><div class="no-video-text">No Video</div></div>'}
            </div>
            <div class="song-info">
                <h3>${song.title}</h3>
                ${song.language ? `<div class="language-badge ${song.language.toLowerCase()}">${song.language}</div>` : ''}
                <div class="song-details">
                    ${song.movie ? `<div class="song-detail"><strong>Movie:</strong> ${song.movie}</div>` : ''}
                    ${song.year ? `<div class="song-detail"><strong>Year:</strong> ${song.year}</div>` : ''}
                    ${song.composer ? `<div class="song-detail"><strong>Music:</strong> ${song.composer}</div>` : ''}
                </div>
                <div class="song-actions">
                    ${context !== 'favorite' ? '<button class="icon-btn favorite-btn" title="Add to Favorites">⭐</button>' : '<button class="icon-btn unfavorite-btn" title="Remove from Favorites">💔</button>'}
                    <button class="icon-btn playlist-btn" title="Add to Playlist">➕</button>
                    <button class="icon-btn share-btn" title="Share">📤</button>
                    ${context === 'favorite' || context === 'playlist' ? '<button class="icon-btn remove-btn" title="Remove">🗑️</button>' : ''}
                </div>
            </div>
        </div>
    `;
}

// Create playlist card
function createPlaylistCard(playlist) {
    return `
        <div class="playlist-card" data-playlist-id="${playlist.id}">
            <div class="playlist-icon">${playlist.icon}</div>
            <h3>${playlist.name}</h3>
            <p class="playlist-song-count">${playlist.songs.length} songs</p>
            ${playlist.description ? `<p class="playlist-description">${playlist.description}</p>` : ''}
            <button class="action-btn secondary-btn view-playlist-btn">View Playlist</button>
        </div>
    `;
}

// Attach song handlers
function attachSongHandlers() {
    // Play handlers
    document.querySelectorAll('.song-card').forEach(card => {
        const playOverlay = card.querySelector('.play-overlay, .no-video-overlay');
        if (playOverlay) {
            playOverlay.addEventListener('click', (e) => {
                e.stopPropagation();
                const songData = getSongFromCard(card);
                playSong(songData);
            });
        }
    });
    
    // Favorite handlers
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.song-card');
            const songData = getSongFromCard(card);
            addToFavorites(songData);
        });
    });
    
    // Unfavorite handlers
    document.querySelectorAll('.unfavorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.song-card');
            const songData = getSongFromCard(card);
            removeFromFavorites(songData);
        });
    });
    
    // Playlist handlers
    document.querySelectorAll('.playlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.song-card');
            const songData = getSongFromCard(card);
            showAddToPlaylistModal(songData);
        });
    });
    
    // Share handlers
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.song-card');
            const songData = getSongFromCard(card);
            showShareModal(songData);
        });
    });
    
    // Remove handlers
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.song-card');
            const songData = getSongFromCard(card);
            
            // Determine context and remove accordingly
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (activeTab === 'favorites') {
                removeFromFavorites(songData);
            } else if (activeTab === 'recent') {
                removeFromRecent(songData);
            }
        });
    });
}

// Attach playlist handlers
function attachPlaylistHandlers() {
    document.querySelectorAll('.view-playlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.playlist-card');
            const playlistId = card.dataset.playlistId;
            const playlist = playlists.find(p => p.id === playlistId);
            if (playlist) {
                showPlaylistModal(playlist);
            }
        });
    });
}

// Get song data from card
function getSongFromCard(card) {
    const title = card.querySelector('h3').textContent;
    const movieEl = card.querySelector('.song-detail:has(strong:contains("Movie"))');
    const yearEl = card.querySelector('.song-detail:has(strong:contains("Year"))');
    const composerEl = card.querySelector('.song-detail:has(strong:contains("Music"))');
    const languageBadge = card.querySelector('.language-badge');
    
    return {
        id: card.dataset.songId || Date.now().toString(),
        title: title,
        movie: movieEl ? movieEl.textContent.replace('Movie:', '').trim() : '',
        year: yearEl ? yearEl.textContent.replace('Year:', '').trim() : '',
        composer: composerEl ? composerEl.textContent.replace('Music:', '').trim() : '',
        language: languageBadge ? languageBadge.textContent : '',
        youtube: '', // Would need to be passed from original data
        addedDate: new Date().toISOString()
    };
}

// Add to favorites
function addToFavorites(song) {
    if (!favorites.find(s => s.title === song.title && s.movie === song.movie)) {
        favorites.unshift(song);
        saveToStorage();
        updateCounts();
        showToast('⭐ Added to favorites!');
        
        // If on favorites tab, re-render
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        if (activeTab === 'favorites') {
            renderFavorites();
        }
    } else {
        showToast('Already in favorites');
    }
}

// Remove from favorites
function removeFromFavorites(song) {
    favorites = favorites.filter(s => !(s.title === song.title && s.movie === song.movie));
    saveToStorage();
    updateCounts();
    renderFavorites();
    showToast('💔 Removed from favorites');
}

// Add to recent
function addToRecent(song) {
    // Remove if already exists
    recentPlayed = recentPlayed.filter(s => !(s.title === song.title && s.movie === song.movie));
    
    // Add to beginning
    recentPlayed.unshift({
        ...song,
        playedAt: new Date().toISOString()
    });
    
    // Keep only last 50
    if (recentPlayed.length > 50) {
        recentPlayed = recentPlayed.slice(0, 50);
    }
    
    saveToStorage();
    updateCounts();
}

// Remove from recent
function removeFromRecent(song) {
    recentPlayed = recentPlayed.filter(s => !(s.title === song.title && s.movie === song.movie));
    saveToStorage();
    updateCounts();
    renderRecent();
    showToast('🗑️ Removed from history');
}

// Play song
function playSong(song) {
    addToRecent(song);
    showToast('▶️ Playing song...');
    // Mini player logic would go here
}

// Setup modals
function setupModals() {
    // Create playlist
    document.getElementById('createPlaylist').addEventListener('click', () => {
        showModal('createPlaylistModal');
    });
    
    // Icon picker
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('selectedIcon').value = this.dataset.icon;
        });
    });
    
    // Save playlist
    document.getElementById('savePlaylist').addEventListener('click', createNewPlaylist);
    
    // Cancel playlist
    document.getElementById('cancelPlaylist').addEventListener('click', () => {
        hideModal('createPlaylistModal');
        clearPlaylistForm();
    });
    
    // Clear favorites
    document.getElementById('clearFavorites').addEventListener('click', clearAllFavorites);
    
    // Clear recent
    document.getElementById('clearRecent').addEventListener('click', clearAllRecent);
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this.id);
            }
        });
    });
}

// Create new playlist
function createNewPlaylist() {
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    const icon = document.getElementById('selectedIcon').value;
    
    if (!name) {
        showToast('Please enter a playlist name');
        return;
    }
    
    const newPlaylist = {
        id: Date.now().toString(),
        name: name,
        description: description,
        icon: icon,
        songs: [],
        createdAt: new Date().toISOString()
    };
    
    playlists.push(newPlaylist);
    saveToStorage();
    updateCounts();
    renderPlaylists();
    hideModal('createPlaylistModal');
    clearPlaylistForm();
    showToast(`📝 Playlist "${name}" created!`);
}

// Clear playlist form
function clearPlaylistForm() {
    document.getElementById('playlistName').value = '';
    document.getElementById('playlistDescription').value = '';
    document.getElementById('selectedIcon').value = '🎵';
    document.querySelectorAll('.icon-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector('.icon-btn[data-icon="🎵"]').classList.add('selected');
}

// Show add to playlist modal
function showAddToPlaylistModal(song) {
    currentSongForAction = song;
    const container = document.getElementById('playlistsSelection');
    
    if (playlists.length === 0) {
        container.innerHTML = '<p class="empty-message">No playlists yet. Create one first!</p>';
    } else {
        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-option" data-playlist-id="${playlist.id}">
                <span class="playlist-icon">${playlist.icon}</span>
                <span class="playlist-name">${playlist.name}</span>
                <span class="playlist-count">(${playlist.songs.length} songs)</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.playlist-option').forEach(option => {
            option.addEventListener('click', function() {
                const playlistId = this.dataset.playlistId;
                addSongToPlaylist(currentSongForAction, playlistId);
                hideModal('addToPlaylistModal');
            });
        });
    }
    
    showModal('addToPlaylistModal');
}

// Add song to playlist
function addSongToPlaylist(song, playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    if (!playlist.songs.find(s => s.title === song.title && s.movie === song.movie)) {
        playlist.songs.push(song);
        saveToStorage();
        renderPlaylists();
        showToast(`➕ Added to "${playlist.name}"`);
    } else {
        showToast('Song already in playlist');
    }
}

// Show playlist modal
function showPlaylistModal(playlist) {
    currentPlaylist = playlist;
    document.getElementById('playlistTitle').textContent = `${playlist.icon} ${playlist.name}`;
    document.getElementById('playlistDesc').textContent = playlist.description || '';
    
    const container = document.querySelector('#playlistSongsContainer .songs-grid');
    const emptyState = document.getElementById('emptyPlaylistSongs');
    
    if (playlist.songs.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = playlist.songs.map(song => createSongCard(song, 'playlist')).join('');
        attachSongHandlers();
    }
    
    // Delete playlist handler
    document.getElementById('deletePlaylist').onclick = () => {
        if (confirm(`Delete playlist "${playlist.name}"?`)) {
            deletePlaylist(playlist.id);
            hideModal('viewPlaylistModal');
        }
    };
    
    showModal('viewPlaylistModal');
}

// Delete playlist
function deletePlaylist(playlistId) {
    playlists = playlists.filter(p => p.id !== playlistId);
    saveToStorage();
    updateCounts();
    renderPlaylists();
    showToast('🗑️ Playlist deleted');
}

// Show share modal
function showShareModal(song) {
    const detailsContainer = document.getElementById('shareSongDetails');
    detailsContainer.innerHTML = `
        <h3>${song.title}</h3>
        <p>${song.movie ? `Movie: ${song.movie}` : ''}</p>
    `;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?song=${encodeURIComponent(song.title)}`;
    document.getElementById('shareLink').value = shareUrl;
    
    // Copy link
    document.getElementById('copyLink').onclick = () => {
        navigator.clipboard.writeText(shareUrl);
        showToast('📋 Link copied!');
    };
    
    // WhatsApp share
    document.getElementById('shareWhatsApp').onclick = () => {
        const text = `Check out "${song.title}" by K.J. Yesudas! ${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };
    
    // Facebook share
    document.getElementById('shareFacebook').onclick = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    };
    
    // Twitter share
    document.getElementById('shareTwitter').onclick = () => {
        const text = `Listening to "${song.title}" by K.J. Yesudas`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    };
    
    showModal('shareModal');
}

// Clear all favorites
function clearAllFavorites() {
    if (confirm('Clear all favorites? This cannot be undone.')) {
        favorites = [];
        saveToStorage();
        updateCounts();
        renderFavorites();
        showToast('🗑️ All favorites cleared');
    }
}

// Clear all recent
function clearAllRecent() {
    if (confirm('Clear play history? This cannot be undone.')) {
        recentPlayed = [];
        saveToStorage();
        updateCounts();
        renderRecent();
        showToast('🗑️ History cleared');
    }
}

// Update counts
function updateCounts() {
    document.getElementById('favoritesCount').textContent = favorites.length;
    document.getElementById('playlistsCount').textContent = playlists.length;
    document.getElementById('recentCount').textContent = recentPlayed.length;
}

// Show modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Hide modal
function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Show toast notification
function showToast(message) {
    // Create toast if doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeFavorites);

// Export functions for use in other pages
window.YesudasFavorites = {
    addToFavorites,
    removeFromFavorites,
    addToRecent,
    isFavorite: (song) => favorites.some(s => s.title === song.title && s.movie === song.movie),
    getPlaylists: () => playlists,
    addSongToPlaylist
};
