// This file contains the JavaScript code that handles the front-end logic for the Tamil dictionary website.

document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');

    searchButton.addEventListener('click', () => {
        const query = searchBar.value;
        if (query) {
            fetch(`/api/dictionary/search?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    displayResults(data);
                })
                .catch(error => {
                    console.error('Error fetching dictionary data:', error);
                });
        }
    });

    function displayResults(data) {
        resultsContainer.innerHTML = '';
        if (data.length > 0) {
            data.forEach(entry => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.textContent = `${entry.word} - ${entry.meaning}`;
                resultsContainer.appendChild(resultItem);
            });
        } else {
            resultsContainer.textContent = 'No results found.';
        }
    }
});