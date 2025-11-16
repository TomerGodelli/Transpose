/**
 * Band Practice Player
 * Multi-track audio player with individual stem controls
 */

class BandPlayer {
    constructor(track) {
        this.track = track;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Define available stems
        this.stems = [
            { id: 'V', name: 'Vocals', label: 'שירה', color: 'bg-purple-500' },
            { id: 'G', name: 'Guitar', label: 'גיטרה', color: 'bg-orange-500' },
            { id: 'P', name: 'Piano', label: 'פסנתר', color: 'bg-blue-500' },
            { id: 'B', name: 'Bass', label: 'בס', color: 'bg-green-500' },
            { id: 'D', name: 'Drums', label: 'תופים', color: 'bg-red-500' },
            { id: 'O', name: 'Other', label: 'אחר', color: 'bg-gray-500' }
        ];
        
        // Stem state
        this.stemBuffers = {};
        this.stemSources = {};
        this.stemGains = {};
        this.stemMuted = {};
        this.stemVolumes = {};
        this.stemPreviousVolumes = {}; // Store volume before muting
        this.availableStems = [];
        
        // Playback state
        this.isPlaying = false;
        this.pausedTime = 0;
        this.startTime = 0;
        this.duration = 0;
        this.animationFrameId = null;
        this.soloStems = new Set(); // Track multiple solo stems
        
        this.getElements();
        this.setupEventListeners();
        this.loadTrack();
    }
    
    getElements() {
        this.elements = {
            playPauseBtn: document.getElementById('play-pause-btn'),
            playPauseIcon: document.getElementById('play-pause-icon'),
            seekBar: document.getElementById('seek-bar'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),
            trackLoading: document.getElementById('track-loading'),
            errorMessage: document.getElementById('error-message'),
            stemControls: document.getElementById('stem-controls'),
            chordsContainer: document.getElementById('chords-container')
        };
    }
    
    setupEventListeners() {
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.seekBar.addEventListener('mousedown', () => this.handleSeekStart());
        this.elements.seekBar.addEventListener('input', (e) => this.handleSeekInput(e));
        this.elements.seekBar.addEventListener('change', (e) => this.handleSeekComplete(e));
        
        // Keyboard shortcuts
        this.keyboardHandler = (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.seekRelative(-5);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.seekRelative(5);
            }
        };
        document.addEventListener('keydown', this.keyboardHandler);
    }
    
    async loadTrack() {
        console.log(`\n🎸 Loading band track: ${this.track.title}`);
        
        this.elements.trackLoading.classList.remove('hidden');
        this.elements.playPauseBtn.disabled = true;
        this.elements.errorMessage.classList.add('hidden');
        
        try {
            // Detect available stems
            await this.detectAvailableStems();
            
            if (this.availableStems.length === 0) {
                throw new Error('No stems found for this song');
            }
            
            console.log(`  ✓ Found ${this.availableStems.length} stems:`, this.availableStems.map(s => s.id).join(', '));
            
            // Load all available stems
            await this.loadAllStems();
            
            // Render stem controls
            this.renderStemControls();
            
            // Load chords PDF if available
            this.loadChords();
            
            this.elements.trackLoading.classList.add('hidden');
            this.elements.playPauseBtn.disabled = false;
            
            // Auto-play
            console.log(`  ► Auto-playing ${this.track.title}...`);
            await this.togglePlayPause();
            
            console.log(`✓ Band track loaded and playing\n`);
        } catch (error) {
            console.error('❌ Failed to load band track:', error);
            this.elements.trackLoading.classList.add('hidden');
            this.elements.playPauseBtn.disabled = false;
            this.showError(`Failed to load stems: ${error.message}`);
        }
    }
    
    async detectAvailableStems() {
        const basePath = typeof APP_BASE_PATH !== 'undefined' ? APP_BASE_PATH : '/';
        const songId = this.track.id;
        
        for (const stem of this.stems) {
            try {
                const stemPath = `${basePath}public/audio/stems/${songId}_${stem.id}.mp3`;
                const response = await fetch(stemPath, { method: 'HEAD' });
                
                if (response.ok) {
                    this.availableStems.push(stem);
                    this.stemMuted[stem.id] = false;
                    this.stemVolumes[stem.id] = 100;
                }
            } catch (error) {
                // Stem doesn't exist, skip it
            }
        }
    }
    
    async loadAllStems() {
        const basePath = typeof APP_BASE_PATH !== 'undefined' ? APP_BASE_PATH : '/';
        const songId = this.track.id;
        
        console.log(`  📦 Loading all ${this.availableStems.length} stems in parallel...`);
        
        // Load all stems in parallel using Promise.all
        const loadPromises = this.availableStems.map(async (stem) => {
            const stemPath = `${basePath}public/audio/stems/${songId}_${stem.id}.mp3`;
            console.log(`    ⏳ Loading ${stem.name}...`);
            
            const response = await fetch(stemPath);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.stemBuffers[stem.id] = audioBuffer;
            
            // Create gain node for this stem
            const gainNode = this.audioContext.createGain();
            gainNode.connect(this.audioContext.destination);
            this.stemGains[stem.id] = gainNode;
            
            console.log(`      ✓ ${stem.name} loaded (${audioBuffer.duration.toFixed(1)}s)`);
            
            return { stem, audioBuffer };
        });
        
        // Wait for all stems to load
        const results = await Promise.all(loadPromises);
        
        // Set duration from first stem
        if (results.length > 0) {
            this.duration = results[0].audioBuffer.duration;
            this.updateTimeDisplay(0, this.duration);
        }
        
        console.log(`  ✅ All ${this.availableStems.length} stems loaded successfully!`);
    }
    
    renderStemControls() {
        // Calculate dynamic heights based on number of stems to fit without scrolling
        const numStems = this.availableStems.length;
        let sliderHeight = 80; // Default
        
        if (numStems <= 2) {
            sliderHeight = 100;
        } else if (numStems <= 3) {
            sliderHeight = 90;
        } else if (numStems <= 4) {
            sliderHeight = 80;
        } else if (numStems <= 5) {
            sliderHeight = 70;
        } else if (numStems <= 6) {
            sliderHeight = 60;
        } else {
            sliderHeight = 50;
        }
        
        const html = this.availableStems.map(stem => `
            <div class="stem-control flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0" style="min-width: 70px; max-width: 90px;">
                <!-- Volume Slider (Vertical) -->
                <div class="mb-2" dir="ltr" style="height: ${sliderHeight}px;">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value="100"
                        orient="vertical"
                        class="stem-volume-slider appearance-none cursor-pointer accent-blue-600 vertical-slider"
                        style="writing-mode: bt-lr; -webkit-appearance: slider-vertical; width: 20px; height: 100%;"
                        data-stem="${stem.id}">
                </div>
                
                <!-- Stem Label -->
                <div class="mb-1">
                    <div class="${stem.color} text-white px-2 py-1 rounded text-center text-xs font-bold whitespace-nowrap">
                        ${stem.label}
                    </div>
                </div>
                
                <!-- Solo/Mute Buttons -->
                <div class="flex gap-1 mb-1" dir="ltr">
                    <button 
                        class="stem-solo-btn w-6 h-6 rounded border-2 border-yellow-500 text-yellow-600 font-bold text-xs transition hover:bg-yellow-100"
                        data-stem="${stem.id}"
                        title="Solo">
                        S
                    </button>
                    <button 
                        class="stem-mute-btn w-6 h-6 rounded border-2 border-gray-400 text-gray-600 font-bold text-xs transition hover:bg-gray-100"
                        data-stem="${stem.id}"
                        title="Mute">
                        M
                    </button>
                </div>
                
                <!-- Volume Label -->
                <div class="text-xs text-gray-600" dir="ltr">
                    <span class="stem-volume-label" data-stem="${stem.id}">100%</span>
                </div>
            </div>
        `).join('');
        
        this.elements.stemControls.innerHTML = html;
        
        // Setup stem control listeners
        this.setupStemControlListeners();
    }
    
    setupStemControlListeners() {
        // Solo buttons
        document.querySelectorAll('.stem-solo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stemId = btn.dataset.stem;
                const isMultiSolo = e.metaKey || e.ctrlKey; // Cmd on Mac, Ctrl on Windows/Linux
                this.toggleSolo(stemId, btn, isMultiSolo);
            });
        });
        
        // Mute buttons
        document.querySelectorAll('.stem-mute-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stemId = btn.dataset.stem;
                this.toggleMute(stemId, btn);
            });
        });
        
        // Volume sliders
        document.querySelectorAll('.stem-volume-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const stemId = slider.dataset.stem;
                const volume = parseInt(e.target.value);
                this.setStemVolume(stemId, volume);
                
                // Update label
                const label = document.querySelector(`.stem-volume-label[data-stem="${stemId}"]`);
                label.textContent = `${volume}%`;
            });
        });
    }
    
    toggleSolo(stemId, btn, isMultiSolo = false) {
        if (this.soloStems.has(stemId)) {
            // Un-solo this stem
            this.soloStems.delete(stemId);
            btn.classList.remove('bg-yellow-500', 'text-white', '!bg-yellow-600');
            btn.classList.add('border-yellow-500', 'text-yellow-600');
        } else {
            // Solo this stem
            if (!isMultiSolo) {
                // Regular click: clear all other solos first
                this.soloStems.clear();
                
                // Update all solo buttons to inactive
                document.querySelectorAll('.stem-solo-btn').forEach(b => {
                    b.classList.remove('bg-yellow-500', 'text-white', '!bg-yellow-600');
                    b.classList.add('border-yellow-500', 'text-yellow-600');
                });
            }
            
            // Add this stem to solo
            this.soloStems.add(stemId);
            btn.classList.add('bg-yellow-500', 'text-white', '!bg-yellow-600');
            btn.classList.remove('border-yellow-500', 'text-yellow-600');
            
            // Disable mute button for this stem
            const muteBtn = document.querySelector(`.stem-mute-btn[data-stem="${stemId}"]`);
            if (muteBtn && this.stemMuted[stemId]) {
                this.stemMuted[stemId] = false;
                muteBtn.classList.remove('bg-red-500', 'text-white', 'border-red-500', '!bg-red-600');
                muteBtn.classList.add('border-gray-400', 'text-gray-600');
                
                // Restore volume bar visual state
                const volumeSlider = document.querySelector(`.stem-volume-slider[data-stem="${stemId}"]`);
                if (volumeSlider && this.stemPreviousVolumes[stemId] !== undefined) {
                    volumeSlider.value = this.stemPreviousVolumes[stemId];
                    this.stemVolumes[stemId] = this.stemPreviousVolumes[stemId];
                    
                    const label = document.querySelector(`.stem-volume-label[data-stem="${stemId}"]`);
                    if (label) label.textContent = `${this.stemPreviousVolumes[stemId]}%`;
                }
                volumeSlider.classList.remove('opacity-30');
            }
        }
        
        // Update visual state and audio for all stems
        this.updateStemStates();
    }
    
    toggleMute(stemId, btn) {
        const volumeSlider = document.querySelector(`.stem-volume-slider[data-stem="${stemId}"]`);
        const label = document.querySelector(`.stem-volume-label[data-stem="${stemId}"]`);
        
        if (this.stemMuted[stemId]) {
            // Un-mute: restore previous volume
            this.stemMuted[stemId] = false;
            btn.classList.remove('bg-red-500', 'text-white', 'border-red-500', '!bg-red-600');
            btn.classList.add('border-gray-400', 'text-gray-600');
            
            // Restore volume slider value and visual state
            if (this.stemPreviousVolumes[stemId] !== undefined) {
                volumeSlider.value = this.stemPreviousVolumes[stemId];
                this.stemVolumes[stemId] = this.stemPreviousVolumes[stemId];
                if (label) label.textContent = `${this.stemPreviousVolumes[stemId]}%`;
            }
            volumeSlider.classList.remove('opacity-30');
        } else {
            // Mute: save current volume and set to 0
            this.stemPreviousVolumes[stemId] = this.stemVolumes[stemId];
            this.stemMuted[stemId] = true;
            btn.classList.add('bg-red-500', 'text-white', 'border-red-500', '!bg-red-600');
            btn.classList.remove('border-gray-400', 'text-gray-600');
            
            // Set volume slider to 0 and gray it out
            volumeSlider.value = 0;
            this.stemVolumes[stemId] = 0;
            if (label) label.textContent = '0%';
            volumeSlider.classList.add('opacity-30');
            
            // Disable solo button for this stem if it was active
            if (this.soloStems.has(stemId)) {
                this.soloStems.delete(stemId);
                const soloBtn = document.querySelector(`.stem-solo-btn[data-stem="${stemId}"]`);
                if (soloBtn) {
                    soloBtn.classList.remove('bg-yellow-500', 'text-white', '!bg-yellow-600');
                    soloBtn.classList.add('border-yellow-500', 'text-yellow-600');
                }
            }
        }
        
        // Update audio gains
        this.updateStemStates();
    }
    
    updateStemStates() {
        // Update all stem gains and visual states based on solo/mute state
        this.availableStems.forEach(stem => {
            if (!this.stemGains[stem.id]) return;
            
            const volumeSlider = document.querySelector(`.stem-volume-slider[data-stem="${stem.id}"]`);
            
            if (this.soloStems.size > 0) {
                // Solo mode: only play solo stems
                if (this.soloStems.has(stem.id)) {
                    // This stem is soloed - play it and remove gray
                    this.stemGains[stem.id].gain.value = this.stemVolumes[stem.id] / 100;
                    if (volumeSlider) volumeSlider.classList.remove('opacity-30');
                } else {
                    // This stem is not soloed - mute it and gray it out
                    this.stemGains[stem.id].gain.value = 0;
                    if (volumeSlider) volumeSlider.classList.add('opacity-30');
                }
            } else {
                // Normal mode: respect mute state
                if (this.stemMuted[stem.id]) {
                    this.stemGains[stem.id].gain.value = 0;
                    // Volume slider already grayed by toggleMute
                } else {
                    this.stemGains[stem.id].gain.value = this.stemVolumes[stem.id] / 100;
                    if (volumeSlider) volumeSlider.classList.remove('opacity-30');
                }
            }
        });
    }
    
    setStemVolume(stemId, volume) {
        this.stemVolumes[stemId] = volume;
        
        // Apply volume based on current solo/mute state
        if (this.soloStems.size > 0) {
            // In solo mode: only apply if this stem is soloed
            if (this.soloStems.has(stemId)) {
                this.stemGains[stemId].gain.value = volume / 100;
            }
        } else {
            // Normal mode: apply if not muted
            if (!this.stemMuted[stemId]) {
                this.stemGains[stemId].gain.value = volume / 100;
            }
        }
    }
    
    async togglePlayPause() {
        if (this.isPlaying) {
            const currentTime = this.getCurrentPlaybackTime();
            this.stopAllStems();
            this.pausedTime = currentTime;
        } else {
            await this.playAllStems();
        }
        
        this.updatePlayPauseButton();
    }
    
    async playAllStems() {
        console.log(`\n► Playing all stems from ${this.pausedTime.toFixed(2)}s`);
        
        this.stopAllStems();
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        if (this.audioContext.state !== 'running') {
            console.error('❌ AudioContext not running');
            return;
        }
        
        // Create and start all stem sources
        const startTime = this.audioContext.currentTime;
        
        for (const stem of this.availableStems) {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.stemBuffers[stem.id];
            source.connect(this.stemGains[stem.id]);
            
            source.start(0, this.pausedTime);
            this.stemSources[stem.id] = source;
            
            console.log(`  ✓ Started ${stem.name} from ${this.pausedTime.toFixed(2)}s`);
        }
        
        this.startTime = startTime - this.pausedTime;
        this.isPlaying = true;
        
        // Apply current solo/mute states to audio (don't reset them)
        this.updateStemStates();
        
        // Handle track end (use first stem)
        if (this.availableStems.length > 0) {
            this.stemSources[this.availableStems[0].id].onended = () => {
                if (this.isPlaying) {
                    console.log('Track ended naturally');
                    this.stopAllStems();
                    this.pausedTime = 0;
                    this.elements.seekBar.value = 0;
                    this.updateTimeDisplay(0, this.duration);
                    this.updatePlayPauseButton();
                }
            };
        }
        
        this.startProgressUpdate();
        console.log(`✓✓✓ All stems playing\n`);
    }
    
    stopAllStems() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        for (const stem of this.availableStems) {
            if (this.stemSources[stem.id]) {
                try {
                    this.stemSources[stem.id].onended = null;
                    this.stemSources[stem.id].stop();
                    this.stemSources[stem.id].disconnect();
                } catch (e) {
                    // Already stopped
                }
                this.stemSources[stem.id] = null;
            }
        }
        
        this.isPlaying = false;
    }
    
    getCurrentPlaybackTime() {
        if (!this.isPlaying) return this.pausedTime;
        return this.audioContext.currentTime - this.startTime;
    }
    
    handleSeekStart() {
        this.isDraggingSeekBar = true;
        this.wasPlayingBeforeDrag = this.isPlaying;
    }
    
    handleSeekInput(event) {
        if (!this.isDraggingSeekBar) return;
        
        const seekTime = (parseFloat(event.target.value) / 100) * this.duration;
        this.updateTimeDisplay(seekTime, this.duration);
    }
    
    handleSeekComplete(event) {
        if (!this.isDraggingSeekBar) return;
        
        this.isDraggingSeekBar = false;
        
        const seekTime = (parseFloat(event.target.value) / 100) * this.duration;
        const wasPlaying = this.wasPlayingBeforeDrag;
        
        this.stopAllStems();
        this.pausedTime = seekTime;
        this.updateTimeDisplay(seekTime, this.duration);
        
        if (wasPlaying) {
            this.playAllStems();
        }
    }
    
    seekRelative(seconds) {
        const currentTime = this.getCurrentPlaybackTime();
        const newTime = Math.max(0, Math.min(this.duration, currentTime + seconds));
        
        const wasPlaying = this.isPlaying;
        this.stopAllStems();
        this.pausedTime = newTime;
        
        if (wasPlaying) {
            this.playAllStems();
        }
        
        this.elements.seekBar.value = (newTime / this.duration) * 100;
        this.updateTimeDisplay(newTime, this.duration);
    }
    
    startProgressUpdate() {
        const updateProgress = () => {
            if (!this.isPlaying) return;
            
            const currentTime = this.getCurrentPlaybackTime();
            
            if (!this.isDraggingSeekBar) {
                this.elements.seekBar.value = (currentTime / this.duration) * 100;
                this.updateTimeDisplay(currentTime, this.duration);
            }
            
            this.animationFrameId = requestAnimationFrame(updateProgress);
        };
        
        updateProgress();
    }
    
    updateTimeDisplay(current, total) {
        this.elements.currentTime.textContent = this.formatTime(current);
        this.elements.totalTime.textContent = this.formatTime(total);
    }
    
    updatePlayPauseButton() {
        if (this.isPlaying) {
            this.elements.playPauseIcon.innerHTML = `
                <rect x="6" y="5" width="4" height="14" rx="1"/>
                <rect x="14" y="5" width="4" height="14" rx="1"/>
            `;
        } else {
            this.elements.playPauseIcon.innerHTML = `
                <path d="M8 5v14l11-7z"/>
            `;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    }
    
    loadChords() {
        const basePath = typeof APP_BASE_PATH !== 'undefined' ? APP_BASE_PATH : '/';
        const chordPage = this.track.chordPage;
        
        if (chordPage) {
            console.log(`  📄 Loading chords page ${chordPage} for ${this.track.title}`);
            
            // Display PDF with specific page in portrait mode, fullscreen without toolbar
            this.elements.chordsContainer.innerHTML = `
                <iframe 
                    src="${basePath}public/chords/chords.pdf#page=${chordPage}&view=FitH&toolbar=0&navpanes=0&scrollbar=0" 
                    width="100%" 
                    height="100%" 
                    style="border: none; min-height: 600px; aspect-ratio: 210/297;"
                    title="Chords for ${this.track.title}">
                </iframe>
            `;
        } else {
            // No chords available for this song
            console.log(`  ⚠️ No chords available for ${this.track.title}`);
            this.elements.chordsContainer.innerHTML = `
                <div class="flex items-center justify-center h-full text-center text-gray-400">
                    <div>
                        <div class="text-6xl mb-4">🎼</div>
                        <p class="text-xl" dir="rtl">אין אקורדים זמינים לשיר זה</p>
                        <p class="text-sm mt-2">No chords available for this song</p>
                    </div>
                </div>
            `;
        }
    }
    
    async destroy() {
        console.log(`\n🔴 DESTROYING BAND PLAYER: ${this.track.title}`);
        
        this.stopAllStems();
        
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
        
        for (const stem of this.availableStems) {
            if (this.stemGains[stem.id]) {
                try {
                    this.stemGains[stem.id].disconnect();
                } catch (e) {}
                this.stemGains[stem.id] = null;
            }
        }
        
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        
        console.log('✓ Band player destroyed\n');
    }
}

// Global player instance
let currentBandPlayer = null;

async function loadBandPlayer(track) {
    console.log('\n🎸 Loading band player...');
    
    if (currentBandPlayer) {
        await currentBandPlayer.destroy();
        currentBandPlayer = null;
    }
    
    currentBandPlayer = new BandPlayer(track);
}

