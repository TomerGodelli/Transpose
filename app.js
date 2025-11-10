/**
 * Transpose - Static MP3 Library with Pre-Generated Pitch Versions
 * Uses pre-processed audio files for perfect pitch shifting quality
 */

// =====================
// STATE MANAGEMENT
// =====================

const state = {
    tracks: [],
    currentTrack: null,
    audioContext: null,
    sourceNode: null,
    gainNode: null,
    audioBuffer: null,
    isPlaying: false,
    isAudioInitialized: false,
    isMuted: false,
    previousVolume: 70,
    prefetchedTracks: new Set(),
    animationFrameId: null,
    startTime: 0,
    pausedTime: 0,
    currentPitch: 0,
    isLoadingPitch: false,
    pitchBuffers: {} // Cache for loaded pitch versions
};

// =====================
// DOM ELEMENTS
// =====================

const elements = {
    libraryPanel: null,
    playerPanel: null,
    trackList: null,
    searchInput: null,
    libraryLoading: null,
    libraryEmpty: null,
    noTrackSelected: null,
    playerUI: null,
    currentTitle: null,
    currentArtist: null,
    playPauseBtn: null,
    seekBar: null,
    currentTime: null,
    totalTime: null,
    seekBackBtn: null,
    seekForwardBtn: null,
    volumeSlider: null,
    volumeLabel: null,
    muteBtn: null,
    pitchSlider: null,
    pitchLabel: null,
    pitchResetBtn: null,
    trackLoading: null,
    errorMessage: null,
    errorText: null,
    iosBanner: null,
    iosStartBtn: null,
    degradedNotice: null,
    backToLibrary: null
};

// =====================
// INITIALIZATION
// =====================

document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadManifest();
    checkIOSRequirements();
});

function initializeElements() {
    elements.libraryPanel = document.getElementById('library-panel');
    elements.playerPanel = document.getElementById('player-panel');
    elements.trackList = document.getElementById('track-list');
    elements.searchInput = document.getElementById('search-input');
    elements.libraryLoading = document.getElementById('library-loading');
    elements.libraryEmpty = document.getElementById('library-empty');
    elements.noTrackSelected = document.getElementById('no-track-selected');
    elements.playerUI = document.getElementById('player-ui');
    elements.currentTitle = document.getElementById('current-title');
    elements.currentArtist = document.getElementById('current-artist');
    elements.playPauseBtn = document.getElementById('play-pause-btn');
    elements.seekBar = document.getElementById('seek-bar');
    elements.currentTime = document.getElementById('current-time');
    elements.totalTime = document.getElementById('total-time');
    elements.seekBackBtn = document.getElementById('seek-back-btn');
    elements.seekForwardBtn = document.getElementById('seek-forward-btn');
    elements.volumeSlider = document.getElementById('volume-slider');
    elements.volumeLabel = document.getElementById('volume-label');
    elements.muteBtn = document.getElementById('mute-btn');
    elements.pitchSlider = document.getElementById('pitch-slider');
    elements.pitchLabel = document.getElementById('pitch-label');
    elements.pitchResetBtn = document.getElementById('pitch-reset-btn');
    elements.trackLoading = document.getElementById('track-loading');
    elements.errorMessage = document.getElementById('error-message');
    elements.errorText = document.getElementById('error-text');
    elements.iosBanner = document.getElementById('ios-banner');
    elements.iosStartBtn = document.getElementById('ios-start-btn');
    elements.degradedNotice = document.getElementById('degraded-notice');
    elements.backToLibrary = document.getElementById('back-to-library');
}

// =====================
// EVENT LISTENERS
// =====================

function setupEventListeners() {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.seekBackBtn.addEventListener('click', () => seekRelative(-5));
    elements.seekForwardBtn.addEventListener('click', () => seekRelative(5));
    elements.seekBar.addEventListener('input', handleSeek);
    elements.volumeSlider.addEventListener('input', handleVolumeChange);
    elements.muteBtn.addEventListener('click', toggleMute);
    elements.pitchSlider.addEventListener('input', debounce(handlePitchChange, 150));
    elements.pitchResetBtn.addEventListener('click', resetPitch);
    elements.iosStartBtn.addEventListener('click', initializeAudio);
    elements.backToLibrary.addEventListener('click', () => {
        elements.libraryPanel.classList.remove('hidden');
        elements.playerPanel.classList.add('hidden', 'md:flex');
    });
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    let isSeeking = false;
    elements.seekBar.addEventListener('mousedown', () => { isSeeking = true; });
    elements.seekBar.addEventListener('mouseup', () => { isSeeking = false; });
    elements.seekBar.addEventListener('touchstart', () => { isSeeking = true; });
    elements.seekBar.addEventListener('touchend', () => { isSeeking = false; });
    state.isSeeking = () => isSeeking;
}

// =====================
// MANIFEST LOADING
// =====================

async function loadManifest() {
    try {
        const response = await fetch('/public/tracks.manifest.json');
        if (!response.ok) throw new Error('Failed to load manifest');
        
        const manifest = await response.json();
        state.tracks = manifest.tracks;
        
        renderTrackList(state.tracks);
        
        if (manifest.prefetch && manifest.prefetch.length > 0) {
            prefetchTracks(manifest.prefetch);
        }
        
        elements.libraryLoading.classList.add('hidden');
    } catch (error) {
        console.error('Error loading manifest:', error);
        elements.libraryLoading.classList.add('hidden');
        elements.libraryEmpty.classList.remove('hidden');
        elements.libraryEmpty.innerHTML = `
            <p class="text-red-400">Failed to load track library</p>
            <p class="text-sm mt-2">${error.message}</p>
        `;
    }
}

async function prefetchTracks(trackIds) {
    for (const trackId of trackIds) {
        const track = state.tracks.find(t => t.id === trackId);
        if (track) {
            try {
                await fetch(getPitchedFilePath(track, 0));
                state.prefetchedTracks.add(trackId);
                console.log(`Prefetched: ${track.title}`);
            } catch (error) {
                console.warn(`Failed to prefetch ${track.title}:`, error);
            }
        }
    }
}

// =====================
// UI RENDERING
// =====================

function renderTrackList(tracks) {
    elements.trackList.innerHTML = '';
    
    if (tracks.length === 0) {
        elements.libraryEmpty.classList.remove('hidden');
        return;
    }
    
    elements.libraryEmpty.classList.add('hidden');
    
    tracks.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.className = 'p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition';
        trackElement.dataset.trackId = track.id;
        
        const isPrefetched = state.prefetchedTracks.has(track.id);
        
        trackElement.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h3 class="font-semibold text-white">${escapeHtml(track.title)}</h3>
                    <p class="text-sm text-gray-400">${escapeHtml(track.artist)}</p>
                </div>
                ${isPrefetched ? '<span class="text-xs text-green-400">✓</span>' : ''}
            </div>
        `;
        
        trackElement.addEventListener('click', () => selectTrack(track));
        elements.trackList.appendChild(trackElement);
    });
}

function updateActiveTrack() {
    const trackElements = elements.trackList.querySelectorAll('[data-track-id]');
    trackElements.forEach(el => {
        if (state.currentTrack && el.dataset.trackId === state.currentTrack.id) {
            el.classList.add('track-active');
        } else {
            el.classList.remove('track-active');
        }
    });
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
        renderTrackList(state.tracks);
        updateActiveTrack();
        return;
    }
    
    const filtered = state.tracks.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query)
    );
    
    renderTrackList(filtered);
    updateActiveTrack();
}

// =====================
// AUDIO INITIALIZATION
// =====================

function checkIOSRequirements() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !state.isAudioInitialized) {
        elements.iosBanner.classList.remove('hidden');
    }
}

async function initializeAudio() {
    if (state.isAudioInitialized) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioContext();
        state.gainNode = state.audioContext.createGain();
        state.gainNode.connect(state.audioContext.destination);
        
        const volumeValue = parseInt(elements.volumeSlider.value);
        state.gainNode.gain.value = volumeValue / 100;
        
        state.isAudioInitialized = true;
        elements.iosBanner.classList.add('hidden');
        console.log('Audio context initialized');
        
        if (state.currentTrack) {
            await loadAudioBuffer(state.currentTrack, state.currentPitch);
        }
    } catch (error) {
        console.error('Failed to initialize audio:', error);
        showError('Failed to initialize audio system');
    }
}

// =====================
// FILE PATH GENERATION
// =====================

function getPitchedFilePath(track, pitchSemitones) {
    // Extract filename without extension
    const filename = track.src.replace(/^.*[\\\/]/, '').replace('.mp3', '');
    
    // Format pitch string
    let pitchStr;
    if (pitchSemitones > 0) {
        pitchStr = `+${pitchSemitones}`;
    } else if (pitchSemitones < 0) {
        pitchStr = `${pitchSemitones}`;
    } else {
        pitchStr = '0';
    }
    
    return `/public/audio/pitched/${filename}_${pitchStr}.mp3`;
}

// =====================
// TRACK SELECTION
// =====================

async function selectTrack(track) {
    if (state.isPlaying) {
        stopPlayback();
    }
    
    state.currentTrack = track;
    state.currentPitch = parseInt(elements.pitchSlider.value);
    state.pitchBuffers = {}; // Clear cache for new track
    
    elements.currentTitle.textContent = track.title;
    elements.currentArtist.textContent = track.artist;
    elements.noTrackSelected.classList.add('hidden');
    elements.playerUI.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');
    updateActiveTrack();
    
    if (window.innerWidth < 768) {
        elements.libraryPanel.classList.add('hidden');
        elements.playerPanel.classList.remove('hidden');
    }
    
    if (!state.isAudioInitialized) {
        await initializeAudio();
    }
    
    await loadTrack(track);
}

async function loadTrack(track) {
    elements.trackLoading.classList.remove('hidden');
    elements.playPauseBtn.disabled = true;
    elements.errorMessage.classList.add('hidden');
    
    state.startTime = 0;
    state.pausedTime = 0;
    state.isPlaying = false;
    
    try {
        await loadAudioBuffer(track, state.currentPitch);
        
        elements.trackLoading.classList.add('hidden');
        elements.playPauseBtn.disabled = false;
        
        await togglePlayPause();
    } catch (error) {
        console.error('Failed to load track:', error);
        elements.trackLoading.classList.add('hidden');
        elements.playPauseBtn.disabled = false;
        showError(`Failed to load track: ${error.message}`);
    }
}

// =====================
// AUDIO LOADING
// =====================

async function loadAudioBuffer(track, pitchSemitones) {
    const cacheKey = `${track.id}_${pitchSemitones}`;
    
    // Check cache first
    if (state.pitchBuffers[cacheKey]) {
        state.audioBuffer = state.pitchBuffers[cacheKey];
        updateDuration();
        return;
    }
    
    try {
        const filePath = getPitchedFilePath(track, pitchSemitones);
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Pitched version not found. Please run: ./generate_pitched_versions.sh`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        state.audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);
        
        // Cache the buffer
        state.pitchBuffers[cacheKey] = state.audioBuffer;
        
        updateDuration();
        console.log(`Loaded: ${track.title} at ${pitchSemitones > 0 ? '+' : ''}${pitchSemitones} semitones`);
    } catch (error) {
        console.error('Error loading audio:', error);
        throw error;
    }
}

// =====================
// PLAYBACK CONTROLS
// =====================

async function togglePlayPause() {
    if (!state.audioContext || !state.isAudioInitialized) {
        await initializeAudio();
        return;
    }
    
    if (!state.audioBuffer) {
        console.log('Audio not loaded yet');
        return;
    }
    
    try {
        if (state.isPlaying) {
            stopPlayback();
            state.pausedTime = getCurrentPlaybackTime();
        } else {
            await playAudio();
        }
        
        updatePlayPauseButton();
    } catch (error) {
        console.error('Playback error:', error);
        if (!state.isPlaying) {
            showError('Playback failed: ' + error.message);
        }
    }
}

async function playAudio() {
    if (state.audioContext.state === 'suspended') {
        await state.audioContext.resume();
    }
    
    state.sourceNode = state.audioContext.createBufferSource();
    state.sourceNode.buffer = state.audioBuffer;
    state.sourceNode.connect(state.gainNode);
    
    state.sourceNode.onended = () => {
        if (state.isPlaying) {
            stopPlayback();
            elements.seekBar.value = 0;
            updateTimeDisplay(0, getDuration());
        }
    };
    
    state.sourceNode.start(0, state.pausedTime);
    state.startTime = state.audioContext.currentTime - state.pausedTime;
    state.isPlaying = true;
    
    startProgressUpdate();
}

function stopPlayback() {
    if (state.sourceNode) {
        try {
            state.sourceNode.stop();
            state.sourceNode.disconnect();
        } catch (e) {
            // Already stopped
        }
        state.sourceNode = null;
    }
    
    state.isPlaying = false;
    
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
    
    updatePlayPauseButton();
}

function updatePlayPauseButton() {
    elements.playPauseBtn.textContent = state.isPlaying ? '⏸️' : '▶️';
    elements.playPauseBtn.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');
}

function getCurrentPlaybackTime() {
    if (!state.isPlaying) {
        return state.pausedTime;
    }
    return state.audioContext.currentTime - state.startTime;
}

function getDuration() {
    return state.audioBuffer ? state.audioBuffer.duration : 0;
}

// =====================
// SEEKING
// =====================

function handleSeek(event) {
    if (!state.audioBuffer) return;
    
    const duration = getDuration();
    const seekTime = (parseFloat(event.target.value) / 100) * duration;
    
    const wasPlaying = state.isPlaying;
    
    if (state.isPlaying) {
        stopPlayback();
    }
    
    state.pausedTime = seekTime;
    
    if (wasPlaying) {
        playAudio();
    }
    
    updateTimeDisplay(seekTime, duration);
}

function seekRelative(seconds) {
    if (!state.audioBuffer) return;
    
    const duration = getDuration();
    const currentTime = getCurrentPlaybackTime();
    let newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    
    const wasPlaying = state.isPlaying;
    
    if (state.isPlaying) {
        stopPlayback();
    }
    
    state.pausedTime = newTime;
    
    if (wasPlaying) {
        playAudio();
    }
    
    updateTimeDisplay(newTime, duration);
}

// =====================
// PROGRESS UPDATE
// =====================

function startProgressUpdate() {
    function update() {
        if (!state.audioBuffer || !state.isPlaying) return;
        
        const duration = getDuration();
        const currentTime = getCurrentPlaybackTime();
        
        if (!state.isSeeking || !state.isSeeking()) {
            const progress = Math.min(100, (currentTime / duration) * 100);
            elements.seekBar.value = progress;
        }
        
        updateTimeDisplay(currentTime, duration);
        
        if (currentTime >= duration) {
            stopPlayback();
            elements.seekBar.value = 0;
            updateTimeDisplay(0, duration);
            return;
        }
        
        state.animationFrameId = requestAnimationFrame(update);
    }
    
    update();
}

function updateTimeDisplay(currentTime, duration) {
    elements.currentTime.textContent = formatTime(currentTime);
    elements.totalTime.textContent = formatTime(duration);
}

function updateDuration() {
    if (state.audioBuffer) {
        const duration = getDuration();
        elements.totalTime.textContent = formatTime(duration);
    }
}

// =====================
// VOLUME CONTROLS
// =====================

function handleVolumeChange(event) {
    const value = parseInt(event.target.value);
    elements.volumeLabel.textContent = `${value}%`;
    
    if (state.gainNode) {
        state.gainNode.gain.value = value / 100;
    }
    
    state.previousVolume = value;
    
    if (value === 0) {
        elements.muteBtn.textContent = '🔇';
        state.isMuted = true;
    } else {
        elements.muteBtn.textContent = '🔊';
        state.isMuted = false;
    }
}

function toggleMute() {
    if (state.isMuted) {
        elements.volumeSlider.value = state.previousVolume || 70;
        elements.muteBtn.textContent = '🔊';
        state.isMuted = false;
    } else {
        state.previousVolume = parseInt(elements.volumeSlider.value);
        elements.volumeSlider.value = 0;
        elements.muteBtn.textContent = '🔇';
        state.isMuted = true;
    }
    
    elements.volumeSlider.dispatchEvent(new Event('input'));
}

// =====================
// PITCH CONTROLS
// =====================

async function handlePitchChange(event) {
    if (!state.currentTrack || state.isLoadingPitch) return;
    
    const newPitch = parseInt(event.target.value);
    const displayValue = newPitch >= 0 ? `+${newPitch}` : `${newPitch}`;
    
    // Update label immediately
    elements.pitchLabel.textContent = `${displayValue} st`;
    
    // If pitch hasn't changed, do nothing
    if (newPitch === state.currentPitch) return;
    
    state.isLoadingPitch = true;
    const wasPlaying = state.isPlaying;
    const currentTime = getCurrentPlaybackTime();
    
    // Show loading indicator
    elements.pitchLabel.textContent = `${displayValue} st (loading...)`;
    
    try {
        // Stop current playback
        if (state.isPlaying) {
            stopPlayback();
        }
        
        // Load new pitched version
        await loadAudioBuffer(state.currentTrack, newPitch);
        state.currentPitch = newPitch;
        
        // Resume at same position
        state.pausedTime = Math.min(currentTime, getDuration());
        
        if (wasPlaying) {
            await playAudio();
        }
        
        elements.pitchLabel.textContent = `${displayValue} st`;
    } catch (error) {
        console.error('Error changing pitch:', error);
        showError(`Pitch version not found. Run: ./generate_pitched_versions.sh`);
        elements.pitchLabel.textContent = `${displayValue} st (error)`;
    } finally {
        state.isLoadingPitch = false;
    }
}

async function resetPitch() {
    elements.pitchSlider.value = 0;
    await handlePitchChange({ target: { value: 0 } });
}

// =====================
// KEYBOARD SHORTCUTS
// =====================

function handleKeyboardShortcuts(event) {
    if (event.target === elements.searchInput) return;
    
    switch (event.code) {
        case 'Space':
            event.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            seekRelative(-5);
            break;
        case 'ArrowRight':
            event.preventDefault();
            seekRelative(5);
            break;
    }
}

// =====================
// UTILITY FUNCTIONS
// =====================

function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    elements.errorMessage.classList.remove('hidden');
    elements.errorText.textContent = message;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
