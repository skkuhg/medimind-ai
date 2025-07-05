# MediMind AI - Your AI Health Companion

MediMind AI is a modern, responsive web application that provides instant, AI-powered health advice for various medical conditions using the Tavily AI API.

## Features

- **Instant Health Advice**: Get comprehensive health information for any condition
- **AI-Powered Search**: Powered by Tavily AI for accurate, reliable health information
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Recent Searches**: Quick access to your previous health searches
- **Favorites System**: Save important health advice for later reference
- **Example Conditions**: Quick-start with common health conditions
- **Source Links**: Access to reputable medical sources
- **Copy & Share**: Easy sharing of health advice

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Tavily AI API key (get one at [tavily.com](https://tavily.com))

### Setup Instructions

1. **Clone or Download**: 
   ```bash
   git clone https://github.com/skkuhg/medimind-ai.git
   cd medimind-ai
   ```

2. **Configure API Key**:
   - Open `script.js`
   - Replace `'YOUR_TAVILY_API_KEY_HERE'` with your actual Tavily API key
   - Or copy `.env.example` to `.env` and add your key there

3. **Open the App**: Simply open `index.html` in any modern web browser

4. **Start Searching**: Type in any health condition and get instant advice

### API Key Setup
```javascript
// In script.js, replace this line:
const TAVILY_API_KEY = 'YOUR_TAVILY_API_KEY_HERE';

// With your actual API key:
const TAVILY_API_KEY = 'your-actual-api-key-here';
```

## Usage

### Searching for Health Advice
1. Type a condition in the search box (e.g., "migraine", "diabetes", "anxiety")
2. Click "Search" or press Enter
3. View comprehensive health advice including:
   - Overview of the condition
   - Symptoms to watch for
   - What to do and what to avoid
   - When to see a doctor
   - Lifestyle tips

### Managing Favorites
- Click the star icon to save health advice
- Access saved advice from the Favorites page
- Remove favorites by clicking the X button

### Recent Searches
- Your recent searches appear below the search box
- Click any recent search to quickly search again

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Tavily AI Search API
- **Storage**: Browser localStorage for favorites and recent searches
- **Responsive**: CSS Grid and Flexbox for mobile-first design

## API Configuration

The app uses the Tavily AI API with the following configuration:
- Advanced search depth for comprehensive results
- Filtered to reputable medical sources
- Optimized for health-related queries

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- All modern browsers with ES6+ support

## File Structure

```
MediMind AI/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── config.js           # API configuration (optional)
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore file
├── package.json        # Project configuration
└── README.md           # This file
```

## Security Note

⚠️ **Important**: Never commit your actual API key to version control. The repository includes a `.gitignore` file that helps protect sensitive information. Always use environment variables or a separate config file for API keys in production.

## Features in Detail

### 🔍 Smart Search
- Natural language processing for health queries
- Comprehensive results from trusted medical sources
- Advanced filtering for relevant health information

### 📱 Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interface

### 💾 Local Storage
- Favorites saved locally in browser
- Recent searches persistence
- No account required

### 🎨 Modern UI
- Clean, medical-themed design
- Intuitive navigation
- Accessibility features

## Important Medical Disclaimer

⚠️ **This app provides general health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any medical concerns.**

## Privacy & Data

- No personal data is collected or stored on servers
- All favorites and searches are stored locally in your browser
- API calls are made directly to Tavily AI with no intermediate storage

## Contributing

This is an open-source project. Feel free to contribute by:
- Reporting bugs
- Suggesting new features
- Improving the code
- Enhancing the documentation

## License

This project is available under the MIT License.

## Support

For questions or support, please create an issue in the project repository.

---

**MediMind AI** - Making health information accessible to everyone, powered by AI.