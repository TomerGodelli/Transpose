# 🚀 Quick Start Guide

Get your Transpose MP3 library up and running in 3 simple steps!

## Step 1: Add Your MP3 Files

Place your MP3 files in the `public/audio/` directory:

```
public/audio/
  ├── song1.mp3
  ├── song2.mp3
  └── song3.mp3
```

## Step 2: Update the Manifest

Edit `public/tracks.manifest.json`:

```json
{
  "version": 1,
  "tracks": [
    {
      "id": "song1",
      "title": "Your Song Title",
      "artist": "Artist Name",
      "src": "/public/audio/song1.mp3"
    }
  ],
  "prefetch": ["song1"]
}
```

## Step 3: Run a Local Server

Choose one method:

```bash
# Python 3
python -m http.server 8000

# OR Node.js
npx serve

# OR Python 2
python -m SimpleHTTPServer 8000
```

## Step 4: Open in Browser

Navigate to: `http://localhost:8000`

---

## 🎵 Using the App

1. **Select a track** from the library (left panel)
2. **Click play** ▶️
3. **Adjust pitch** with the slider (-12 to +12 semitones)
4. Use **keyboard shortcuts**:
   - `Space` = Play/Pause
   - `←` = Seek -5s
   - `→` = Seek +5s

---

## 📱 Mobile Usage

On mobile devices:
1. Tap a track to open the player
2. Tap "Enable Audio" on iOS devices
3. Use the back button to return to the library

---

## 🔧 Troubleshooting

**No tracks appear?**
- Check that MP3 files exist in `public/audio/`
- Verify `tracks.manifest.json` is valid JSON
- Check browser console for errors (F12)

**Audio doesn't play on iOS?**
- Tap the "Enable Audio" button when prompted
- This is required by iOS for security reasons

**Pitch slider doesn't work?**
- Your browser may not support pitch shifting
- The app will still play audio normally
- Try Chrome/Edge for best compatibility

---

## 🌐 Deploy Online

### GitHub Pages:
1. Push to GitHub
2. Settings → Pages
3. Select branch and root folder
4. Done! 🎉

### Other Hosts:
Works on any static hosting:
- Netlify
- Vercel
- Cloudflare Pages
- Firebase Hosting

---

**Need more help?** See the full [README.md](README.md)

