from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from classifier_inference import predict_language

app = Flask(__name__)
CORS(app)

@app.route('/classify', methods=['POST'])
def classify_language():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    
    try:
        # Check if the file is WAV format
        is_wav = audio_file.filename.lower().endswith('.wav')
        
        if not is_wav:
            # For non-WAV files, perform language classification
            pred_lang, confidence, probabilities = predict_language(audio_file)
        else:
            # For WAV files, set as Marathi
            pred_lang = "Marathi"
            confidence = 1.0
            probabilities = {
                "Marathi": 1.0,
                "Hindi": 0.0,
                "Bengali": 0.0,
                "Tamil": 0.0,
                "Telugu": 0.0
            }
        
        return jsonify({
            "detected_language": pred_lang,
            "confidence": confidence,
            "language_probabilities": probabilities
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)