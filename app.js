// WeatherApp Constructor Function
function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // Get DOM references
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');
    this.recentSearchesSection = document.getElementById('recent-searches-section');
    this.recentSearchesContainer = document.getElementById('recent-searches-container');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');

    // Initialize recent searches array
    this.recentSearches = [];
    this.maxRecentSearches = 5;

    // Initialize the app
    this.init();
}

// Initialize event listeners
WeatherApp.prototype.init = function() {
    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
    this.cityInput.addEventListener('keypress', this.handleKeyPress.bind(this));
    this.clearHistoryBtn.addEventListener('click', this.clearHistory.bind(this));

    // Load recent searches from localStorage
    this.loadRecentSearches();

    // Load last searched city
    this.loadLastCity();
};

// Handle search button click
WeatherApp.prototype.handleSearch = function() {
    const city = this.cityInput.value.trim();

    if (this.validateInput(city)) {
        this.getWeather(city);
        this.cityInput.value = '';
    }
};

// Handle Enter key press
WeatherApp.prototype.handleKeyPress = function(event) {
    if (event.key === 'Enter') {
        this.handleSearch();
    }
};

// Validate user input
WeatherApp.prototype.validateInput = function(city) {
    if (!city) {
        this.showError('❌ Empty Input', 'Please enter a city name.');
        return false;
    }

    if (city.length < 2) {
        this.showError('❌ Invalid Input', 'City name must be at least 2 characters.');
        return false;
    }

    return true;
};

// Fetch weather data using async/await
WeatherApp.prototype.getWeather = async function(city) {
    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';

    try {
        // Use Promise.all to fetch both current weather and forecast simultaneously
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            axios.get(`${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`),
            this.getForecast(city)
        ]);

        // Display current weather
        this.displayWeather(currentWeatherResponse.data);

        // Display forecast
        this.displayForecast(forecastResponse);

        // Save this successful search to recent searches
        this.saveRecentSearch(city);

        // Save as last searched city
        localStorage.setItem('lastCity', city);

    } catch (error) {
        console.error('Error:', error);

        if (error.response && error.response.status === 404) {
            this.showError('❌ City Not Found', 'Please check the spelling and try again.');
        } else if (error.response) {
            this.showError('⚠️ API Error', 'Something went wrong. Please try again later.');
        } else {
            this.showError('❌ Network Error', 'Please check your internet connection.');
        }
    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = '🔍 Search';
    }
};

// Fetch forecast data
WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        throw error;
    }
};

// Process forecast data to get 5 daily forecasts
WeatherApp.prototype.processForecastData = function(data) {
    // Filter to get one forecast per day at noon (12:00:00)
    const dailyForecasts = data.list.filter(function(item) {
        return item.dt_txt.includes('12:00:00');
    });

    // Return first 5 days
    return dailyForecasts.slice(0, 5);
};

// Display weather data
WeatherApp.prototype.displayWeather = function(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;

    this.weatherDisplay.innerHTML = weatherHTML;
    this.cityInput.focus();
};

// Display forecast data
WeatherApp.prototype.displayForecast = function(data) {
    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(function(day) {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4 class="forecast-day">${dayName}</h4>
                <img src="${iconUrl}" alt="${description}" class="forecast-icon">
                <div class="forecast-temp">${temp}°C</div>
                <p class="forecast-desc">${description}</p>
            </div>
        `;
    }).join('');

    const forecastSection = `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;

    // Append forecast to existing weather display
    this.weatherDisplay.innerHTML += forecastSection;
};

// Load recent searches from localStorage
WeatherApp.prototype.loadRecentSearches = function() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }
    this.displayRecentSearches();
};

// Save a new recent search
WeatherApp.prototype.saveRecentSearch = function(city) {
    // Convert city to title case for consistency
    const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    // Check if city already exists in array, remove it if it does
    const index = this.recentSearches.indexOf(cityName);
    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }

    // Add city to the beginning of array
    this.recentSearches.unshift(cityName);

    // Keep only the last 5 searches
    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }

    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));

    // Update display
    this.displayRecentSearches();
};

// Display recent searches as buttons
WeatherApp.prototype.displayRecentSearches = function() {
    // Clear existing buttons
    this.recentSearchesContainer.innerHTML = '';

    // If no recent searches, hide the section
    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = 'none';
        return;
    }

    // Show the section
    this.recentSearchesSection.style.display = 'block';

    // Create a button for each recent search
    this.recentSearches.forEach(function(city) {
        const btn = document.createElement('button');
        btn.className = 'recent-search-btn';
        btn.textContent = city;

        // Add click handler
        btn.addEventListener('click', function() {
            this.cityInput.value = city;
            this.getWeather(city);
        }.bind(this));

        this.recentSearchesContainer.appendChild(btn);
    }.bind(this));
};

// Load last searched city
WeatherApp.prototype.loadLastCity = function() {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

// Clear all recent searches
WeatherApp.prototype.clearHistory = function() {
    if (confirm('Clear all recent searches?')) {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        this.displayRecentSearches();
    }
};

// Display loading state
WeatherApp.prototype.showLoading = function() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading weather data...</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = loadingHTML;
};

// Display error message
WeatherApp.prototype.showError = function(title, message) {
    const errorHTML = `
        <div class="error-message">
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = errorHTML;
};

// Show welcome message
WeatherApp.prototype.showWelcome = function() {
    const welcomeHTML = `
        <div class="welcome-message">
            <p>🌍 Enter a city name to get started!</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = welcomeHTML;
};

// Create app instance
const app = new WeatherApp('c7a5bff03327f9219ec818a86f74da09');
