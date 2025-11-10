#!/usr/bin/env python3
"""
Simple HTTP server with URL routing for Transpose app
Serves index.html for all non-file routes
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 8000

class TransposeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remove trailing slash
        if path.endswith('/') and path != '/':
            path = path[:-1]
        
        # Check if it's a request for a static file (has extension)
        if '.' in os.path.basename(path):
            # Serve static files normally
            return super().do_GET()
        
        # Check if physical file exists
        file_path = path.lstrip('/')
        if file_path and os.path.isfile(file_path):
            return super().do_GET()
        
        # For all other routes (no extension), serve index.html
        # This allows the JavaScript router to handle it
        self.path = '/index.html'
        return super().do_GET()

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Start server
with socketserver.TCPServer(("", PORT), TransposeHTTPRequestHandler) as httpd:
    print(f"✨ Transpose server running at http://localhost:{PORT}")
    print(f"📁 Serving from: {os.getcwd()}")
    print(f"\n🎵 Available URLs:")
    print(f"   - http://localhost:{PORT}/ (All songs)")
    print(f"   - http://localhost:{PORT}/singer1 (Singer 1 collection)")
    print(f"   - http://localhost:{PORT}/singer2 (Singer 2 collection)")
    print(f"   - http://localhost:{PORT}/gavriel (גבריאל player)")
    print(f"   - http://localhost:{PORT}/yarok (עץ ירוק player)")
    print(f"\n⏹️  Press Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")

