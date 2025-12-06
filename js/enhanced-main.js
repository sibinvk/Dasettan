// Phase 5: Enhanced Audio/Video Features
// Adds queue, shuffle, repeat, autoplay, volume control, mini player enhancements

// Global player state
let playerState = {
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isShuffled: false,
    repeatMode: 'none', // 'none', 'one', 'all'
    volume: 100,
    autoplay: true,
    currentSong: null
};

// Enhanced playYouTubeVideo with queue support
function playYouTubeVideo(song, addToQueue = false) {
    const youtubeUrl = song.youtube || song['youtube link'] || song.link || '';
    const videoId = getYouTubeVideoId(youtubeUrl);
    
    if (!videoId) {
        showNotification('YouTube video not available for this song', 'error');
        return;
    }
    
    // Add to recently played
    if (window.YesudasFavorites) {
        window.YesudasFavorites.addToRecent(song);
    }
    
    // Update player state
    playerState.currentSong = song;
    playerState.isPlaying = true;
    
    // Update mini player UI
    const miniPlayer = document.getElementById('miniPlayer');
    const playerContainer = document.getElementById('playerContainer');
    const songTitle = document.getElementById('playerSongTitle');
    const songDetails = document.getElementById('playerSongDetails');
    
    const title = song.song || song.title || 'Untitled';
    const movie = song.movie || song.film || song.album || '';
    const cosinger = song.cosinger || song['co-singer'] || '';
    
    songTitle.textContent = title;
    songDetails.textContent = [movie, cosinger].filter(Boolean).join(' • ');
    
    // Create YouTube iframe with API
    playerContainer.innerHTML = `
        <iframe
            id="youtubePlayer"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
    
    // Show mini player
    miniPlayer.classList.remove('hidden');
    miniPlayer.classList.remove('minimized');
    
    // Update play/pause button
    updatePlayPauseButton();
    
    // Add to queue if requested
    if (addToQueue) {
        addToQueue(song);
    }
    
    showNotification(`▶️ Now playing: ${title}`, 'success');
}

// Queue Management
function addToQueue(song) {
    playerState.queue.push(song);
    updateQueueDisplay();
    showNotification('Added to queue', 'success');
}

function removeFromQueue(index) {
    playerState.queue.splice(index, 1);
    if (playerState.currentIndex >= index && playerState.currentIndex > 0) {
        playerState.currentIndex--;
    }
    updateQueueDisplay();
}

function clearQueue() {
    playerState.queue = [];
    playerState.currentIndex = -1;
    updateQueueDisplay();
    showNotification('Queue cleared', 'info');
}

function playNext() {
    if (playerState.queue.length === 0) return;
    
    if (playerState.repeatMode === 'one') {
        // Replay current song
        if (playerState.currentSong) {
            playYouTubeVideo(playerState.currentSong);
        }
        return;
    }
    
    playerState.currentIndex++;
    
    if (playerState.currentIndex >= playerState.queue.length) {
        if (playerState.repeatMode === 'all') {
            playerState.currentIndex = 0;
        } else {
            showNotification('Queue finished', 'info');
            return;
        }
    }
    
    playYouTubeVideo(playerState.queue[playerState.currentIndex]);
}

function playPrevious() {
    if (playerState.queue.length === 0) return;
    
    playerState.currentIndex--;
    
    if (playerState.currentIndex < 0) {
        if (playerState.repeatMode === 'all') {
            playerState.currentIndex = playerState.queue.length - 1;
        } else {
            playerState.currentIndex = 0;
            return;
        }
    }
    
    playYouTubeVideo(playerState.queue[playerState.currentIndex]);
}

function shuffleQueue() {
    if (playerState.queue.length <= 1) return;
    
    playerState.isShuffled = !playerState.isShuffled;
    
    if (playerState.isShuffled) {
        // Fisher-Yates shuffle
        const currentSong = playerState.queue[playerState.currentIndex];
        const shuffled = [...playerState.queue];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        playerState.queue = shuffled;
        playerState.currentIndex = shuffled.indexOf(currentSong);
        
        showNotification('🔀 Shuffle ON', 'success');
    } else {
        showNotification('🔀 Shuffle OFF', 'info');
    }
    
    updateQueueDisplay();
    updateShuffleButton();
}

function toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(playerState.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    playerState.repeatMode = modes[nextIndex];
    
    const messages = {
        'none': '🔁 Repeat OFF',
        'all': '🔁 Repeat ALL',
        'one': '🔂 Repeat ONE'
    };
    
    showNotification(messages[playerState.repeatMode], 'info');
    updateRepeatButton();
}

// UI Update Functions
function updateQueueDisplay() {
    const queueContainer = document.getElementById('queueList');
    if (!queueContainer) return;
    
    if (playerState.queue.length === 0) {
        queueContainer.innerHTML = '<div class="empty-queue">Queue is empty. Add songs to play next!</div>';
        return;
    }
    
    queueContainer.innerHTML = playerState.queue.map((song, index) => `
        <div class="queue-item ${index === playerState.currentIndex ? 'current' : ''}" data-index="${index}">
            <div class="queue-number">${index + 1}</div>
            <div class="queue-info">
                <div class="queue-title">${song.song || song.title}</div>
                <div class="queue-details">${song.movie || ''}</div>
            </div>
            <div class="queue-actions">
                <button class="queue-play-btn" onclick="playFromQueue(${index})">▶</button>
                <button class="queue-remove-btn" onclick="removeFromQueue(${index})">✕</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('queueCount').textContent = playerState.queue.length;
}

function playFromQueue(index) {
    playerState.currentIndex = index;
    playYouTubeVideo(playerState.queue[index]);
}

function updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    if (btn) {
        btn.textContent = playerState.isPlaying ? '⏸️' : '▶️';
    }
}

function updateShuffleButton() {
    const btn = document.getElementById('shuffleBtn');
    if (btn) {
        btn.classList.toggle('active', playerState.isShuffled);
    }
}

function updateRepeatButton() {
    const btn = document.getElementById('repeatBtn');
    if (btn) {
        btn.classList.remove('repeat-none', 'repeat-all', 'repeat-one');
        btn.classList.add(`repeat-${playerState.repeatMode}`);
        
        const icons = {
            'none': '🔁',
            'all': '🔁',
            'one': '🔂'
        };
        btn.textContent = icons[playerState.repeatMode];
    }
}

function updateVolumeDisplay() {
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) {
        volumeValue.textContent = `${playerState.volume}%`;
    }
}

// Volume Control
function setVolume(volume) {
    playerState.volume = Math.max(0, Math.min(100, volume));
    updateVolumeDisplay();
    
    // Apply to YouTube player if available
    const iframe = document.getElementById('youtubePlayer');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [playerState.volume]
        }), '*');
    }
}

function toggleMute() {
    if (playerState.volume > 0) {
        playerState.previousVolume = playerState.volume;
        setVolume(0);
    } else {
        setVolume(playerState.previousVolume || 50);
    }
}

// Enhanced Song Actions
function addSongActions() {
    // Add queue button to all song cards
    document.querySelectorAll('.song-card').forEach(card => {
        if (!card.querySelector('.add-to-queue-btn')) {
            const actionsDiv = card.querySelector('.song-actions') || createActionsDiv(card);
            
            const queueBtn = document.createElement('button');
            queueBtn.className = 'icon-btn add-to-queue-btn';
            queueBtn.title = 'Add to Queue';
            queueBtn.innerHTML = '➕🎵';
            queueBtn.onclick = (e) => {
                e.stopPropagation();
                const songData = getSongFromCard(card);
                addToQueue(songData);
            };
            
            actionsDiv.appendChild(queueBtn);
        }
    });
}

function createActionsDiv(card) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'song-actions';
    card.querySelector('.song-info').appendChild(actionsDiv);
    return actionsDiv;
}

// Setup Enhanced Player
function setupEnhancedPlayer() {
    // Play/Pause
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            playerState.isPlaying = !playerState.isPlaying;
            updatePlayPauseButton();
            // YouTube API control would go here
        });
    }
    
    // Previous
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', playPrevious);
    }
    
    // Next
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', playNext);
    }
    
    // Shuffle
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', shuffleQueue);
    }
    
    // Repeat
    const repeatBtn = document.getElementById('repeatBtn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', toggleRepeat);
    }
    
    // Volume
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            setVolume(parseInt(e.target.value));
        });
    }
    
    // Mute
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.addEventListener('click', toggleMute);
    }
    
    // Clear Queue
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    if (clearQueueBtn) {
        clearQueueBtn.addEventListener('click', () => {
            if (confirm('Clear entire queue?')) {
                clearQueue();
            }
        });
    }
    
    // Toggle Queue Panel
    const toggleQueueBtn = document.getElementById('toggleQueueBtn');
    const queuePanel = document.getElementById('queuePanel');
    if (toggleQueueBtn && queuePanel) {
        toggleQueueBtn.addEventListener('click', () => {
            queuePanel.classList.toggle('open');
        });
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only if not typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                document.getElementById('playPauseBtn')?.click();
                break;
            case 'arrowright':
                e.preventDefault();
                playNext();
                break;
            case 'arrowleft':
                e.preventDefault();
                playPrevious();
                break;
            case 's':
                e.preventDefault();
                shuffleQueue();
                break;
            case 'r':
                e.preventDefault();
                toggleRepeat();
                break;
            case 'm':
                e.preventDefault();
                toggleMute();
                break;
            case 'arrowup':
                e.preventDefault();
                setVolume(playerState.volume + 10);
                break;
            case 'arrowdown':
                e.preventDefault();
                setVolume(playerState.volume - 10);
                break;
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize Phase 5 features
function initializePhase5() {
    setupEnhancedPlayer();
    setupKeyboardShortcuts();
    addSongActions();
    updateQueueDisplay();
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePhase5);
} else {
    initializePhase5();
}

// Export for other scripts
window.EnhancedPlayer = {
    addToQueue,
    playNext,
    playPrevious,
    shuffleQueue,
    toggleRepeat,
    clearQueue,
    getPlayerState: () => playerState
};
