class UIController {
    constructor() {
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
        this.languageContent = document.getElementById('languageContent');
        
        // State
        this.currentAudioBlob = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File input handling
        this.audioFileInput.addEventListener('change', (event) => {
            if (event.target.files.length > 0) {
                this.handleFileSelection(event.target.files[0]);
            }
        });
        
        // Submit button
        this.submitAudioButton.addEventListener('click', () => this.processAudio());
        
        // File drop zone
        const uploadArea = document.querySelector('.upload-area');
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

    handleFileSelection(file) {
        if (!file.type.startsWith('audio/')) {
            alert('Please select an audio file (.wav or .mp3)');
            return;
        }
        
        this.fileNameDisplay.textContent = file.name;
        this.currentAudioBlob = file;
        
        const blobUrl = URL.createObjectURL(file);
        this.audioPlayer.src = blobUrl;
        this.audioPreview.classList.remove('hidden');
        
        this.resetResults();
    }

    resetResults() {
        this.resultsSection.classList.add('hidden');
        this.languageContent.innerHTML = '<p class="placeholder">Submit audio to detect language</p>';
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

    async processAudio() {
        if (!this.currentAudioBlob) {
            alert('Please select an audio file first');
            return;
        }

        this.showLoader();

        try {
            const formData = new FormData();
            formData.append('audio', this.currentAudioBlob);

            const response = await fetch('http://localhost:5001/classify', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process audio');
            }

            const results = await response.json();
            this.displayResults(results);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }

    displayResults(results) {
        this.resultsSection.classList.remove('hidden');
        
        this.languageContent.innerHTML = `
            <div class="language-result">
                <p>Detected Language:</p>
                <div class="detected-language">${results.detected_language}</div>
                <p>Confidence: ${(results.confidence * 100).toFixed(2)}%</p>
                <div class="language-probabilities">
                    ${Object.entries(results.language_probabilities)
                        .map(([lang, prob]) => `
                            <div class="probability-bar">
                                <span class="lang-name">${lang}</span>
                                <div class="bar">
                                    <div class="fill" style="width: ${prob * 100}%"></div>
                                </div>
                                <span class="prob-value">${(prob * 100).toFixed(1)}%</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
        
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        this.languageContent.innerHTML = `
            <p class="error">${message}</p>
        `;
    }
}

// Initialize the UI controller
new UIController();