// State management
let currentPage = 'home';
let favorites = JSON.parse(localStorage.getItem('medimind_favorites') || '[]');
let recentSearches = JSON.parse(localStorage.getItem('medimind_recent') || '[]');
let currentResult = null;

// Tavily API configuration
const TAVILY_API_KEY = 'YOUR_TAVILY_API_KEY_HERE'; // Replace with your actual API key
const TAVILY_API_URL = 'https://api.tavily.com/search';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateRecentSearches();
    updateFavoritesContent();
    
    // Add keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
});

// Navigation functions
function showHome() {
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('favoritesPage').style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    currentPage = 'home';
}

function showFavorites() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('favoritesPage').style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[1].classList.add('active');
    currentPage = 'favorites';
    updateFavoritesContent();
}

// Search functionality
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchIllness();
    }
}

function searchExample(illness) {
    document.getElementById('searchInput').value = illness;
    searchIllness();
}

function searchFromRecent(illness) {
    document.getElementById('searchInput').value = illness;
    searchIllness();
}

async function searchIllness() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm) {
        showError('Please enter an illness or condition to search for.');
        return;
    }

    // Disable search button during search
    const searchBtn = document.querySelector('.search-btn');
    const originalText = searchBtn.textContent;
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    // Add to recent searches
    addToRecentSearches(searchTerm);

    // Show loading state
    showLoading();

    try {
        // Prepare the query for Tavily
        const query = `Comprehensive health information for ${searchTerm}: symptoms, causes, treatment options, lifestyle recommendations, what to do and avoid, when to seek medical attention, and preventive measures.`;

        // Call Tavily API
        const response = await fetch(TAVILY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: 'advanced',
                include_images: false,
                include_answer: true,
                max_results: 8,
                include_domains: ['mayoclinic.org', 'webmd.com', 'healthline.com', 'medlineplus.gov', 'cdc.gov']
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Process and display results
        if (data.answer || (data.results && data.results.length > 0)) {
            displayResults(searchTerm, data);
        } else {
            showError('No health information found for this condition. Please try a different search term.');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Unable to fetch health advice at the moment. Please check your internet connection and try again.');
    } finally {
        // Re-enable search button
        searchBtn.disabled = false;
        searchBtn.textContent = originalText;
    }
}

function showLoading() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Consulting AI for health advice...</div>
            <div class="loading-text" style="font-size: 14px; margin-top: 10px;">This may take a few moments</div>
        </div>
    `;
}

function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <div class="error-title">Oops! Something went wrong</div>
            <div class="error-message">${message}</div>
            <button class="retry-btn" onclick="searchIllness()">Try Again</button>
        </div>
    `;
}

function displayResults(illness, data) {
    const resultsSection = document.getElementById('resultsSection');
    
    // Process the Tavily response
    let advice = data.answer || '';
    const sources = data.results || [];
    
    // If no answer, try to extract from results
    if (!advice && sources.length > 0) {
        advice = sources.map(s => s.content).join(' ');
    }

    // Parse the advice into sections
    const parsedAdvice = parseHealthAdvice(advice, sources);
    
    // Store current result
    currentResult = {
        illness: illness,
        advice: parsedAdvice,
        timestamp: new Date().toISOString(),
        sources: sources.slice(0, 3).map(s => ({ title: s.title, url: s.url }))
    };

    // Generate HTML
    const isFavorited = favorites.some(f => f.illness.toLowerCase() === illness.toLowerCase());
    
    resultsSection.innerHTML = `
        <div class="results-section">
            <div class="result-card">
                <div class="result-header">
                    <h2 class="result-title">
                        <span>${illness}</span>
                        <span style="font-size: 24px;">💊</span>
                    </h2>
                    <div class="result-actions">
                        <button class="action-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite('${illness}')">
                            <span>${isFavorited ? '⭐' : '☆'}</span>
                            <span>${isFavorited ? 'Saved' : 'Save'}</span>
                        </button>
                        <button class="action-btn" onclick="copyAdvice()">
                            <span>📋</span>
                            <span>Copy</span>
                        </button>
                        <button class="action-btn" onclick="shareAdvice()">
                            <span>🔗</span>
                            <span>Share</span>
                        </button>
                    </div>
                </div>
                <div class="advice-content">
                    ${generateAdviceHTML(parsedAdvice)}
                </div>
                ${generateSourcesHTML(sources)}
            </div>
        </div>
    `;
}

function parseHealthAdvice(rawAdvice, sources) {
    const advice = {
        overview: '',
        dos: [],
        donts: [],
        symptoms: [],
        whenToSeeDoctor: '',
        lifestyleTips: []
    };

    // Extract overview - first few sentences
    const sentences = rawAdvice.split(/[.!?]+/).filter(s => s.trim().length > 10);
    advice.overview = sentences.slice(0, 3).join('. ') + '.';

    // Extract symptoms
    const symptomPatterns = [
        /symptoms?\s+(?:include|are|of|:)\s*([^.]+)/gi,
        /signs?\s+(?:include|are|of|:)\s*([^.]+)/gi,
        /may\s+(?:experience|have|feel)\s+([^.]+)/gi
    ];
    
    symptomPatterns.forEach(pattern => {
        const matches = rawAdvice.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length < 200) {
                advice.symptoms.push(match[1].trim());
            }
        }
    });

    // Extract dos (recommendations)
    const doPatterns = [
        /(?:should|recommend|try|important)\s+(?:to\s+)?([^.]+)/gi,
        /(?:treatment|therapy|management)\s+(?:includes?|involves?)\s+([^.]+)/gi,
        /(?:helpful|beneficial|effective)\s+(?:to\s+)?([^.]+)/gi
    ];
    
    doPatterns.forEach(pattern => {
        const matches = rawAdvice.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length < 150 && match[1].length > 10) {
                advice.dos.push(match[1].trim());
            }
        }
    });

    // Extract don'ts
    const dontPatterns = [
        /avoid\s+([^.]+)/gi,
        /don't\s+([^.]+)/gi,
        /should\s+not\s+([^.]+)/gi,
        /refrain\s+from\s+([^.]+)/gi,
        /not\s+recommended\s+([^.]+)/gi
    ];
    
    dontPatterns.forEach(pattern => {
        const matches = rawAdvice.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length < 150 && match[1].length > 10) {
                advice.donts.push(match[1].trim());
            }
        }
    });

    // Extract when to see doctor
    const doctorPatterns = [
        /(?:see|consult|visit)\s+(?:a\s+)?(?:doctor|physician|healthcare)\s+(?:if|when)\s+([^.]+)/gi,
        /seek\s+medical\s+(?:attention|help|care)\s+(?:if|when)\s+([^.]+)/gi,
        /emergency\s+(?:signs?|symptoms?)\s+(?:include|are)\s+([^.]+)/gi
    ];
    
    doctorPatterns.forEach(pattern => {
        const match = rawAdvice.match(pattern);
        if (match && match[1]) {
            advice.whenToSeeDoctor = match[1].trim();
        }
    });

    // Extract lifestyle tips from sources
    if (sources.length > 0) {
        sources.slice(0, 3).forEach(source => {
            if (source.content) {
                const lifestyleMatches = source.content.match(/(?:lifestyle|diet|exercise|sleep|stress|prevent)[^.]+/gi);
                if (lifestyleMatches) {
                    lifestyleMatches.forEach(tip => {
                        if (tip.length < 200 && tip.length > 20) {
                            advice.lifestyleTips.push(tip.trim());
                        }
                    });
                }
            }
        });
    }

    // Add default recommendations if sections are empty
    if (advice.dos.length === 0) {
        advice.dos = [
            'Rest and get adequate sleep',
            'Stay hydrated by drinking plenty of water',
            'Follow a balanced, nutritious diet',
            'Monitor your symptoms regularly',
            'Take medications as prescribed by your doctor'
        ];
    }

    if (advice.donts.length === 0) {
        advice.donts = [
            'Self-medicate without consulting a healthcare professional',
            'Ignore persistent or worsening symptoms',
            'Engage in strenuous activities without medical clearance',
            'Skip prescribed medications without doctor approval'
        ];
    }

    if (!advice.whenToSeeDoctor) {
        advice.whenToSeeDoctor = 'symptoms persist for more than a few days, worsen significantly, or are accompanied by severe pain, high fever, difficulty breathing, or other concerning signs.';
    }

    if (advice.lifestyleTips.length === 0) {
        advice.lifestyleTips = [
            'Maintain a regular sleep schedule of 7-9 hours per night',
            'Practice stress management techniques like meditation or deep breathing',
            'Stay physically active with appropriate exercise',
            'Maintain good hygiene practices',
            'Eat a balanced diet rich in fruits and vegetables'
        ];
    }

    return advice;
}

function generateAdviceHTML(advice) {
    let html = `
        <div class="advice-section">
            <h3 class="advice-subtitle">
                <span>📋</span>
                <span>Overview</span>
            </h3>
            <p>${advice.overview}</p>
        </div>
    `;

    if (advice.symptoms.length > 0) {
        html += `
            <div class="advice-section">
                <h3 class="advice-subtitle">
                    <span>🩺</span>
                    <span>Common Symptoms</span>
                </h3>
                <ul class="advice-list">
                    ${advice.symptoms.slice(0, 5).map(symptom => `
                        <li class="advice-item">
                            <span class="advice-icon">•</span>
                            <span>${symptom}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    html += `
        <div class="advice-section">
            <h3 class="advice-subtitle">
                <span>✅</span>
                <span>What to Do</span>
            </h3>
            <ul class="advice-list">
                ${advice.dos.slice(0, 6).map(item => `
                    <li class="advice-item">
                        <span class="advice-icon do">✓</span>
                        <span>${item}</span>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="advice-section">
            <h3 class="advice-subtitle">
                <span>❌</span>
                <span>What to Avoid</span>
            </h3>
            <ul class="advice-list">
                ${advice.donts.slice(0, 5).map(item => `
                    <li class="advice-item">
                        <span class="advice-icon dont">✗</span>
                        <span>${item}</span>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="advice-section">
            <h3 class="advice-subtitle">
                <span>🏥</span>
                <span>When to See a Doctor</span>
            </h3>
            <div class="advice-item">
                <span class="advice-icon warning">⚠️</span>
                <span>See a healthcare provider if ${advice.whenToSeeDoctor}</span>
            </div>
        </div>

        <div class="advice-section">
            <h3 class="advice-subtitle">
                <span>💡</span>
                <span>Lifestyle Tips</span>
            </h3>
            <ul class="advice-list">
                ${advice.lifestyleTips.slice(0, 5).map(tip => `
                    <li class="advice-item">
                        <span class="advice-icon do">•</span>
                        <span>${tip}</span>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="advice-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <p style="color: var(--text-secondary); font-size: 14px; text-align: center;">
                <strong>⚠️ Important:</strong> This information is for educational purposes only and should not replace professional medical advice. 
                Always consult with a qualified healthcare provider for proper diagnosis and treatment.
            </p>
        </div>
    `;

    return html;
}

function generateSourcesHTML(sources) {
    if (!sources || sources.length === 0) return '';
    
    return `
        <div class="advice-section" style="margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <h3 class="advice-subtitle">
                <span>📚</span>
                <span>Sources</span>
            </h3>
            <div class="sources-list">
                ${sources.slice(0, 3).map((source, index) => `
                    <div class="source-item" style="margin-bottom: 8px;">
                        <a href="${source.url}" target="_blank" rel="noopener noreferrer" 
                           style="color: var(--primary-color); text-decoration: none; font-size: 14px;">
                            ${index + 1}. ${source.title}
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Recent searches functionality
function addToRecentSearches(searchTerm) {
    // Remove if already exists
    recentSearches = recentSearches.filter(term => term.toLowerCase() !== searchTerm.toLowerCase());
    
    // Add to beginning
    recentSearches.unshift(searchTerm);
    
    // Keep only last 8 searches
    recentSearches = recentSearches.slice(0, 8);
    
    // Save to localStorage
    localStorage.setItem('medimind_recent', JSON.stringify(recentSearches));
    
    // Update UI
    updateRecentSearches();
}

function updateRecentSearches() {
    const recentSearchesSection = document.getElementById('recentSearchesSection');
    const recentSearchesList = document.getElementById('recentSearchesList');
    
    if (recentSearches.length === 0) {
        recentSearchesSection.style.display = 'none';
        return;
    }
    
    recentSearchesSection.style.display = 'block';
    recentSearchesList.innerHTML = recentSearches.map(term => `
        <span class="recent-search-tag" onclick="searchFromRecent('${term}')">
            ${term}
        </span>
    `).join('');
}

// Favorites functionality
function toggleFavorite(illness) {
    const existingIndex = favorites.findIndex(f => f.illness.toLowerCase() === illness.toLowerCase());
    
    if (existingIndex >= 0) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        showNotification('Removed from favorites', 'success');
    } else {
        // Add to favorites
        if (currentResult) {
            favorites.unshift({
                illness: currentResult.illness,
                advice: currentResult.advice,
                timestamp: currentResult.timestamp,
                sources: currentResult.sources || []
            });
            showNotification('Added to favorites', 'success');
        }
    }
    
    // Update localStorage
    localStorage.setItem('medimind_favorites', JSON.stringify(favorites));
    
    // Update UI
    updateFavoriteButton(illness);
    updateFavoritesContent();
}

function updateFavoriteButton(illness) {
    const isFavorited = favorites.some(f => f.illness.toLowerCase() === illness.toLowerCase());
    const favoriteBtn = document.querySelector('.action-btn');
    
    if (favoriteBtn) {
        favoriteBtn.classList.toggle('favorited', isFavorited);
        favoriteBtn.innerHTML = `
            <span>${isFavorited ? '⭐' : '☆'}</span>
            <span>${isFavorited ? 'Saved' : 'Save'}</span>
        `;
    }
}

function updateFavoritesContent() {
    const favoritesContent = document.getElementById('favoritesContent');
    
    if (favorites.length === 0) {
        favoritesContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⭐</div>
                <div class="empty-title">No favorites yet</div>
                <div class="empty-text">Save health advice to access it anytime</div>
            </div>
        `;
        return;
    }
    
    favoritesContent.innerHTML = `
        <div class="favorites-grid">
            ${favorites.map((favorite, index) => `
                <div class="favorite-card" onclick="viewFavorite(${index})">
                    <button class="delete-favorite" onclick="event.stopPropagation(); deleteFavorite(${index})">
                        ×
                    </button>
                    <div class="favorite-title">${favorite.illness}</div>
                    <div class="favorite-snippet">${favorite.advice.overview}</div>
                    <div class="favorite-date">${new Date(favorite.timestamp).toLocaleDateString()}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function viewFavorite(index) {
    const favorite = favorites[index];
    if (!favorite) return;
    
    // Switch to home page
    showHome();
    
    // Display the favorite result
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.innerHTML = `
        <div class="results-section">
            <div class="result-card">
                <div class="result-header">
                    <h2 class="result-title">
                        <span>${favorite.illness}</span>
                        <span style="font-size: 24px;">💊</span>
                    </h2>
                    <div class="result-actions">
                        <button class="action-btn favorited" onclick="toggleFavorite('${favorite.illness}')">
                            <span>⭐</span>
                            <span>Saved</span>
                        </button>
                        <button class="action-btn" onclick="copyAdvice()">
                            <span>📋</span>
                            <span>Copy</span>
                        </button>
                        <button class="action-btn" onclick="shareAdvice()">
                            <span>🔗</span>
                            <span>Share</span>
                        </button>
                    </div>
                </div>
                <div class="advice-content">
                    ${generateAdviceHTML(favorite.advice)}
                </div>
                ${generateSourcesHTML(favorite.sources)}
            </div>
        </div>
    `;
    
    // Update current result
    currentResult = favorite;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function deleteFavorite(index) {
    if (confirm('Are you sure you want to remove this from favorites?')) {
        favorites.splice(index, 1);
        localStorage.setItem('medimind_favorites', JSON.stringify(favorites));
        updateFavoritesContent();
        showNotification('Removed from favorites', 'success');
    }
}

// Utility functions
function copyAdvice() {
    if (!currentResult) return;
    
    const text = `${currentResult.illness}\n\n${currentResult.advice.overview}\n\nGenerated by MediMind AI`;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Advice copied to clipboard', 'success');
    }).catch(() => {
        showNotification('Failed to copy advice', 'error');
    });
}

function shareAdvice() {
    if (!currentResult) return;
    
    const text = `Check out this health advice for ${currentResult.illness} from MediMind AI`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: `${currentResult.illness} - MediMind AI`,
            text: text,
            url: url
        }).catch(console.error);
    } else {
        // Fallback to copying link
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to share', 'error');
        });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary-color)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);