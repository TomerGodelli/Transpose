# GitHub Pages Deployment Guide

## Prerequisites

✅ **Files Created:**
- `404.html` - Handles client-side routing redirects
- Updated `index.html` - Handles redirects from 404

## Step-by-Step Deployment

### 1. **Prepare Your Repository**

```bash
cd /Users/tomer.godelli/Transpose

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for GitHub Pages"
```

### 2. **Create GitHub Repository**

1. Go to GitHub.com and create a new repository
2. Name it (e.g., `transpose` or `music-player`)
3. Do **NOT** initialize with README (you already have files)

### 3. **Push to GitHub**

```bash
# Add remote (replace USERNAME and REPO with your GitHub username and repo name)
git remote add origin https://github.com/USERNAME/REPO.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 4. **Enable GitHub Pages**

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main` / `root`
4. Click **Save**

### 5. **Wait for Deployment**

- GitHub Pages will build and deploy (usually 1-3 minutes)
- Your site will be available at: `https://USERNAME.github.io/REPO/`

## Important Notes

### ⚠️ **Path Configuration**

If your site is NOT at the root (e.g., `https://username.github.io/transpose/`), you need to update paths:

**Option A: Use Custom Domain (Recommended)**
- Set up a custom domain in GitHub Pages settings
- No path changes needed

**Option B: Update Base Path**
- You'll need to add the repo name to all paths
- Update `/public/` to `/REPO/public/` throughout the code

### 📁 **Required Files Structure**

Your repo should have this structure:
```
/
├── index.html          ← Main entry point
├── 404.html           ← Handles routing
├── player.js          ← Player logic
├── server.py          ← NOT used on GitHub Pages
├── manifest.webmanifest
├── sw.js              ← Service worker (optional)
└── public/
    ├── audio/
    │   ├── song1.mp3
    │   └── pitched/
    │       ├── song1_-6.mp3
    │       ├── song1_0.mp3
    │       ├── song1_+6.mp3
    │       └── ...
    └── tracks.manifest.json
```

### 🎵 **Audio Files**

**IMPORTANT:** You need to include ALL pitched versions in your repository:
- Original audio files in `/public/audio/`
- All 13 pitched versions per song in `/public/audio/pitched/`
- Each song needs: `_-6.mp3` through `_+6.mp3` (13 files × 18 songs = 234 files)

**Repository Size Warning:**
- Audio files can make your repo very large
- GitHub recommends repos under 1 GB
- Consider using Git LFS for large files if needed

### 🔧 **Service Worker**

The service worker (`sw.js`) may cause caching issues during development:

**Option 1: Disable It**
Remove or comment out the service worker registration in `index.html`

**Option 2: Update Cache Version**
Every time you update the site, increment the cache version in `sw.js`

### 🔄 **Custom Domain (Optional)**

To use a custom domain like `music.yourdomain.com`:

1. Add a `CNAME` file to your repo root:
   ```
   music.yourdomain.com
   ```

2. Configure DNS:
   - Add a CNAME record pointing to `username.github.io`

3. Enable HTTPS in GitHub Pages settings

## Testing Locally (Simulating GitHub Pages)

Since GitHub Pages doesn't have a backend server, test with a simple static server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node (if you have it)
npx serve
```

Visit `http://localhost:8000` and test all routes:
- Home: `/`
- Collections: `/hof`, `/ravid`, etc.
- Individual songs: `/gavriel`, `/yarok`, etc.

## Troubleshooting

### Issue: 404 on Collection URLs
**Solution:** Make sure `404.html` is in the repo root

### Issue: Audio files not loading
**Solution:** Check that `/public/audio/pitched/` contains all pitched versions

### Issue: Old version still showing
**Solution:** 
1. Clear browser cache (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
2. Unregister service worker in DevTools
3. Update cache version in `sw.js` if enabled

### Issue: Site works locally but not on GitHub Pages
**Solution:** Check browser console for errors. Most common:
- Missing files (404s)
- Path issues (if not at root domain)
- CORS issues (shouldn't happen with GitHub Pages)

## Updating Your Site

After making changes:

```bash
# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push
git push origin main
```

GitHub Pages will automatically rebuild (1-3 minutes).

## Performance Tips

1. **Use Git LFS** for large audio files
2. **Compress audio files** before uploading (but maintain quality)
3. **Enable caching** with proper service worker configuration
4. **Consider CDN** for audio files if repo gets too large

## Alternative: Use GitHub + External Audio Hosting

If your repo becomes too large:

1. Host audio files elsewhere (AWS S3, Cloudflare R2, etc.)
2. Update `tracks.manifest.json` to point to external URLs
3. Keep only the code in GitHub

Example:
```json
{
  "id": "song",
  "title": "Song Title",
  "artist": "Artist",
  "src": "https://your-cdn.com/audio/song.mp3"
}
```

## Security Notes

- All files are public on GitHub Pages
- Don't commit sensitive data (API keys, passwords, etc.)
- The `.gitignore` file should exclude any private config

---

**Need Help?** Check the [GitHub Pages documentation](https://docs.github.com/en/pages)

