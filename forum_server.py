#!/usr/bin/env python3
"""
Simple forum server for ClawCraft
Serves the static forum and provides basic API endpoints
"""

import http.server
import socketserver
import json
import os
import threading
from urllib.parse import urlparse, parse_qs
import time

class ForumHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="/root/projects/clawcraft/forum", **kwargs)
    
    def do_GET(self):
        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = {
                "forum": "online",
                "timestamp": int(time.time()),
                "server": "89.167.28.237:25565",
                "status": "healthy"
            }
            
            self.wfile.write(json.dumps(status).encode())
        else:
            super().do_GET()
    
    def log_message(self, format, *args):
        # Suppress logging for cleaner output
        pass

def start_forum_server():
    PORT = 3001
    
    with socketserver.TCPServer(("0.0.0.0", PORT), ForumHandler) as httpd:
        print(f"🌐 Forum server starting on port {PORT}")
        print(f"📍 External access: http://89.167.28.237:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Forum server stopped")
            httpd.shutdown()

if __name__ == "__main__":
    start_forum_server()