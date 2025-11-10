# GitHub Pages Deployment Checklist

Use this checklist before deploying to GitHub Pages.

## Pre-Deployment Checklist

### ✅ Required Files
- [x] `404.html` - Created for client-side routing
- [x] `index.html` - Updated with redirect handler
- [x] `.gitignore` - Configured properly
- [x] `player.js` - Player logic
- [x] `manifest.webmanifest` - PWA manifest
- [x] `public/tracks.manifest.json` - Song metadata

### 🎵 Audio Files
- [ ] All original MP3s in `/public/audio/`
- [ ] All pitched versions generated (`./generate_pitched_versions.sh`)
- [ ] Each song has 13 pitched versions (_-6 to _+6)
- [ ] Verify total: 18 songs × 13 versions = 234 pitched files

### 🧪 Local Testing
- [ ] Test with static server: `python3 -m http.server 8000`
- [ ] Test home page: `http://localhost:8000`
- [ ] Test collections: `http://localhost:8000/hof`
- [ ] Test individual songs: `http://localhost:8000/gavriel`
- [ ] Test pitch shifting works (all -6 to +6)
- [ ] Test seek slider
- [ ] Test keyboard shortcuts
- [ ] Test on mobile (responsive)

### 📝 Content Review
- [ ] All song titles filled in `tracks.manifest.json`
- [ ] All artist names filled in
- [ ] Collection names are correct
- [ ] Hebrew text displays correctly

### 🔧 Configuration
- [ ] Service worker disabled OR cache version updated
- [ ] Browser cache cleared for testing
- [ ] No console errors in browser DevTools

## Deployment Steps

### 1. Initialize Git Repository
```bash
cd /Users/tomer.godelli/Transpose
git init
```

### 2. Initial Commit
```bash
git add .
git commit -m "Initial commit: Music player with pitch shifting"
```

### 3. Create GitHub Repository
- Go to GitHub.com
- Create new repository
- Copy the repository URL

### 4. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 5. Enable GitHub Pages
- Go to repo Settings → Pages
- Source: Deploy from branch `main` / `root`
- Save and wait 1-3 minutes

### 6. Verify Deployment
- [ ] Visit: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- [ ] Test all routes work
- [ ] Test audio playback
- [ ] Test pitch shifting
- [ ] Check browser console for errors

## Post-Deployment

### Update Checklist
- [ ] Add repository URL to README
- [ ] Update documentation with live URL
- [ ] Share link with users

### Maintenance
- [ ] Monitor repository size (keep under 1 GB)
- [ ] Consider Git LFS for audio files if needed
- [ ] Update cache version when making changes

## Common Issues & Solutions

### Audio files not playing
→ Check console for 404 errors
→ Verify pitched versions exist
→ Check file paths in manifest

### Routing not working
→ Verify 404.html exists in repo root
→ Check redirect handler in index.html
→ Hard refresh browser (Cmd+Shift+R)

### Old version showing
→ Clear browser cache
→ Unregister service worker
→ Wait 3-5 minutes for GitHub Pages update

---

## Quick Deploy Commands

```bash
# From project root
cd /Users/tomer.godelli/Transpose

# Test locally first
python3 -m http.server 8000

# When ready to deploy
git add .
git commit -m "Your commit message"
git push origin main
```

---

**Ready to deploy?** Follow the detailed guide in `GITHUB_PAGES_DEPLOY.md`

