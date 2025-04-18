class APIService {
    constructor() {
        // Update this URL to match your backend location
        this.baseUrl = 'http://localhost:5000';
    }

    async transcribeAudio(audioBlob) {
        try {
            // Create a file name with timestamp to avoid caching issues
            const fileName = `recording_${Date.now()}.wav`;
            
            const formData = new FormData();
            formData.append('audio', audioBlob, fileName);

            const response = await fetch(`${this.baseUrl}/transcribe`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to transcribe audio');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}

export default new APIService();