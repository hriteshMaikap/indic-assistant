from flask import Flask, request, jsonify
from flask_cors import CORS
from gradio_client import Client
import os
import tempfile
import random
import time
from functools import wraps
import hashlib
import re

app = Flask(__name__)
CORS(app)

# Initialize the Gradio client
client = Client("hriteshMaikap/marathi-asr-wav2vec2bert")

# List of supported Indic languages
LANGUAGES = ["Hindi", "Marathi", "Bengali", "Tamil", "Telugu"]

# Rate limiting configuration
RATE_LIMIT = {
    'window': 3600,  # 1 hour window (in seconds)
    'max_requests': 10  # Max 10 requests per hour per IP
}

# Store for rate limiting
# Structure: {ip: [(timestamp1, file_hash1), (timestamp2, file_hash2), ...]}
request_store = {}

# Max file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg'}
ALLOWED_MIME_TYPES = {'audio/wav', 'audio/mpeg', 'audio/ogg'}

def get_file_extension(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = request.remote_addr
        current_time = time.time()
        
        # Initialize if IP not in store
        if ip not in request_store:
            request_store[ip] = []
        
        # Clean expired entries
        request_store[ip] = [req for req in request_store[ip] 
                           if current_time - req[0] < RATE_LIMIT['window']]
        
        # Check current request count
        if len(request_store[ip]) >= RATE_LIMIT['max_requests']:
            return jsonify({
                "error": "Rate limit exceeded. Try again later."
            }), 429
            
        # File validation and duplicate check happens inside the route
        return f(*args, **kwargs)
    return decorated_function

def sanitize_filename(filename):
    """Remove potentially dangerous characters from filename"""
    return re.sub(r'[^\w\.-]', '_', filename)

@app.route('/transcribe', methods=['POST'])
@rate_limit
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    
    # Basic validation
    if not audio_file.filename:
        return jsonify({"error": "Invalid file"}), 400
    
    # Validate file extension
    file_ext = get_file_extension(audio_file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        }), 400
    
    # Validate MIME type
    if audio_file.content_type not in ALLOWED_MIME_TYPES:
        return jsonify({"error": "Invalid audio file type"}), 400
    
    # Create a safe filename
    safe_filename = sanitize_filename(audio_file.filename)
    
    # Check file size (in memory)
    audio_file.seek(0, os.SEEK_END)
    file_size = audio_file.tell()
    audio_file.seek(0)  # Reset file pointer
    
    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"}), 413
    
    # Save the uploaded file temporarily
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, f"audio_{int(time.time())}.{file_ext}")
    
    try:
        audio_file.save(temp_path)
        
        # Calculate file hash to prevent duplicate submissions
        file_hash = calculate_file_hash(temp_path)
        ip = request.remote_addr
        
        # Check if this exact file was recently processed by this IP
        for timestamp, prev_hash in request_store[ip]:
            if prev_hash == file_hash:
                return jsonify({"error": "Duplicate file submission"}), 429
        
        # Add to request store
        request_store[ip].append((time.time(), file_hash))
        
        # Create the file data structure that Gradio expects
        file_data = {
            "path": temp_path,
            "orig_name": safe_filename,
            "size": os.path.getsize(temp_path),
            "mime_type": audio_file.content_type,
            "is_stream": False,
            "meta": {"_type": "gradio.FileData"}
        }
        
        # Call the API to transcribe
        result = client.predict(
            file_data,
            api_name="/predict"
        )
        
        # In a real application, we would use a proper language detection model
        # For demo purposes, we're using a simple simulation
        detected_language = random.choice(LANGUAGES)
        
        # Placeholder for translation
        translation = f"This is a simulated translation of the transcribed text (detected as {detected_language})"
        
        return jsonify({
            "transcription": result,
            "detected_language": detected_language,
            "translation": translation
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        try:
            os.rmdir(temp_dir)
        except:
            pass  # Directory might not be empty or might have been removed

# Add security headers to all responses
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; connect-src 'self'"
    return response

if __name__ == "__main__":
    app.run(debug=False, port=5000)  # Set debug to False in production