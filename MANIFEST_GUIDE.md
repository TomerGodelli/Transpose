# Manifest File Guide

## Working with Hebrew Text

The `tracks.manifest.json` file contains Hebrew text mixed with English. This can cause display issues in some text editors.

### Important Notes

1. **File Encoding**: The file MUST be saved as UTF-8 (without BOM)
2. **Visual Display**: Hebrew text may appear reversed or jumbled in some editors, but this is just a visual issue
3. **Actual Content**: The file content is correct and will display properly in the browser

### Editor Settings

Most modern editors (VS Code, Cursor, Sublime Text, etc.) support bidirectional text. Make sure:

- File encoding is set to UTF-8
- The `.editorconfig` file in the root directory is being used
- Your editor supports RTL (Right-to-Left) text

### VS Code / Cursor Specific

If you're using VS Code or Cursor, you can:

1. Open Settings (Cmd/Ctrl + ,)
2. Search for "files.encoding"
3. Ensure it's set to "utf8"

### Verifying the File

To verify the file is correct, run the server and check the website. The Hebrew text should display correctly in the browser even if it looks wrong in your editor.

### Testing

```bash
# Start the server
cd /Users/tomer.godelli/Transpose
python3 server.py

# Visit http://localhost:8000
```

The Hebrew text will appear correctly in the browser interface.

## File Structure

```json
{
  "version": 1,
  "tracks": [
    {
      "id": "song_id",           // English, used in URLs
      "title": "שם השיר",        // Hebrew song title
      "artist": "שם האמן",       // Hebrew artist name
      "src": "/public/audio/song.mp3"
    }
  ],
  "collections": {
    "collection_id": {           // English, used in URLs
      "name": "שם הזמר",         // Hebrew collection name
      "tracks": ["song1", "song2"]
    }
  }
}
```

## Common Issues

### Issue: Text appears backwards in editor
**Solution**: This is visual only. The file is correct. Verify in browser.

### Issue: Mixed Hebrew and English looks jumbled
**Solution**: This is normal for bidirectional text in plain text editors. The browser handles it correctly.

### Issue: Special characters appear as �
**Solution**: Ensure file encoding is UTF-8, not ASCII or other encoding.

