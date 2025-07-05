// API Configuration
// Instructions: Replace 'YOUR_TAVILY_API_KEY_HERE' with your actual Tavily API key

const API_CONFIG = {
    TAVILY_API_KEY: 'YOUR_TAVILY_API_KEY_HERE',
    TAVILY_API_URL: 'https://api.tavily.com/search'
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}