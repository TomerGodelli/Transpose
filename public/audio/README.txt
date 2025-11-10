Audio Files Directory
=====================

Place your MP3 files in this directory.

Example files:
- sample1.mp3
- sample2.mp3
- sample3.mp3

After adding MP3 files, update the ../tracks.manifest.json file with:
- Unique ID for each track
- Track title
- Artist name
- Path to the MP3 file (relative to the project root)

Example manifest entry:
{
  "id": "my-song",
  "title": "My Song Title",
  "artist": "Artist Name",
  "src": "/public/audio/my-song.mp3"
}

Note: This is a placeholder directory. You need to add your own MP3 files.
The app will work once you add actual MP3 files and update the manifest.

For testing, you can use royalty-free music from:
- Free Music Archive (freemusicarchive.org)
- Incompetech (incompetech.com)
- YouTube Audio Library
- or your own music files

