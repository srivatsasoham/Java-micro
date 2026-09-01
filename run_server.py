"""
AI Industrial Visual Inspection & QMS Local Server Launcher
Launches local web server for development, testing, and demonstration.
"""
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(__file__), "public")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print("🏭 AI Industrial Visual Inspection & Quality Management System")
        print(f"🌐 Server running at: {url}")
        print(f"📂 Serving directory: {DIRECTORY}")
        print("⚡ Press Ctrl+C to stop the server")
        print("=" * 60)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()
