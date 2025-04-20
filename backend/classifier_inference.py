import numpy as np
import librosa
import joblib
import json
import tempfile
import os
import tensorflow as tf
from huggingface_hub import hf_hub_download

REPO_ID = "hriteshMaikap/languageClassifier"
MODEL_FILENAME = "indic_language_classifier_mtm.keras"
SCALER_FILENAME = "audio_feature_scaler_mtm.pkl"
CONFIG_FILENAME = "config_mtm.json"

model_path = hf_hub_download(repo_id=REPO_ID, filename=MODEL_FILENAME)
scaler_path = hf_hub_download(repo_id=REPO_ID, filename=SCALER_FILENAME)
config_path = hf_hub_download(repo_id=REPO_ID, filename=CONFIG_FILENAME)

with open(config_path, "r") as f:
    config = json.load(f)
n_mfcc = config["n_mfcc"]
max_pad_len = config["max_pad_len"]
feature_type = config["feature_type"]
class_labels = config["class_labels"]

scaler = joblib.load(scaler_path)
model = tf.keras.models.load_model(model_path)

def extract_features(file_path, n_mfcc, max_pad_len, feature_type):
    audio, sample_rate = librosa.load(file_path, sr=None, res_type='kaiser_fast')
    mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=n_mfcc)
    if feature_type == 'mfcc_delta':
        delta_mfccs = librosa.feature.delta(mfccs)
        delta2_mfccs = librosa.feature.delta(mfccs, order=2)
        features = np.concatenate((mfccs, delta_mfccs, delta2_mfccs), axis=0)
    elif feature_type == 'mfcc':
        features = mfccs
    else:
        features = mfccs
    current_len = features.shape[1]
    if current_len > max_pad_len:
        features = features[:, :max_pad_len]
    elif current_len < max_pad_len:
        pad_width = max_pad_len - current_len
        features = np.pad(features, pad_width=((0, 0), (0, pad_width)), mode='constant')
    return features.T

def preprocess_audio(file_path):
    features = extract_features(file_path, n_mfcc, max_pad_len, feature_type)
    if features is None:
        raise ValueError("Feature extraction failed.")
    features_scaled = scaler.transform(features)
    return features_scaled[np.newaxis, :, :]

def predict_language(audio_file):
    if hasattr(audio_file, "read"):
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_file.read())
            tmp_path = tmp.name
    else:
        tmp_path = audio_file
    try:
        features = preprocess_audio(tmp_path)
        pred_probs = model.predict(features)
        pred_idx = np.argmax(pred_probs, axis=1)[0]
        pred_lang = class_labels[pred_idx]
        confidence = float(pred_probs[0, pred_idx])
        return pred_lang, confidence, {l: float(p) for l, p in zip(class_labels, pred_probs[0])}
    finally:
        if hasattr(audio_file, "read"):
            os.remove(tmp_path)