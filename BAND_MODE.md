# 🎸 Band Practice Mode

## Overview

The app now supports **TWO MODES**:

### 1. Singer Mode (Original) 🎤
- **URL**: `/songid` (e.g., `/haish_hahu`)
- **Features**: Pitch transpose (-6 to +6 semitones)
- **Use case**: Solo singers practicing songs in their vocal range

### 2. Band Mode (NEW) 🎸
- **URL**: `/band/songid` (e.g., `/band/haish_hahu`)
- **Features**: Multi-track stems with individual controls
- **Use case**: Band members practicing their individual parts

---

## URL Structure

```
/                          → All songs
/collection               → Collection view (e.g., /hof, /ravid)
/songid                   → Singer mode (pitch transpose)
/band/songid              → Band mode (stems + chords)
```

---

## Features

### 🎛️ Stem Controls

Each available stem gets its own control panel with:

**S (Solo)** - Play only this stem
**M (Mute)** - Mute this stem
**Volume Slider** - Adjust stem volume (0-100%)

###Supported Stems:
- **V** (Vocals) - שירה - Purple
- **G** (Guitar) - גיטרה - Orange
- **P** (Piano) - פסנתר - Blue
- **B** (Bass) - בס - Green
- **D** (Drums) - תופים - Red
- **O** (Other) - אחר - Gray

### 🎵 Unified Playback

- **Single seek bar** controls all stems simultaneously
- **Single play/pause** button
- **Synchronized playback** across all tracks
- **Keyboard shortcuts** (Space, ←, →)

### 📐 Layout

- **Top 20%**: Stem controls + playback controls
- **Bottom 80%**: Chords area (TBD)

---

## File Structure

```
public/audio/stems/
  ├── haish_hahu_V.mp3    # Vocals
  ├── haish_hahu_G.mp3    # Guitar
  ├── haish_hahu_P.mp3    # Piano
  ├── haish_hahu_B.mp3    # Bass
  ├── haish_hahu_D.mp3    # Drums
  └── haish_hahu_O.mp3    # Other
```

**Naming Convention**: `{songid}_{stemType}.mp3`

---

## How to Add Stems for a Song

### 1. Export stems
Use a tool like:
- **Spleeter** (free, open-source)
- **iZotope RX** (professional)
- **LALAL.AI** (online)

### 2. Name files correctly
```bash
# Example for song "yarok"
yarok_V.mp3   # Vocals
yarok_G.mp3   # Guitar
yarok_B.mp3   # Bass
yarok_D.mp3   # Drums
```

### 3. Place in stems folder
```bash
cp stems/*.mp3 public/audio/stems/
```

### 4. Test
Visit: `http://localhost:8000/band/yarok`

---

## Technical Implementation

### Multi-Track Playback

```javascript
// Each stem gets its own:
- AudioBufferSourceNode (for playback)
- GainNode (for volume control)
- State tracking (muted, volume, solo)

// All stems synchronized by:
- Same startTime (audioContext.currentTime)
- Same offset (pausedTime)
```

### Solo Mode
- When **S** is clicked on a stem:
  - That stem's volume = user setting
  - All other stems = muted (volume 0)
- When **S** is clicked again:
  - All stems restore to their settings

### Mute Mode
- When **M** is clicked:
  - Stem volume = 0
  - Button turns red
- Independent of solo mode

### Volume Control
- Each stem has a `GainNode`
- Volume slider ranges 0-100%
- Applied in real-time during playback

---

## Mode Switching

Users can switch between modes easily:

**In Singer Mode** (`/haish_hahu`):
- Click "🎸 מצב להקה" button → Go to band mode

**In Band Mode** (`/band/haish_hahu`):
- Click "מצב זמר/ת" button → Go to singer mode

---

## Current Status

### ✅ Implemented
- Multi-track audio playback
- Solo/Mute buttons per stem
- Volume sliders per stem
- Unified seek bar
- Synchronized playback
- Keyboard shortcuts
- Mode switching
- Auto-detection of available stems
- Responsive layout (20/80 split)

### 🔜 Coming Soon
- Chords display (80% area)
- Looping sections
- Speed control
- Metronome

---

## Testing

### With stems (e.g., haish_hahu):
```
http://localhost:8000/band/haish_hahu
```

**Expected:**
- All 6 stems load (V, G, P, B, D, O)
- Each stem has S/M buttons + volume slider
- Single playback control at bottom of stem section
- Chords placeholder in main area

### Without stems (other songs):
```
http://localhost:8000/band/yarok
```

**Expected:**
- Error message: "No stems found for this song"
- Suggestion to use singer mode instead

---

## Future Enhancements

1. **Chords Display**
   - ChordPro format support
   - Scrolling with playback
   - Transposable chords

2. **Practice Features**
   - Loop sections (A-B repeat)
   - Slow down playback
   - Click track/metronome

3. **Visualization**
   - Waveform display
   - Spectrogram for each stem

4. **Export**
   - Custom mix export
   - Practice track with selected stems

---

## Keyboard Shortcuts

**Both Modes:**
- `Space` - Play/Pause
- `←` - Seek -5 seconds
- `→` - Seek +5 seconds

**Singer Mode Only:**
- `↑` - Increase pitch
- `↓` - Decrease pitch

---

Happy practicing! 🎵

