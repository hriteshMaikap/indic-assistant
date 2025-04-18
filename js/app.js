import recorder from './recorder.js';
import apiService from './api.js';
import uiController from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Setup UI controller
    uiController.setupEventListeners();
    
    // Setup record button
    const recordButton = document.getElementById('recordButton');
    recordButton.addEventListener('click', async () => {
        if (recorder.isRecording) {
            // Stop recording
            recordButton.innerHTML = '<span class="icon">🎤</span> Start Recording';
            recordButton.classList.remove('error');
            document.getElementById('recordingIndicator').classList.add('hidden');
            
            const audioBlob = await recorder.stop();
            if (audioBlob) {
                uiController.handleAudioCapture(audioBlob);
            }
        } else {
            // Start recording
            const hasPermission = await recorder.requestMicrophonePermission();
            if (hasPermission && recorder.start()) {
                recordButton.innerHTML = '<span class="icon">⏹️</span> Stop Recording';
                recordButton.classList.add('error');
                document.getElementById('recordingIndicator').classList.remove('hidden');
                uiController.resetResults();
            }
        }
    });
    
    // Setup file input
    const fileInput = document.getElementById('audioFileInput');
    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            uiController.handleFileSelection(event.target.files[0]);
        }
    });
    
    // Setup submit button
    const submitButton = document.getElementById('submitAudioButton');
    submitButton.addEventListener('click', async () => {
        if (uiController.currentAudioBlob) {
            uiController.showLoader();
            try {
                const results = await apiService.transcribeAudio(uiController.currentAudioBlob);
                uiController.displayResults(results);
            } catch (error) {
                uiController.showError(error.message || 'Failed to process audio');
            } finally {
                uiController.hideLoader();
            }
        } else {
            alert('Please record or upload an audio file first');
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        recorder.cleanup();
    });
});