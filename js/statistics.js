// Configuration - Same as main.js
const SHEETS_CONFIG = {
    malayalam: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=0&single=true&output=csv',
    tamil: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=647669946&single=true&output=csv',
    telugu: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=737507955&single=true&output=csv',
    kannada: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=718356028&single=true&output=csv',
    hindi: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=1047532705&single=true&output=csv',
    other: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAtGv_Vrh8wp4RXJmmQbiAJfALSdhIFMzt1GCbp6dd4x2ApFEkI6ejFtQ469PbJCr2qRERzWpIruw9/pub?gid=1162950769&single=true&output=csv'
};

// Global variables
let allLanguagesSongs = {};
let currentViewLanguage = 'all';
let charts = {};

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

// Load all songs from all languages
async function loadAllSongs() {
    const loadingEl = document.getElementById('loadingStats');
    loadingEl.style.display = 'flex';
    
    for (const [language, url] of Object.entries(SHEETS_CONFIG)) {
        allLanguagesSongs[language] = await fetchSongsFromSheet(url);
    }
    
    loadingEl.style.display = 'none';
    
    // Initialize statistics
    updateStatistics('all');
}

// Get songs based on selected language
function getSongsForAnalysis(language) {
    if (language === 'all') {
        return Object.values(allLanguagesSongs).flat();
    }
    return allLanguagesSongs[language] || [];
}

// Update all statistics
function updateStatistics(language) {
    currentViewLanguage = language;
    const songs = getSongsForAnalysis(language);
    
    // Update summary cards
    updateSummaryCards(songs);
    
    // Update charts
    updateSongsPerYearChart(songs);
    updateSongsPerDecadeChart(songs);
    updateLanguageDistChart();
    updateGenreDistChart(songs);
    
    // Update top lists
    updateTopComposers(songs);
    updateTopCosingers(songs);
    updateTopGenres(songs);
    updateTopYears(songs);
    
    // Update timeline
    updateCareerTimeline(songs);
}

// ========== UPDATED: Update summary cards with split co-singers ==========
function updateSummaryCards(songs) {
    document.getElementById('totalSongs').textContent = songs.length.toLocaleString();
    
    const movies = new Set(songs.map(s => s.movie || s.film).filter(Boolean));
    document.getElementById('totalMovies').textContent = movies.size.toLocaleString();
    
    const composers = new Set(songs.map(s => s.composer || s['music director']).filter(Boolean));
    document.getElementById('totalComposers').textContent = composers.size.toLocaleString();
    
    // Split co-singers by comma to count unique individuals
    const cosingersSet = new Set();
    songs.forEach(song => {
        const cosinger = song.cosinger || song['co-singer'] || '';
        if (cosinger) {
            // Split by comma and add each singer individually
            const singers = cosinger.split(',').map(s => s.trim()).filter(s => s.length > 0);
            singers.forEach(singer => cosingersSet.add(singer));
        }
    });
    document.getElementById('totalCosingers').textContent = cosingersSet.size.toLocaleString();
    
    const years = songs.map(s => parseInt(s.year)).filter(y => !isNaN(y));
    if (years.length > 0) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        document.getElementById('yearSpan').textContent = `${maxYear - minYear}+`;
    }
}
// ========== END UPDATED CODE ==========

// Update Songs Per Year Chart
function updateSongsPerYearChart(songs) {
    const yearCounts = {};
    
    songs.forEach(song => {
        const year = parseInt(song.year);
        if (!isNaN(year)) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
    });
    
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
    const counts = years.map(year => yearCounts[year]);
    
    const ctx = document.getElementById('songsPerYearChart');
    
    if (charts.songsPerYear) {
        charts.songsPerYear.destroy();
    }
    
    charts.songsPerYear = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Songs',
                data: counts,
                borderColor: '#D2691E',
                backgroundColor: 'rgba(210, 105, 30, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} songs`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update Songs Per Decade Chart
function updateSongsPerDecadeChart(songs) {
    const decadeCounts = {};
    
    songs.forEach(song => {
        const year = parseInt(song.year);
        if (!isNaN(year)) {
            const decade = Math.floor(year / 10) * 10;
            decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }
    });
    
    const decades = Object.keys(decadeCounts).map(Number).sort((a, b) => a - b);
    const counts = decades.map(decade => decadeCounts[decade]);
    
    const ctx = document.getElementById('songsPerDecadeChart');
    
    if (charts.songsPerDecade) {
        charts.songsPerDecade.destroy();
    }
    
    charts.songsPerDecade = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: decades.map(d => `${d}s`),
            datasets: [{
                label: 'Songs',
                data: counts,
                backgroundColor: 'rgba(139, 69, 19, 0.8)',
                borderColor: '#8B4513',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update Language Distribution Chart
function updateLanguageDistChart() {
    const languageCounts = {};
    
    for (const [language, songs] of Object.entries(allLanguagesSongs)) {
        const displayName = language.charAt(0).toUpperCase() + language.slice(1);
        languageCounts[displayName] = songs.length;
    }
    
    const ctx = document.getElementById('languageDistChart');
    
    if (charts.languageDist) {
        charts.languageDist.destroy();
    }
    
    charts.languageDist = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(languageCounts),
            datasets: [{
                data: Object.values(languageCounts),
                backgroundColor: [
                    '#8B4513',
                    '#D2691E',
                    '#CD853F',
                    '#DEB887',
                    '#F4A460',
                    '#FFD700'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update Genre Distribution Chart
function updateGenreDistChart(songs) {
    const genreCounts = {};
    
    songs.forEach(song => {
        const genre = song.genre || song.category || 'Unknown';
        if (genre) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    });
    
    // Get top 10 genres
    const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const ctx = document.getElementById('genreDistChart');
    
    if (charts.genreDist) {
        charts.genreDist.destroy();
    }
    
    charts.genreDist = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedGenres.map(([genre]) => genre),
            datasets: [{
                label: 'Songs',
                data: sortedGenres.map(([, count]) => count),
                backgroundColor: 'rgba(210, 105, 30, 0.8)',
                borderColor: '#D2691E',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update Top Composers List
function updateTopComposers(songs) {
    const composerCounts = {};
    
    songs.forEach(song => {
        const composer = song.composer || song['music director'];
        if (composer) {
            composerCounts[composer] = (composerCounts[composer] || 0) + 1;
        }
    });
    
    const topComposers = Object.entries(composerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const container = document.getElementById('topComposersList');
    container.innerHTML = topComposers.map(([composer, count], index) => `
        <div class="top-list-item">
            <div class="rank">#${index + 1}</div>
            <div class="name">${composer}</div>
            <div class="count">${count} songs</div>
        </div>
    `).join('');
}

// ========== UPDATED: Update Top Co-Singers with split counting ==========
function updateTopCosingers(songs) {
    const cosingerCounts = {};
    
    // Count each co-singer individually from comma-separated lists
    songs.forEach(song => {
        const cosinger = song.cosinger || song['co-singer'] || '';
        if (cosinger) {
            // Split by comma and count each singer separately
            const singers = cosinger.split(',').map(s => s.trim()).filter(s => s.length > 0);
            singers.forEach(singer => {
                cosingerCounts[singer] = (cosingerCounts[singer] || 0) + 1;
            });
        }
    });
    
    const topCosingers = Object.entries(cosingerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const container = document.getElementById('topCosingersList');
    container.innerHTML = topCosingers.map(([cosinger, count], index) => `
        <div class="top-list-item">
            <div class="rank">#${index + 1}</div>
            <div class="name">${cosinger}</div>
            <div class="count">${count} songs</div>
        </div>
    `).join('');
}
// ========== END UPDATED CODE ==========

// Update Top Genres List
function updateTopGenres(songs) {
    const genreCounts = {};
    
    songs.forEach(song => {
        const genre = song.genre || song.category;
        if (genre) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    });
    
    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const container = document.getElementById('topGenresList');
    container.innerHTML = topGenres.map(([genre, count], index) => `
        <div class="top-list-item">
            <div class="rank">#${index + 1}</div>
            <div class="name">${genre}</div>
            <div class="count">${count} songs</div>
        </div>
    `).join('');
}

// Update Top Years List
function updateTopYears(songs) {
    const yearCounts = {};
    
    songs.forEach(song => {
        const year = parseInt(song.year);
        if (!isNaN(year)) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
    });
    
    const topYears = Object.entries(yearCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const container = document.getElementById('topYearsList');
    container.innerHTML = topYears.map(([year, count], index) => `
        <div class="top-list-item">
            <div class="rank">#${index + 1}</div>
            <div class="name">${year}</div>
            <div class="count">${count} songs</div>
        </div>
    `).join('');
}

// Update Career Timeline
function updateCareerTimeline(songs) {
    const yearCounts = {};
    
    songs.forEach(song => {
        const year = parseInt(song.year);
        if (!isNaN(year)) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
    });
    
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
    if (years.length === 0) return;
    
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    
    const container = document.getElementById('careerTimeline');
    container.innerHTML = '';
    
    // Create decade milestones
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.ceil(maxYear / 10) * 10;
    
    for (let decade = startDecade; decade <= endDecade; decade += 10) {
        const decadeSongs = years.filter(y => y >= decade && y < decade + 10)
            .reduce((sum, year) => sum + yearCounts[year], 0);
        
        if (decadeSongs > 0) {
            const milestone = document.createElement('div');
            milestone.className = 'timeline-milestone';
            milestone.innerHTML = `
                <div class="timeline-year">${decade}s</div>
                <div class="timeline-bar" style="width: ${(decadeSongs / Math.max(...Object.values(yearCounts))) * 100}%"></div>
                <div class="timeline-count">${decadeSongs} songs</div>
            `;
            container.appendChild(milestone);
        }
    }
}

// Setup language selector
function setupLanguageSelector() {
    const selector = document.getElementById('languageSelect');
    selector.addEventListener('change', function() {
        updateStatistics(this.value);
    });
}

// Initialize
async function initialize() {
    await loadAllSongs();
    setupLanguageSelector();
}

document.addEventListener('DOMContentLoaded', initialize);
