let score = 0; // Initialize the score
let locations = [];
let currentLocationIndex = 0;
let currentQuestionIndex = 0;
let timerInterval;
const timerDuration = 60; // Timer duration in seconds
let isMusicPlaying = false;

// Fetch the JSON file
async function fetchLocations() {
    const response = await fetch('locations.json');
    locations = await response.json();

    // Shuffle the locations array
    shuffleArray(locations);

    // Load the first location
    loadLocation(currentLocationIndex);
}

// Shuffle the array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Start the timer
function startTimer() {
    const timerBar = document.getElementById('timerBar');
    let timeLeft = timerDuration;

    // Reset the timer bar
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = '#4caf50'; // Green at the start

    // Clear any existing interval
    clearInterval(timerInterval);

    // Start the countdown
    timerInterval = setInterval(() => {
        timeLeft -= 0.1; // Decrease time left by 0.1 seconds
        const percentage = (timeLeft / timerDuration) * 100;
        timerBar.style.width = `${percentage}%`;

        // Change color based on remaining time
        if (timeLeft <= 5) {
            timerBar.style.backgroundColor = 'red'; // Red with 5 seconds left
        } else if (timeLeft <= 15) {
            timerBar.style.backgroundColor = 'orange'; // Orange with 15 seconds left
        } else if (timeLeft <= 30) {
            timerBar.style.backgroundColor = 'yellow'; // Yellow with 30 seconds left
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerBar.style.width = '0%';
            handleTimeOut(); // Handle timeout when the timer reaches 0
        }
    }, 100); // Update every 100ms
}

function handleTimeOut() {
    alert('Time is up! Moving to the next question.');
    nextQuestion(); // Automatically move to the next question
}

// Load the current location and its first question
function loadLocation(index) {
    const locationData = locations[index];
    const iframe = document.getElementById('map');
    const questionLabel = document.getElementById('questionLabel');
    const answerInputContainer = document.getElementById('answerInputContainer');
    const nextButton = document.getElementById('nextButton');

    // Set the map iframe
    iframe.src = locationData.location;

    // Get the current question
    const currentQuestion = locationData.questions[currentQuestionIndex];
    questionLabel.textContent = currentQuestion.question;

    // Clear previous inputs
    answerInputContainer.innerHTML = '';
    nextButton.style.display = 'none';

    if (currentQuestion.type === 'multiple-choice') {
        // Render multiple-choice options
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.onclick = () => checkAnswer(option);
            optionsDiv.appendChild(button);
        });
        answerInputContainer.appendChild(optionsDiv);
    } else {
        // Render text input
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'answerInput';
        input.placeholder = 'Type your answer here...';
        input.oninput = () => checkAnswer(input.value);
        answerInputContainer.appendChild(input);
    }

    // Start the timer for the current question
    startTimer();
}

// Check the user's answer
function checkAnswer(userAnswer) {
    const currentQuestion = locations[currentLocationIndex].questions[currentQuestionIndex];
    const nextButton = document.getElementById('nextButton');
    const answerInput = document.getElementById('answerInput'); // Reference to the text box

    if (typeof userAnswer === 'string') {
        userAnswer = userAnswer.trim().toLowerCase();
    } else {
        userAnswer = answerInput.value.trim().toLowerCase();
    }

    const correctAnswer = currentQuestion.answer.toLowerCase();

    if (userAnswer === correctAnswer) {
        score += 1000; // Add 1000 points for each correct answer
        localStorage.setItem('finalScore', score); // Save the final score
        updateScore(); // Update the score display
        nextButton.style.display = 'block'; // Show the Next button
        if (answerInput) {
            answerInput.style.backgroundColor = '#d4edda'; // Light green for correct
        }
    } else {
        nextButton.style.display = 'none'; // Hide the Next button
        if (answerInput) {
            answerInput.style.backgroundColor = '#f8d7da'; // Light red for incorrect
        }
    }
}

// Go to the next question or location
function nextQuestion() {
    const locationData = locations[currentLocationIndex];

    if (currentQuestionIndex < locationData.questions.length - 1) {
        // Move to the next question
        currentQuestionIndex++;
        loadLocation(currentLocationIndex);
    } 
    else if (currentLocationIndex < locations.length - 1) {
        // Move to the "Do you want to continue?" page
        currentQuestionIndex = 0; // Reset question index for the new location
        currentLocationIndex++;
        window.location.href = 'continue.html'; // Redirect to continue.html
    } 
    else {
        // End of the quiz
        localStorage.setItem('finalScore', score); // Save the final score
        window.location.href = 'congratulations.html'; // Redirect to the congratulations page
    }
}

function skipQuestion() {
    const locationData = locations[currentLocationIndex];

    if (currentQuestionIndex < locationData.questions.length - 1) {
        // Move to the next question
        currentQuestionIndex++;
        loadLocation(currentLocationIndex);
    } else if (currentLocationIndex < locations.length - 1) {
        // Move to the next location
        currentQuestionIndex = 0; // Reset question index for the new location
        currentLocationIndex++;
        loadLocation(currentLocationIndex);
    } else {
        // End of the quiz
        localStorage.setItem('finalScore', score); // Save the final score
        window.location.href = 'congratulations.html'; // Redirect to the congratulations page
    }
}

// Get the user's local time
function getUserLocalTime() {
    const now = new Date(); // Get the current date and time
    const hours = now.getHours(); // Get the hours (0-23)
    const minutes = now.getMinutes(); // Get the minutes (0-59)
    const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM or PM
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add leading zero if needed
    return `${formattedHours}:${formattedMinutes} ${ampm}`; // Return formatted time
}

// Update the score display
function updateScore() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = score; // Update the score display
}

// Toggle background music
function toggleMusic() {
    const music = document.getElementById('backgroundMusic');
    const musicIcon = document.getElementById('musicIcon');

    if (isMusicPlaying) {
        music.pause();
        musicIcon.src = 'assets/SoundStopped-01.png'; // Change to "stopped" icon
    } else {
        music.play();
        musicIcon.src = 'assets/SoundPlaying-01.png'; // Change to "playing" icon
    }

    isMusicPlaying = !isMusicPlaying;
}

// Load the locations and display local time on page load
window.onload = () => {
    // Fetch locations
    fetchLocations();

    // Automatically play music
    const music = document.getElementById('backgroundMusic');
    music.play();
    isMusicPlaying = true;
    document.getElementById('musicIcon').src = 'assets/SoundPlaying-01.png'; // Set the initial icon to "playing"

    // Display local time
    const localTimeElement = document.getElementById('localTime');
    localTimeElement.textContent = `Local Time: ${getUserLocalTime()}`;

    // Update the local time every second
    setInterval(() => {
        localTimeElement.textContent = `Local Time: ${getUserLocalTime()}`;
    }, 1000);
};