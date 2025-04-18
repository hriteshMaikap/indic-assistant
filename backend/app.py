from flask import Flask, request, jsonify
from flask_cors import CORS
from gradio_client import Client
import os
import tempfile
import random
import json

app = Flask(__name__)
CORS(app)

# Initialize the Gradio client
client = Client("hriteshMaikap/marathi-asr-wav2vec2bert")

# List of supported Indic languages
LANGUAGES = ["Hindi", "Marathi", "Bengali", "Tamil", "Telugu"]

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    
    # Save the uploaded file temporarily
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, "audio_file.wav")
    audio_file.save(temp_path)
    
    try:
        # Create the file data structure that Gradio expects
        file_data = {
            "path": temp_path,
            "orig_name": audio_file.filename,
            "size": os.path.getsize(temp_path),
            "mime_type": "audio/wav",
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
        os.rmdir(temp_dir)

if __name__ == "__main__":
    app.run(debug=True, port=5000)