/**
 * Transpose Player - Single Track Player
 * Handles playback and pitch shifting for individual song pages
 */

// Global reference to current player instance
let currentPlayer = null;

async function loadPlayer(track) {
    console.log(`=== Loading player for: ${track.title} ===`);
    
    // CRITICAL: Stop and cleanup previous player before creating new one
    if (currentPlayer) {
        console.log('Stopping previous player...');
        await currentPlayer.destroy();
        currentPlayer = null;
        console.log('Previous player fully destroyed');
        
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const container = document.getElementById('player-container');
    if (!container) return;
    
    // Render player UI
    container.innerHTML = `
        <!-- Track Info -->
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${escapeHtml(track.title)}</h2>
            <p class="text-xl text-gray-600">${escapeHtml(track.artist)}</p>
        </div>
        
        <!-- Pitch Control (Most Visible) -->
        <div class="bg-white p-8 rounded-xl border-2 border-blue-200 shadow-lg mb-8">
            <div class="text-center mb-6">
                <label class="text-lg font-semibold block mb-4 text-gray-800">🎼 שינוי סולם</label>
                <div class="flex items-center justify-center space-x-4" dir="ltr">
                    <button 
                        id="pitch-down-btn" 
                        class="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl text-3xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md border border-gray-300"
                        aria-label="הקטנת סולם"
                    >
                        −
                    </button>
                    <div class="flex flex-col items-center min-w-[120px]">
                        <span id="pitch-value" class="text-5xl font-bold font-mono text-blue-600">0</span>
                        <span class="text-sm text-gray-600 mt-1 font-medium">חצאי טונים</span>
                    </div>
                    <button 
                        id="pitch-up-btn" 
                        class="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl text-3xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md border border-gray-300"
                        aria-label="הגדלת סולם"
                    >
                        +
                    </button>
                </div>
            </div>
            <div class="flex justify-center">
                <button 
                    id="pitch-reset-btn" 
                    class="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition border border-gray-300"
                    aria-label="איפוס סולם ל-0"
                >
                    איפוס ל-0
                </button>
            </div>
            <div class="mt-4 text-center text-xs text-gray-500">
                טווח: -6 עד +6 חצאי טונים
            </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mb-6" dir="ltr">
            <input 
                type="range" 
                id="seek-bar" 
                min="0" 
                max="100" 
                value="0" 
                step="0.1"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                aria-label="מיקום בשיר"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-2">
                <span id="current-time">0:00</span>
                <span id="total-time">0:00</span>
            </div>
        </div>
        
        <!-- Play Controls -->
        <div class="flex items-center justify-center space-x-4 mb-8" dir="ltr">
            <button 
                id="seek-back-btn" 
                class="p-4 bg-white hover:bg-gray-50 rounded-full transition text-2xl shadow-lg border border-gray-200"
                aria-label="חזור 5 שניות"
            >
                ⏪
            </button>
            <button 
                id="play-pause-btn" 
                class="p-8 bg-blue-600 hover:bg-blue-500 rounded-full text-4xl transition shadow-2xl"
                aria-label="השהה/נגן"
            >
                ▶️
            </button>
            <button 
                id="seek-forward-btn" 
                class="p-4 bg-white hover:bg-gray-50 rounded-full transition text-2xl shadow-lg border border-gray-200"
                aria-label="קדימה 5 שניות"
            >
                ⏩
            </button>
        </div>
        
        <!-- Volume Control -->
        <div class="mb-8 flex items-center space-x-4 bg-white p-4 rounded-lg shadow-md border border-gray-200" dir="ltr">
            <button 
                id="mute-btn" 
                class="p-2 bg-gray-100 hover:bg-gray-200 rounded transition text-xl"
                aria-label="השתק/בטל השתקה"
            >
                🔊
            </button>
            <input 
                type="range" 
                id="volume-slider" 
                min="0" 
                max="100" 
                value="100" 
                class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                aria-label="עוצמת קול"
            />
            <span id="volume-label" class="text-sm text-gray-600 w-12 font-semibold">100%</span>
        </div>
        
        <!-- Loading Indicator -->
        <div id="track-loading" class="hidden mt-6 flex items-center justify-center text-gray-600" dir="ltr">
            <div class="spinner"></div>
            <span class="ml-3">טוען...</span>
        </div>
        
        <!-- Error Message -->
        <div id="error-message" class="hidden mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-center shadow-md">
            <p id="error-text" class="text-red-700 font-semibold"></p>
        </div>
        
        <style>
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: #60a5fa;
                cursor: pointer;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
            }
            
            .slider::-webkit-slider-thumb:hover {
                background: #3b82f6;
                transform: scale(1.1);
            }
            
            .slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #60a5fa;
                cursor: pointer;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
            }
            
            .slider::-moz-range-thumb:hover {
                background: #3b82f6;
                transform: scale(1.1);
            }
            
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top-color: #3b82f6;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Initialize player and store global reference
    currentPlayer = new TransposePlayer(track);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

class TransposePlayer {
    constructor(track) {
        this.track = track;
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.audioBuffer = null;
        this.isPlaying = false;
        this.isAudioInitialized = false;
        this.isMuted = false;
        this.previousVolume = 100;
        this.startTime = 0;
        this.pausedTime = 0;
        this.currentPitch = 0;
        this.pitchBuffers = {};
        this.animationFrameId = null;
        this.isLoadingPitch = false;
        this.isDraggingSeekBar = false;
        this.wasPlayingBeforeDrag = false;
        
        this.getElements();
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    getElements() {
        this.elements = {
            playPauseBtn: document.getElementById('play-pause-btn'),
            seekBar: document.getElementById('seek-bar'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),
            seekBackBtn: document.getElementById('seek-back-btn'),
            seekForwardBtn: document.getElementById('seek-forward-btn'),
            volumeSlider: document.getElementById('volume-slider'),
            volumeLabel: document.getElementById('volume-label'),
            muteBtn: document.getElementById('mute-btn'),
            pitchValue: document.getElementById('pitch-value'),
            pitchUpBtn: document.getElementById('pitch-up-btn'),
            pitchDownBtn: document.getElementById('pitch-down-btn'),
            pitchResetBtn: document.getElementById('pitch-reset-btn'),
            trackLoading: document.getElementById('track-loading'),
            errorMessage: document.getElementById('error-message'),
            errorText: document.getElementById('error-text')
        };
    }
    
    setupEventListeners() {
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.seekBackBtn.addEventListener('click', () => this.seekRelative(-5));
        this.elements.seekForwardBtn.addEventListener('click', () => this.seekRelative(5));
        
        // Seek bar: Enable dragging with real-time seeking
        this.elements.seekBar.addEventListener('mousedown', () => this.handleSeekStart());
        this.elements.seekBar.addEventListener('touchstart', () => this.handleSeekStart());
        this.elements.seekBar.addEventListener('input', (e) => this.handleSeekInput(e));
        this.elements.seekBar.addEventListener('mouseup', (e) => this.handleSeekComplete(e));
        this.elements.seekBar.addEventListener('touchend', (e) => this.handleSeekComplete(e));
        this.elements.seekBar.addEventListener('change', (e) => this.handleSeekComplete(e));
        
        this.elements.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e));
        this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
        this.elements.pitchUpBtn.addEventListener('click', () => this.changePitch(1));
        this.elements.pitchDownBtn.addEventListener('click', () => this.changePitch(-1));
        this.elements.pitchResetBtn.addEventListener('click', () => this.resetPitch());
        
        // Store keyboard handler reference for cleanup
        this.keyboardHandler = (e) => this.handleKeyboardShortcuts(e);
        document.addEventListener('keydown', this.keyboardHandler);
    }
    
    async initializeAudio() {
        if (this.isAudioInitialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            
            const volumeValue = parseInt(this.elements.volumeSlider.value);
            this.gainNode.gain.value = volumeValue / 100;
            
            this.isAudioInitialized = true;
            
            await this.loadTrack();
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            this.showError('Failed to initialize audio system');
        }
    }
    
    async loadTrack() {
        console.log(`\n📀 Loading track: ${this.track.title}`);
        
        // Reset player state completely
        this.stopAudioSource();
        this.pausedTime = 0;
        this.currentPitch = 0;
        this.pitchBuffers = {};
        
        this.elements.trackLoading.classList.remove('hidden');
        this.elements.playPauseBtn.disabled = true;
        this.elements.errorMessage.classList.add('hidden');
        
        try {
            // Load pitch 0 (original)
            await this.loadAudioBuffer(this.currentPitch);
            console.log(`  ✓ Loaded ${this.track.title} successfully`);
            
            this.elements.trackLoading.classList.add('hidden');
            this.elements.playPauseBtn.disabled = false;
            
            // Preload adjacent pitches in background
            this.prefetchAdjacentPitches(this.currentPitch);
            
            // ALWAYS auto-play when user selects a song (this IS the user gesture!)
            console.log(`  ► Auto-playing ${this.track.title} (user selected it)...`);
            console.log(`  AudioContext state: ${this.audioContext.state}`);
            
            await this.togglePlayPause();
            
            console.log(`✓ Track loaded and playing: ${this.track.title}\n`);
        } catch (error) {
            console.error('❌ Failed to load track:', error);
            this.elements.trackLoading.classList.add('hidden');
            this.elements.playPauseBtn.disabled = false;
            this.showError(`Failed to load track: ${error.message}`);
        }
    }
    
    getPitchedFilePath(pitchSemitones) {
        const filename = this.track.src.replace(/^.*[\\\/]/, '').replace('.mp3', '');
        let pitchStr = pitchSemitones > 0 ? `+${pitchSemitones}` : `${pitchSemitones}`;
        if (pitchSemitones === 0) pitchStr = '0';
        return `public/audio/pitched/${filename}_${pitchStr}.mp3`;
    }
    
    async loadAudioBuffer(pitchSemitones) {
        const cacheKey = `${this.track.id}_${pitchSemitones}`;
        
        console.log(`  loadAudioBuffer(${pitchSemitones}) - cacheKey: ${cacheKey}`);
        
        if (this.pitchBuffers[cacheKey]) {
            this.audioBuffer = this.pitchBuffers[cacheKey];
            this.updateDuration();
            console.log(`    ✓ Loaded from cache: ${cacheKey} (duration: ${this.audioBuffer.duration.toFixed(2)}s)`);
            return;
        }
        
        try {
            const filePath = this.getPitchedFilePath(pitchSemitones);
            console.log(`    Fetching: ${filePath}`);
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`Pitched version not found. Please run: ./generate_pitched_versions.sh`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.pitchBuffers[cacheKey] = this.audioBuffer;
            
            this.updateDuration();
            console.log(`    ✓ Decoded and cached: ${cacheKey} (duration: ${this.audioBuffer.duration.toFixed(2)}s)`);
        } catch (error) {
            console.error('❌ Error loading audio:', error);
            throw error;
        }
    }
    
    async prefetchAdjacentPitches(currentPitch) {
        const pitchesToPrefetch = [];
        
        // Prefetch previous pitch
        if (currentPitch > -6) {
            pitchesToPrefetch.push(currentPitch - 1);
        }
        
        // Prefetch next pitch
        if (currentPitch < 6) {
            pitchesToPrefetch.push(currentPitch + 1);
        }
        
        // Prefetch in background (don't await)
        for (const pitch of pitchesToPrefetch) {
            const cacheKey = `${this.track.id}_${pitch}`;
            
            // Skip if already cached
            if (this.pitchBuffers[cacheKey]) continue;
            
            // Prefetch without blocking
            this.prefetchPitch(pitch).catch(err => {
                console.warn(`Failed to prefetch pitch ${pitch}:`, err);
            });
        }
    }
    
    async prefetchPitch(pitchSemitones) {
        const cacheKey = `${this.track.id}_${pitchSemitones}`;
        
        // Already cached
        if (this.pitchBuffers[cacheKey]) return;
        
        try {
            const filePath = this.getPitchedFilePath(pitchSemitones);
            const response = await fetch(filePath);
            
            if (!response.ok) return; // Silently fail for prefetch
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.pitchBuffers[cacheKey] = buffer;
            
            console.log(`Prefetched: ${this.track.title} at ${pitchSemitones > 0 ? '+' : ''}${pitchSemitones} semitones`);
        } catch (error) {
            // Silently fail for prefetch
        }
    }
    
    async togglePlayPause() {
        if (!this.audioBuffer) return;
        
        try {
            if (this.isPlaying) {
                // CRITICAL: Get current time BEFORE stopping (while isPlaying is still true)
                const currentTime = this.getCurrentPlaybackTime();
                console.log(`Pausing at ${currentTime.toFixed(2)}s`);
                
                this.stopPlayback();
                this.pausedTime = currentTime;
                
                console.log(`Paused. pausedTime set to: ${this.pausedTime.toFixed(2)}s`);
            } else {
                console.log(`Resuming from ${this.pausedTime.toFixed(2)}s`);
                await this.playAudio();
            }
            
            this.updatePlayPauseButton();
        } catch (error) {
            console.error('Playback error:', error);
            if (!this.isPlaying) {
                this.showError('Playback failed: ' + error.message);
            }
        }
    }
    
    // UNIFIED METHOD: Completely stop all audio playback
    stopAudioSource() {
        const hadSource = !!this.sourceNode;
        
        // Stop animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop and disconnect source node
        if (this.sourceNode) {
            // CRITICAL: Remove event listener BEFORE calling stop()
            // because stop() triggers onended event!
            this.sourceNode.onended = null;
            
            try {
                // Stop playback
                this.sourceNode.stop();
            } catch (e) {
                console.log(`  (sourceNode.stop() threw: ${e.message})`);
            }
            
            try {
                // Disconnect from audio graph
                this.sourceNode.disconnect();
            } catch (e) {
                console.log(`  (sourceNode.disconnect() threw: ${e.message})`);
            }
            
            // Clear reference
            this.sourceNode = null;
        }
        
        this.isPlaying = false;
        
        if (hadSource) {
            console.log(`  ✓ stopAudioSource() completed - sourceNode stopped, disconnected, and cleared`);
        }
    }
    
    async playAudio() {
        console.log(`\n► playAudio() called`);
        console.log(`  currentPitch: ${this.currentPitch}`);
        console.log(`  pausedTime: ${this.pausedTime.toFixed(2)}s`);
        console.log(`  audioBuffer duration: ${this.audioBuffer ? this.audioBuffer.duration.toFixed(2) : 'null'}s`);
        console.log(`  AudioContext state BEFORE: ${this.audioContext.state}`);
        
        // ALWAYS fully stop any existing playback first - CRITICAL!
        this.stopAudioSource();
        console.log(`  ✓ Stopped any existing audio source`);
        
        if (!this.audioBuffer) {
            console.error('❌ No audio buffer loaded');
            return;
        }
        
        // CRITICAL: Resume audio context BEFORE creating source node
        // This prevents suspended sources from starting later when context resumes
        if (this.audioContext.state === 'suspended') {
            console.log('  ⚠️  AudioContext is SUSPENDED, attempting resume...');
            try {
                await this.audioContext.resume();
                console.log(`  ✓ AudioContext resumed to: ${this.audioContext.state}`);
            } catch (e) {
                console.error(`  ❌ Failed to resume AudioContext: ${e.message}`);
                this.isPlaying = false;
                return;
            }
        }
        
        // Double-check context state - MUST be running
        if (this.audioContext.state !== 'running') {
            console.error(`  ❌ AudioContext NOT RUNNING (state: ${this.audioContext.state})`);
            console.error(`  ❌ Cannot play - requires user gesture`);
            console.error(`  ❌ ABORTING playAudio()`);
            this.isPlaying = false;
            this.updatePlayPauseButton();
            return;
        }
        
        console.log(`  ✓ Audio context state: ${this.audioContext.state} ✓`);
        
        // FINAL CHECK: Stop any lingering nodes before creating new one
        if (this.sourceNode) {
            console.warn('  ⚠️ sourceNode still exists! Force stopping...');
            this.stopAudioSource();
        }
        
        // Create fresh source node (context is guaranteed running now)
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.gainNode);
        
        console.log(`  ✓ Created NEW sourceNode (ID: ${Math.random().toString(36).slice(2, 7)})`);
        console.log(`  ✓ Buffer: pitch ${this.currentPitch}, duration ${this.audioBuffer.duration.toFixed(2)}s`);
        console.log(`  ✓ Connected: sourceNode → gainNode → destination`);
        
        // Handle natural end of track
        this.sourceNode.onended = () => {
            if (this.isPlaying) {
                console.log('Track ended naturally');
                this.stopAudioSource();
                this.pausedTime = 0;
                this.elements.seekBar.value = 0;
                this.updateTimeDisplay(0, this.getDuration());
                this.updatePlayPauseButton();
            }
        };
        
        // Start playback from pausedTime position
        this.sourceNode.start(0, this.pausedTime);
        this.startTime = this.audioContext.currentTime - this.pausedTime;
        this.isPlaying = true;
        
        console.log(`  ✓ sourceNode.start(0, ${this.pausedTime.toFixed(2)}) EXECUTED`);
        console.log(`  ✓ isPlaying = true`);
        console.log(`  ✓ startTime = ${this.startTime.toFixed(2)}`);
        
        // Start UI update loop
        this.startProgressUpdate();
        
        console.log(`✓✓✓ NOW PLAYING: pitch ${this.currentPitch} from ${this.pausedTime.toFixed(2)}s ✓✓✓\n`);
    }
    
    stopPlayback() {
        this.stopAudioSource();
        this.updatePlayPauseButton();
    }
    
    async destroy() {
        console.log(`\n🔴 DESTROYING PLAYER: ${this.track.title}`);
        
        // STEP 1: Stop all playback immediately and aggressively
        this.isPlaying = false;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log('  ✓ Animation frame cancelled');
        }
        
        // Stop source node
        if (this.sourceNode) {
            console.log('  🛑 Stopping sourceNode...');
            this.sourceNode.onended = null;
            try {
                this.sourceNode.stop();
                console.log('    ✓ sourceNode.stop() called');
            } catch (e) {
                console.log(`    (stop error: ${e.message})`);
            }
            try {
                this.sourceNode.disconnect();
                console.log('    ✓ sourceNode.disconnect() called');
            } catch (e) {
                console.log(`    (disconnect error: ${e.message})`);
            }
            this.sourceNode = null;
            console.log('  ✓ sourceNode cleared');
        }
        
        // STEP 2: Remove keyboard listener
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
            console.log('  ✓ Keyboard listener removed');
        }
        
        // STEP 3: Disconnect gain node
        if (this.gainNode) {
            try {
                this.gainNode.disconnect();
                console.log('  ✓ Gain node disconnected');
            } catch (e) {}
            this.gainNode = null;
        }
        
        // STEP 4: Close and wait for audio context to fully close
        if (this.audioContext) {
            console.log(`  🔴 Closing AudioContext (state: ${this.audioContext.state})...`);
            try {
                await this.audioContext.close();
                console.log(`    ✓ AudioContext closed (final state: ${this.audioContext.state})`);
            } catch (e) {
                console.error(`    ❌ Error closing audio context: ${e.message}`);
            }
            this.audioContext = null;
        }
        
        // STEP 5: Clear all references
        this.audioBuffer = null;
        this.pitchBuffers = {};
        this.elements = null;
        
        console.log(`✓ Player destroyed successfully: ${this.track.title}\n`);
    }
    
    updatePlayPauseButton() {
        this.elements.playPauseBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    }
    
    getCurrentPlaybackTime() {
        if (!this.isPlaying) return this.pausedTime;
        return this.audioContext.currentTime - this.startTime;
    }
    
    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }
    
    handleSeekStart() {
        // User started dragging the seek bar
        this.isDraggingSeekBar = true;
        this.wasPlayingBeforeDrag = this.isPlaying;
        
        // Keep playback running while dragging - don't stop!
    }
    
    handleSeekInput(event) {
        // Update time display while dragging (visual feedback only)
        if (!this.audioBuffer) return;
        
        const duration = this.getDuration();
        const seekTime = (parseFloat(event.target.value) / 100) * duration;
        
        // Update time display to show where we'll jump to
        if (this.isDraggingSeekBar) {
            this.updateTimeDisplay(seekTime, duration);
        }
    }
    
    handleSeekComplete(event) {
        // User released the seek bar - NOW apply the seek
        if (!this.audioBuffer || !this.isDraggingSeekBar) return;
        
        this.isDraggingSeekBar = false;
        
        const duration = this.getDuration();
        const seekTime = (parseFloat(event.target.value) / 100) * duration;
        const wasPlaying = this.wasPlayingBeforeDrag;
        
        // Stop current playback
        this.stopAudioSource();
        
        // Set new position
        this.pausedTime = seekTime;
        this.updateTimeDisplay(seekTime, duration);
        
        // Resume playback if it was playing
        if (wasPlaying) {
            this.playAudio();
        }
    }
    
    seekRelative(seconds) {
        if (!this.audioBuffer) return;
        
        const duration = this.getDuration();
        const currentTime = this.getCurrentPlaybackTime();
        let newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        const wasPlaying = this.isPlaying;
        
        // Stop current playback
        this.stopAudioSource();
        
        // Set new position
        this.pausedTime = newTime;
        this.updateTimeDisplay(newTime, duration);
        
        // Resume if it was playing
        if (wasPlaying) {
            this.playAudio();
        }
    }
    
    startProgressUpdate() {
        const update = () => {
            if (!this.audioBuffer || !this.isPlaying) return;
            
            const duration = this.getDuration();
            const currentTime = this.getCurrentPlaybackTime();
            
            // Don't update seek bar if user is dragging it
            if (!this.isDraggingSeekBar) {
                const progress = Math.min(100, (currentTime / duration) * 100);
                this.elements.seekBar.value = progress;
                this.updateTimeDisplay(currentTime, duration);
            }
            
            if (currentTime >= duration) {
                this.stopPlayback();
                this.elements.seekBar.value = 0;
                this.updateTimeDisplay(0, duration);
                return;
            }
            
            this.animationFrameId = requestAnimationFrame(update);
        };
        
        update();
    }
    
    updateTimeDisplay(currentTime, duration) {
        this.elements.currentTime.textContent = this.formatTime(currentTime);
        this.elements.totalTime.textContent = this.formatTime(duration);
    }
    
    updateDuration() {
        if (this.audioBuffer) {
            this.elements.totalTime.textContent = this.formatTime(this.getDuration());
        }
    }
    
    handleVolumeChange(event) {
        const value = parseInt(event.target.value);
        this.elements.volumeLabel.textContent = `${value}%`;
        
        if (this.gainNode) {
            this.gainNode.gain.value = value / 100;
        }
        
        this.previousVolume = value;
        this.elements.muteBtn.textContent = value === 0 ? '🔇' : '🔊';
        this.isMuted = value === 0;
    }
    
    toggleMute() {
        if (this.isMuted) {
            this.elements.volumeSlider.value = this.previousVolume || 100;
        } else {
            this.previousVolume = parseInt(this.elements.volumeSlider.value);
            this.elements.volumeSlider.value = 0;
        }
        this.elements.volumeSlider.dispatchEvent(new Event('input'));
    }
    
    async changePitch(delta) {
        if (this.isLoadingPitch) {
            console.log('Already loading pitch, ignoring request');
            return;
        }
        
        const newPitch = Math.max(-6, Math.min(6, this.currentPitch + delta));
        if (newPitch === this.currentPitch) {
            console.log('Pitch unchanged, ignoring');
            return;
        }
        
        console.log(`\n=== PITCH CHANGE: ${this.currentPitch} → ${newPitch} ===`);
        
        this.updatePitchDisplay(newPitch, true);
        this.isLoadingPitch = true;
        
        // Save playback state
        const wasPlaying = this.isPlaying;
        const currentTime = this.getCurrentPlaybackTime();
        const duration = this.getDuration();
        
        console.log(`  wasPlaying: ${wasPlaying}, currentTime: ${currentTime.toFixed(2)}s`);
        
        try {
            // STEP 1: Completely stop current playback
            this.stopAudioSource();
            console.log(`  ✓ Stopped playback at ${currentTime.toFixed(2)}s`);
            
            // STEP 2: Update UI to maintain visual continuity
            const progress = Math.min(100, (currentTime / duration) * 100);
            this.elements.seekBar.value = progress;
            this.updateTimeDisplay(currentTime, duration);
            console.log(`  ✓ UI updated, seekBar: ${progress.toFixed(1)}%`);
            
            // STEP 3: Load new pitch buffer
            await this.loadAudioBuffer(newPitch);
            this.currentPitch = newPitch;
            console.log(`  ✓ Loaded pitch ${newPitch} buffer`);
            
            // STEP 4: Set position for new playback
            this.pausedTime = Math.min(currentTime, this.getDuration());
            console.log(`  ✓ Set pausedTime to ${this.pausedTime.toFixed(2)}s`);
            
            // STEP 5: Always resume playback (smooth experience)
            console.log(`  ► Starting playback...`);
            await this.playAudio();
            console.log(`  ✓ Playback resumed, isPlaying: ${this.isPlaying}`);
            
            // STEP 6: Update UI
            this.updatePitchDisplay(newPitch, false);
            this.updatePitchButtons();
            this.updatePlayPauseButton();
            
            // STEP 7: Prefetch adjacent pitches for next change
            this.prefetchAdjacentPitches(newPitch);
            
            console.log(`=== PITCH CHANGE COMPLETE ===\n`);
            
        } catch (error) {
            console.error('❌ Error changing pitch:', error);
            this.showError(`Pitch version not found. Run: ./generate_pitched_versions.sh`);
            this.updatePitchDisplay(newPitch, false);
        } finally {
            this.isLoadingPitch = false;
        }
    }
    
    updatePitchDisplay(pitch, isLoading) {
        const displayValue = pitch >= 0 ? `+${pitch}` : `${pitch}`;
        this.elements.pitchValue.textContent = displayValue;
        if (isLoading) {
            this.elements.pitchValue.classList.add('opacity-50');
        } else {
            this.elements.pitchValue.classList.remove('opacity-50');
        }
    }
    
    updatePitchButtons() {
        this.elements.pitchUpBtn.disabled = this.currentPitch >= 6;
        this.elements.pitchDownBtn.disabled = this.currentPitch <= -6;
    }
    
    async resetPitch() {
        if (this.currentPitch === 0) return;
        const delta = -this.currentPitch;
        await this.changePitch(delta);
    }
    
    handleKeyboardShortcuts(event) {
        if (event.target.tagName === 'INPUT') return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.seekRelative(-5);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.seekRelative(5);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.changePitch(1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.changePitch(-1);
                break;
        }
    }
    
    formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    showError(message) {
        this.elements.errorMessage.classList.remove('hidden');
        this.elements.errorText.textContent = message;
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        }.bind(this);
    }
}

