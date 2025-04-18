class UIController {
    constructor() {
        // Tab elements
        this.recordTab = document.getElementById('recordTab');
        this.uploadTab = document.getElementById('uploadTab');
        this.recordContent = document.getElementById('recordContent');
        this.uploadContent = document.getElementById('uploadContent');
        
        // Record elements
        this.recordButton = document.getElementById('recordButton');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.recordingTime = document.getElementById('recordingTime');
        
        // Upload elements
        this.audioFileInput = document.getElementById('audioFileInput');
        this.fileNameDisplay = document.getElementById('fileNameDisplay');
        
        // Preview elements
        this.audioPreview = document.getElementById('audioPreview');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.submitAudioButton = document.getElementById('submitAudioButton');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.processingLoader = document.getElementById('processingLoader');
        this.resultCards = document.getElementById('resultCards');
        this.transcriptionContent = document.getElementById('transcriptionContent');
        this.languageContent = document.getElementById('languageContent');
        this.translationContent = document.getElementById('translationContent');
        
        // State
        this.currentAudioBlob = null;
    }

    setupEventListeners() {
        // Tab switching
        this.recordTab.addEventListener('click', () => this.switchTab('record'));
        this.uploadTab.addEventListener('click', () => this.switchTab('upload'));
        
        // File drop zone
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length) {
                    this.handleFileSelection(e.dataTransfer.files[0]);
                }
            });
        }
    }
    
    switchTab(tabName) {
        if (tabName === 'record') {
            this.recordTab.classList.add('active');
            this.uploadTab.classList.remove('active');
            this.recordContent.classList.add('active');
            this.uploadContent.classList.remove('active');
        } else {
            this.recordTab.classList.remove('active');
            this.uploadTab.classList.add('active');
            this.recordContent.classList.remove('active');
            this.uploadContent.classList.add('active');
        }
    }

    handleFileSelection(file) {
        if (file) {
            // Check if the file is audio
            if (!file.type.startsWith('audio/')) {
                alert('Please select an audio file (.wav or .mp3)');
                return;
            }
            
            this.fileNameDisplay.textContent = file.name;
            
            // Create blob URL for preview
            const blobUrl = URL.createObjectURL(file);
            this.audioPlayer.src = blobUrl;
            this.audioPreview.classList.remove('hidden');
            
            // Store the file as blob
            this.currentAudioBlob = file;
            
            // Reset results when new file is selected
            this.resetResults();
        }
    }

    handleAudioCapture(audioBlob) {
        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(audioBlob);
        this.audioPlayer.src = blobUrl;
        this.audioPreview.classList.remove('hidden');
        
        // Store the audio blob
        this.currentAudioBlob = audioBlob;
    }

    resetResults() {
        this.resultsSection.classList.add('hidden');
        this.transcriptionContent.innerHTML = '<p class="placeholder">Submit audio to see transcription</p>';
        this.languageContent.innerHTML = '<p class="placeholder">Submit audio to detect language</p>';
        this.translationContent.innerHTML = '<p class="placeholder">Submit audio to see translation</p>';
    }

    showLoader() {
        this.resultsSection.classList.remove('hidden');
        this.processingLoader.classList.remove('hidden');
        this.resultCards.classList.add('hidden');
    }

    hideLoader() {
        this.processingLoader.classList.add('hidden');
        this.resultCards.classList.remove('hidden');
    }

    displayResults(results) {
        this.resultsSection.classList.remove('hidden');
        
        // Update transcription
        this.transcriptionContent.innerHTML = `
            <p>${results.transcription || 'No transcription available'}</p>
        `;
        
        // Update language detection with animation
        this.languageContent.innerHTML = `
            <div class="language-result">
                <p>Detected Language:</p>
                <div class="detected-language">${results.detected_language}</div>
                <p>Confidence: High</p>
            </div>
        `;
        
        // Update translation
        this.translationContent.innerHTML = `
            <p>${results.translation || 'No translation available'}</p>
        `;
        
        // Apply fade-in animation to cards
        const cards = this.resultCards.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.2}s`;
            card.style.animationName = 'fadeIn';
            card.style.animationDuration = '0.5s';
            card.style.animationFillMode = 'both';
        });
        
        // Scroll to results with smooth animation
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        this.resultsSection.classList.remove('hidden');
        this.resultCards.classList.remove('hidden');
        
        this.transcriptionContent.innerHTML = `
            <p class="error">${message}</p>
        `;
        
        this.languageContent.innerHTML = `
            <p class="placeholder">No language detected</p>
        `;
        
        this.translationContent.innerHTML = `
            <p class="placeholder">No translation available</p>
        `;
    }
}

export default new UIController();