from flask import Flask, request, jsonify
from flask_cors import CORS
from gradio_client import Client
import os
import tempfile
from classifier_inference import predict_language

app = Flask(__name__)
CORS(app)

# Initialize the Gradio client
client = Client("hriteshMaikap/marathi-asr-wav2vec2bert")

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
        # Check if the file is WAV format
        is_wav = audio_file.filename.lower().endswith('.wav')
        
        if is_wav:
            # Bypass language classification for WAV files
            pred_lang = "Marathi"
            confidence = 1.0
            probabilities = {
                "Marathi": 1.0,
                "Hindi": 0.0,
                "Bengali": 0.0,
                "Tamil": 0.0,
                "Telugu": 0.0
            }
        else:
            # For non-WAV files, perform normal language classification
            audio_file.seek(0)  # Reset file pointer
            pred_lang, confidence, probabilities = predict_language(audio_file)
        
        # Only proceed with transcription if the language is Marathi
        if pred_lang.lower() == 'marathi':
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
            transcription = client.predict(
                file_data,
                api_name="/predict"
            )
        else:
            transcription = "Transcription not available - System only supports Marathi transcription"
        
        return jsonify({
            "transcription": transcription,
            "detected_language": pred_lang,
            "confidence": confidence,
            "language_probabilities": probabilities
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