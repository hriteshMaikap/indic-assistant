class APIService {
    constructor() {
        // Update this URL to match your backend location
        this.baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://your-production-backend-url.onrender.com' // Update this with your actual production URL
            : 'http://localhost:5000';
            
        // Track last request time to prevent rapid submissions
        this.lastRequestTime = 0;
        this.MIN_REQUEST_INTERVAL = 3000; // 3 seconds
    }

    async transcribeAudio(audioBlob) {
        try {
            // Check if user is making too many requests
            const now = Date.now();
            if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
                throw new Error('Please wait a moment before submitting another request.');
            }
            
            this.lastRequestTime = now;

            // Validate file size on client side first (10MB max)
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (audioBlob.size > MAX_FILE_SIZE) {
                throw new Error(`Audio file is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
            }
            
            // Create a file name with timestamp to avoid caching issues
            const fileName = `recording_${Date.now()}.wav`;
            
            const formData = new FormData();
            formData.append('audio', audioBlob, fileName);

            const response = await fetch(`${this.baseUrl}/transcribe`, {
                method: 'POST',
                body: formData
            });

            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

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