# 🎵 Collections Feature - Usage Guide

## Overview

Collections allow you to create custom song lists for different singers or purposes. Each collection gets its own URL.

---

## 📋 How to Create Collections

Edit `public/tracks.manifest.json` and add a `collections` section:

```json
{
  "version": 1,
  "tracks": [
    {
      "id": "gavriel",
      "title": "גבריאל",
      "artist": "עופרה חזה",
      "src": "/public/audio/gavriel.mp3"
    },
    {
      "id": "yarok",
      "title": "עץ ירוק מפלסטיק",
      "artist": "מרגול",
      "src": "/public/audio/yarok.mp3"
    }
  ],
  "collections": {
    "singer1": {
      "name": "Singer 1",
      "tracks": ["gavriel", "yarok"]
    },
    "singer2": {
      "name": "Singer 2",
      "tracks": ["gavriel"]
    }
  }
}
```

---

## 🌐 Collection URLs

Each collection gets its own URL:

| Collection ID | URL | Songs |
|--------------|-----|-------|
| `singer1` | `http://localhost:8000/singer1` | גבריאל, עץ ירוק מפלסטיק |
| `singer2` | `http://localhost:8000/singer2` | גבריאל only |

### All Songs
- **URL**: `http://localhost:8000/`
- Shows all tracks in the manifest

---

## 💡 Use Cases

### 1. Different Singers
Create a collection for each singer with only their songs:

```json
"collections": {
  "david": {
    "name": "David's Songs",
    "tracks": ["song1", "song2", "song3"]
  },
  "sarah": {
    "name": "Sarah's Songs", 
    "tracks": ["song4", "song5"]
  }
}
```

Send each singer their personal link:
- David: `http://yoursite.com/david`
- Sarah: `http://yoursite.com/sarah`

### 2. By Genre/Style
```json
"collections": {
  "ballads": {
    "name": "Slow Ballads",
    "tracks": ["song1", "song3"]
  },
  "upbeat": {
    "name": "Upbeat Songs",
    "tracks": ["song2", "song4"]
  }
}
```

### 3. By Practice Session
```json
"collections": {
  "monday": {
    "name": "Monday Rehearsal",
    "tracks": ["song1", "song2"]
  },
  "thursday": {
    "name": "Thursday Rehearsal",
    "tracks": ["song3", "song4", "song5"]
  }
}
```

---

## ⚙️ Technical Details

### URL Routing

- `/` → All tracks
- `/singer1` → Collection "singer1"
- `/gavriel` → Individual song player

The app automatically detects if the path is a collection ID or song ID.

### Track Filtering

Only tracks specified in the collection's `tracks` array will be shown and loaded. This means:

✅ **Faster loading** - Only relevant songs are prefetched
✅ **Better performance** - Less memory usage
✅ **Cleaner UI** - Singers only see their songs

### Smart Prefetching

The app now intelligently prefetches audio:

1. **On page load**: Prefetches pitch 0 and ±1 for the current track
2. **After pitch change**: Prefetches the next/previous pitch in the background
3. **Collection-aware**: Only prefetches songs in the current collection

**Example flow:**
```
User clicks song → Load pitch 0
                 → Prefetch pitch -1 and +1 in background
User changes to +2 → Load pitch +2
                   → Prefetch pitch +1 and +3 in background
```

This ensures near-instant pitch changes!

---

## 🔗 Sharing Collections

### Method 1: Direct Links
Send the collection URL directly:
```
https://yoursite.com/singer1
```

### Method 2: QR Codes
Generate QR codes for each collection URL and print them out.

### Method 3: Short URLs
Use a URL shortener:
- Original: `https://yoursite.com/singer1`
- Shortened: `https://bit.ly/singer1-practice`

---

## 📝 Example Manifest

Complete example with multiple collections:

```json
{
  "version": 1,
  "tracks": [
    {
      "id": "song1",
      "title": "Song One",
      "artist": "Artist A",
      "src": "/public/audio/song1.mp3"
    },
    {
      "id": "song2",
      "title": "Song Two",
      "artist": "Artist B",
      "src": "/public/audio/song2.mp3"
    },
    {
      "id": "song3",
      "title": "Song Three",
      "artist": "Artist A",
      "src": "/public/audio/song3.mp3"
    },
    {
      "id": "song4",
      "title": "Song Four",
      "artist": "Artist C",
      "src": "/public/audio/song4.mp3"
    }
  ],
  "collections": {
    "soprano": {
      "name": "Soprano Parts",
      "tracks": ["song1", "song2"]
    },
    "alto": {
      "name": "Alto Parts",
      "tracks": ["song2", "song3"]
    },
    "rehearsal": {
      "name": "This Week's Rehearsal",
      "tracks": ["song1", "song3", "song4"]
    },
    "concert": {
      "name": "Concert Program",
      "tracks": ["song1", "song2", "song3", "song4"]
    }
  },
  "prefetch": ["song1"]
}
```

---

## ✨ New Features Summary

### 1. Light Theme
- Clean, modern white background
- Soft gradients (pink/blue/purple)
- Better readability

### 2. +/− Pitch Buttons
- Replaced slider with increment/decrement buttons
- Large, clear display of current pitch value
- Buttons disabled at limits (-12/+12)

### 3. Improved Seeking
- Scrubbing the seek bar doesn't pause playback
- Music continues playing while you drag
- Jumps to new position when you release

### 4. Smart Prefetching
- Loads pitch 0, -1, +1 on track start
- Prefetches next pitch after each change
- Near-instant pitch switching

### 5. Collections
- Create custom song lists
- Each collection has its own URL
- Share specific songs with specific people

---

**Happy transposing! 🎶**

