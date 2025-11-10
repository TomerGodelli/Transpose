# 🎵 Setup Instructions - High-Quality Pitch Shifting

## How It Works

This app uses **pre-generated pitched audio files** for perfect quality - the same approach professional tools use!

Instead of real-time pitch shifting (which sounds robotic), we:
1. Generate 25 versions of each song offline using **Rubber Band CLI** (professional tool)
2. The web app simply switches between pre-made files when you move the slider
3. Result: **Perfect quality** - same as vocalremover.org!

---

## 📋 Prerequisites

You need **Rubber Band CLI** installed on your Mac.

### Install Rubber Band

```bash
brew install rubberband
```

That's it! This is the same professional library used by:
- Audacity
- Ableton Live
- Adobe Audition
- vocalremover.org

---

## 🚀 Quick Start

### Step 1: Generate Pitched Versions

Run this command from the project root:

```bash
./generate_pitched_versions.sh
```

This will:
- Find all MP3 files in `public/audio/`
- Generate 25 pitched versions of each (-12 to +12 semitones)
- Save them to `public/audio/pitched/`
- Use high-quality processing with formant preservation

**Example output:**
```
Processing: gavriel.mp3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/25] Generating -12 semitones...
[2/25] Generating -11 semitones...
...
[25/25] Generating +12 semitones...
✓ Completed: gavriel (25 versions)
```

### Step 2: Refresh Browser

That's it! Refresh your browser and the pitch slider will now use the high-quality pre-generated files.

---

## ⏱️ Processing Time

**Typical processing time per song:**
- 3-minute song: ~2-3 minutes total (for all 25 versions)
- 5-minute song: ~4-5 minutes total

Each version is processed in parallel on your CPU.

---

## 📊 Storage Requirements

Each pitched version is approximately the same size as your original file.

**Example:**
- Original file: 5 MB
- 25 pitched versions: ~125 MB total
- For 10 songs: ~1.25 GB

Make sure you have enough disk space!

---

## 🎯 Quality Settings

The script uses these Rubber Band settings for best quality:

```bash
rubberband \
    --pitch $pitch \          # Pitch shift in semitones
    --crisp 5 \               # Highest quality (0-6, default 5)
    --formant \               # Preserve vocal formants
    --threads                 # Use multiple CPU cores
```

These are **professional settings** that preserve:
- ✅ Vocal clarity
- ✅ Natural timbre
- ✅ No robotic artifacts
- ✅ Perfect tempo (no speed change)

---

## 📁 File Structure After Processing

```
public/audio/
├── gavriel.mp3                 # Original files (keep these)
├── yarok.mp3
└── pitched/                    # Generated files
    ├── gavriel_-12.mp3
    ├── gavriel_-11.mp3
    ├── ...
    ├── gavriel_0.mp3           # Copy of original
    ├── gavriel_+1.mp3
    ├── ...
    ├── gavriel_+12.mp3
    ├── yarok_-12.mp3
    ├── yarok_-11.mp3
    └── ... (etc)
```

---

## 🔄 Adding New Songs

When you add a new song:

1. **Add the MP3** to `public/audio/`
2. **Update manifest** in `public/tracks.manifest.json`
3. **Run the script** again: `./generate_pitched_versions.sh`
   - It will skip existing pitched files
   - Only processes new songs

---

## 🐛 Troubleshooting

### "rubberband: command not found"

```bash
brew install rubberband
```

### "No MP3 files found"

Make sure your MP3s are in `public/audio/` (not in subdirectories).

### "Pitch version not found" error in browser

This means you haven't run the generation script yet.

```bash
./generate_pitched_versions.sh
```

### Script takes too long

This is normal! High-quality pitch shifting is CPU-intensive. 
- Close other apps to free up CPU
- Each version needs to be processed
- Quality takes time!

### Not enough disk space

Each song generates ~25x its original size. Free up space or:
- Use lower bitrate source files (128-192 kbps instead of 320 kbps)
- Process fewer songs at a time
- Delete pitched versions you don't need

---

## 💡 Pro Tips

1. **Source Quality Matters**
   - Use 192-320 kbps MP3s for best results
   - Don't use low-quality files (< 128 kbps)

2. **Batch Processing**
   - Process all songs at once (script is smart)
   - Let it run overnight for large libraries

3. **Version Control**
   - Add `public/audio/pitched/` to `.gitignore` if you don't want to commit generated files
   - Original files should be in git
   - Regenerate on deployment if needed

4. **Caching**
   - The web app caches loaded pitched versions
   - Switching pitch is instant after first load

---

## 🎉 Result

You now have:
- ✅ **Professional-grade pitch shifting** (same quality as vocalremover.org)
- ✅ **Instant pitch changes** (no processing lag)
- ✅ **Perfect vocal quality** (no robotic artifacts)
- ✅ **Static website** (works on any host, no backend needed)

Enjoy your high-quality pitch-shifted music! 🎶

