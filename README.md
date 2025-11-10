# 🎵 Transpose - Static MP3 Library

A fully client-side web app that plays MP3s with real-time pitch shifting, powered by Tone.js and the Web Audio API.

## ✨ Features

- **🎼 Real-time Pitch Shifting**: Transpose tracks up to ±12 semitones without changing tempo
- **📚 Static Library**: All audio files stored in the repository
- **📱 Responsive Design**: Works on desktop and mobile devices
- **⌨️ Keyboard Shortcuts**: Space to play/pause, arrow keys to seek
- **🔍 Search**: Filter tracks by title or artist
- **⚡ Smart Loading**: Prefetch selected tracks, lazy-load others
- **🎨 Modern UI**: Beautiful, accessible interface built with TailwindCSS
- **🍎 iOS Compatible**: Handles iOS autoplay restrictions gracefully
- **♿ Accessible**: Full ARIA labels and keyboard navigation

## 🚀 Quick Start

### Local Development

1. **Clone or download this repository**

2. **Add your MP3 files** to the `/public/audio/` directory

3. **Update the manifest** in `public/tracks.manifest.json`:
   ```json
   {
     "version": 1,
     "tracks": [
       {
         "id": "unique-id",
         "title": "Track Title",
         "artist": "Artist Name",
         "src": "/public/audio/your-file.mp3"
       }
     ],
     "prefetch": ["unique-id"]
   }
   ```

4. **Serve the app** using a static file server:
   ```bash
   # Option 1: Using Python
   python -m http.server 8000
   
   # Option 2: Using npx
   npx serve
   
   # Option 3: Using Node.js http-server
   npx http-server
   ```

5. **Open in browser**: Navigate to `http://localhost:8000` (or the port shown)

### Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Select the branch and root directory
4. Your app will be live at `https://username.github.io/repository-name/`

**Important**: Update the `src` paths in `tracks.manifest.json` to match your deployment URL if needed.

## 📖 How to Use

### Adding Tracks

1. Place your MP3 files in the `/public/audio/` directory
2. Edit `public/tracks.manifest.json` to add track metadata
3. Refresh the app - new tracks will appear automatically

### Removing Tracks

1. Delete the MP3 file from `/public/audio/`
2. Remove the track entry from `tracks.manifest.json`

### Prefetching Tracks

To make certain tracks load faster on app startup, add their IDs to the `prefetch` array:

```json
{
  "prefetch": ["song1", "song2"]
}
```

Prefetched tracks will be downloaded when the app loads, making playback instant.

### Keyboard Shortcuts

- **Space**: Play/Pause current track
- **←** (Left Arrow): Seek backward 5 seconds
- **→** (Right Arrow): Seek forward 5 seconds

## 🎛️ Controls

### Player Controls
- **Play/Pause**: Start or pause playback
- **Seek Bar**: Click or drag to jump to any position
- **Time Display**: Shows current time and total duration

### Volume Controls
- **Volume Slider**: Adjust playback volume (0-100%)
- **Mute Button**: Toggle mute on/off

### Pitch Transpose
- **Pitch Slider**: Shift pitch from -12 to +12 semitones
- **Reset Button**: Return pitch to 0 (original)
- **Live Adjustment**: Change pitch in real-time while playing

## 🌐 Browser Support

### Fully Supported
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ iOS Safari (requires initial tap to enable audio)

### Degraded Mode
If pitch shifting is not available in your browser, the app will:
- Show a notice at the top
- Disable the pitch slider
- Continue to work for normal playback

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Audio Engine**: Tone.js (MIT License)
- **Styling**: TailwindCSS (via CDN)
- **Data Source**: Static JSON manifest

### Audio Graph
```
Tone.Player → Tone.PitchShift → Tone.Volume → Destination
```

### File Structure
```
/
├── index.html              # Main HTML file
├── app.js                  # Application logic
├── README.md               # This file
└── public/
    ├── audio/              # MP3 files go here
    │   ├── sample1.mp3
    │   ├── sample2.mp3
    │   └── ...
    └── tracks.manifest.json # Track metadata
```

## 🔧 Advanced Configuration

### Manifest Schema

```json
{
  "version": 1,
  "tracks": [
    {
      "id": "string (unique identifier)",
      "title": "string (display name)",
      "artist": "string (artist name)",
      "src": "string (path to MP3 file)"
    }
  ],
  "prefetch": ["array of track IDs to preload"]
}
```

### Loading Strategy

1. **Startup**: App loads `tracks.manifest.json`
2. **Prefetch**: Downloads tracks listed in `prefetch` array
3. **On-Demand**: Other tracks load when selected
4. **Caching**: Browser handles caching automatically

### Pitch Shifting Quality

**Note:** This app uses Tone.js for real-time pitch shifting, which is optimized for speed in browsers. The quality is limited by:
- **Algorithm**: Uses granular synthesis (not phase vocoder)
- **Real-time constraint**: Must process audio instantly in the browser
- **Window Size**: Currently set to 0.03 (balance between quality and artifacts)

**For best results:**
- Small pitch shifts (±3 semitones) sound better than large ones
- Instrumental tracks generally shift better than vocals
- Higher bitrate MP3s (192-320 kbps) preserve more detail

**For professional quality:** Sites like vocalremover.org use server-side processing with professional algorithms (Rubber Band, Elastique) which produce much better results but require a backend.

## 🔒 Privacy & Security

- **No Telemetry**: Zero tracking or analytics
- **No External Calls**: Except for CDN scripts (Tone.js, Tailwind)
- **Fully Local**: All audio files stored in your repository
- **No Backend**: Everything runs in the browser

## ⚠️ Limitations

1. **Storage**: All MP3s must fit in your repository/hosting
2. **Load Time**: Large files take longer to load on first play
3. **Mobile Data**: Consider data usage when loading tracks
4. **Pitch Quality**: Extreme transpositions (±10+ semitones) may sound degraded
5. **iOS**: Requires user interaction before audio can play

## 🐛 Troubleshooting

### Tracks don't appear
- Check that `tracks.manifest.json` is valid JSON
- Verify MP3 file paths match the `src` values
- Open browser console to see error messages

### Audio doesn't play
- On iOS: Tap the "Enable Audio" button
- Check browser console for errors
- Verify MP3 files are accessible

### Pitch slider doesn't work
- Your browser may not support PitchShift
- App will show a notice and continue without pitch control
- Try using Chrome/Edge for best compatibility

### Playback is choppy
- Large MP3 files may cause stuttering on slow devices
- Consider using lower bitrate files (128-192 kbps)
- Close other browser tabs to free resources

## 📜 Licenses

### This Project
This project is provided as-is for personal and educational use.

### Dependencies
- **Tone.js**: MIT License - [https://tonejs.github.io/](https://tonejs.github.io/)
- **Tailwind CSS**: MIT License - [https://tailwindcss.com/](https://tailwindcss.com/)

## 🤝 Contributing

Since this is a static, standalone app, you can freely modify:
- `index.html` - Adjust layout and structure
- `app.js` - Customize behavior and features
- `tracks.manifest.json` - Add your own tracks

## 💡 Tips

1. **Organize Your Library**: Use consistent naming in the manifest
2. **Optimize MP3s**: Use 192 kbps or lower for faster loading
3. **Prefetch Favorites**: Add frequently played tracks to `prefetch`
4. **Backup Manifest**: Keep a copy of your `tracks.manifest.json`
5. **Test on Mobile**: Ensure your tracks work on iOS Safari

## 🎯 Roadmap / Future Ideas

- Playlist support
- Loop/repeat controls
- Equalizer
- Playback speed control
- IndexedDB caching for offline use
- Full PWA with service worker

## 📞 Support

For issues with:
- **Tone.js**: Visit [Tone.js GitHub](https://github.com/Tonejs/Tone.js)
- **Web Audio API**: Check [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Enjoy your music with perfect pitch! 🎶**

