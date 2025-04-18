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
                // Validate audio duration (max 2 minutes)
                const audioDuration = await getAudioDuration(audioBlob);
                if (audioDuration > 120) { // 120 seconds = 2 minutes
                    uiController.showError("Recording is too long. Maximum duration is 2 minutes.");
                    return;
                }
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
    
    // Add debouncing to prevent multiple rapid submissions
    let isSubmitting = false;
    
    submitButton.addEventListener('click', async () => {
        if (isSubmitting) {
            return;
        }
        
        if (uiController.currentAudioBlob) {
            isSubmitting = true;
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
            
            uiController.showLoader();
            try {
                const results = await apiService.transcribeAudio(uiController.currentAudioBlob);
                uiController.displayResults(results);
            } catch (error) {
                uiController.showError(error.message || 'Failed to process audio');
            } finally {
                uiController.hideLoader();
                isSubmitting = false;
                submitButton.disabled = false;
                submitButton.innerHTML = '<span class="icon">📤</span> Process Audio';
            }
        } else {
            uiController.showError('Please record or upload an audio file first');
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        recorder.cleanup();
    });
});

// Helper function to get audio duration
async function getAudioDuration(audioBlob) {
    return new Promise((resolve) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.addEventListener('loadedmetadata', () => {
            const duration = audio.duration;
            URL.revokeObjectURL(audioUrl);
            resolve(duration);
        });
        
        audio.addEventListener('error', () => {
            URL.revokeObjectURL(audioUrl);
            resolve(0); // Default to 0 on error
        });
    });
}