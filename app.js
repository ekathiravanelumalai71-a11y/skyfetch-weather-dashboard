// Your OpenWeatherMap API Key
const API_KEY = 'c7a5bff03327f9219ec818a86f74da09';  // Replace with your actual API key
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Get HTML elements
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherDisplay = document.getElementById('weather-display');

// Fetch weather data using async/await
async function getWeather(city) {
    // Show loading state
    showLoading();
    
    // Disable button during search
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    
    // Build the API URL
    const url = `${API_URL}?q=${city}&appid=${API_KEY}&units=metric`;
    
    try {
        // Make API call with await
        const response = await axios.get(url);
        
        // Log the response (for debugging)
        console.log('Weather Data:', response.data);
        
        // Display the weather data
        displayWeather(response.data);
        
    } catch (error) {
        // Handle different error types
        console.error('Error fetching weather:', error);
        
        if (error.response && error.response.status === 404) {
            showError('❌ City Not Found', 'Please check the spelling and try again.');
        } else if (error.response) {
            showError('⚠️ API Error', 'Something went wrong. Please try again later.');
        } else {
            showError('❌ Network Error', 'Please check your internet connection.');
        }
    } finally {
        // Re-enable button after search completes
        searchBtn.disabled = false;
        searchBtn.textContent = '🔍 Search';
    }
}

// Display loading state
function showLoading() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading weather data...</p>
        </div>
    `;
    weatherDisplay.innerHTML = loadingHTML;
}

// Display weather data
function displayWeather(data) {
    // Extract the data we need
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    // Create HTML to display
    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;
    
    // Put it on the page
    weatherDisplay.innerHTML = weatherHTML;
    
    // Focus back on input for quick next search
    cityInput.focus();
}

// Display error message
function showError(title, message) {
    const errorHTML = `
        <div class="error-message">
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
    weatherDisplay.innerHTML = errorHTML;
}

// Validate input
function validateInput(city) {
    if (!city) {
        showError('❌ Empty Input', 'Please enter a city name.');
        return false;
    }
    
    if (city.length < 2) {
        showError('❌ Invalid Input', 'City name must be at least 2 characters.');
        return false;
    }
    
    return true;
}

// Handle search button click
searchBtn.addEventListener('click', function() {
    const city = cityInput.value.trim();
    
    if (validateInput(city)) {
        getWeather(city);
        cityInput.value = '';
    }
});

// Handle Enter key in input field
cityInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        
        if (validateInput(city)) {
            getWeather(city);
            cityInput.value = '';
        }
    }
});

// Show welcome message on page load
document.addEventListener('DOMContentLoaded', function() {
    weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <p>🌍 Enter a city name to get started!</p>
        </div>
    `;
});
