class Integrator {
    constructor() {
        this.questions = [];
        this.currentQuestion = null;
        this.score = 0;
        this.hintsUsed = 0;
        this.initialize();
    }

    async initialize() {
        await this.loadQuestions();
        this.displayNewQuestion();
        this.setupEventListeners();
    }

    async loadQuestions() {
        try {
            const response = await fetch('questions.json');
            const data = await response.json();
            this.questions = data.questions;
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    }

    getRandomQuestion() {
        const availableQuestions = this.questions.filter(q => !q.completed);
        if (availableQuestions.length === 0) {
            this.endGame();
            return null;
        }
        return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    }

    displayNewQuestion() {
        this.currentQuestion = this.getRandomQuestion();
        if (!this.currentQuestion) return;

        this.hintsUsed = 0;
        this.updateDisplay();
    }

    generateMathML(question) {
        const { lowerBound, upperBound, numerator, denominator } = question.integral;
        
        return `
            <math xmlns="http://www.w3.org/1998/Math/MathML" style="color: white; font-size: 8em;">
                <msubsup>
                    <mo>∫</mo>
                    <mn>${lowerBound}</mn>
                    <mn>${upperBound}</mn>
                </msubsup>
                <mfrac>
                    <mrow><mi>${numerator.join(' + ')}</mi></mrow>
                    <mrow><mi>${denominator.join(' + ')}</mi></mrow>
                </mfrac>
                <mo>dx</mo>
            </math>
        `;
    }

    updateDisplay() {
        const container = document.getElementById('integral-display');
        if (!container) return;

        container.innerHTML = this.generateMathML(this.currentQuestion);
        
        // Update score display
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}`;
        }

        // Update difficulty indicator
        const difficultyDisplay = document.getElementById('difficulty-display');
        if (difficultyDisplay) {
            difficultyDisplay.textContent = `Difficulty: ${this.currentQuestion.difficulty}`;
            difficultyDisplay.className = `difficulty ${this.currentQuestion.difficulty}`;
        }
    }

    checkAnswer(userAnswer) {
        if (!this.currentQuestion) return false;

        const normalizedUserAnswer = userAnswer.replace(/\s+/g, '').toLowerCase();
        const normalizedSolution = this.currentQuestion.solution.replace(/\s+/g, '').toLowerCase();

        if (normalizedUserAnswer === normalizedSolution) {
            const pointsEarned = this.calculatePoints();
            this.score += pointsEarned;
            this.currentQuestion.completed = true;
            return {
                correct: true,
                points: pointsEarned,
                message: `Correct! You earned ${pointsEarned} points!`
            };
        }
        return {
            correct: false,
            message: 'Try again!'
        };
    }

    calculatePoints() {
        const basePoints = this.currentQuestion.points;
        const hintPenalty = this.hintsUsed * 10;
        return Math.max(basePoints - hintPenalty, 10);
    }

    getHint() {
        if (!this.currentQuestion || this.hintsUsed >= this.currentQuestion.hints.length) {
            return 'No more hints available!';
        }
        this.hintsUsed++;
        return this.currentQuestion.hints[this.hintsUsed - 1];
    }

    endGame() {
        const container = document.getElementById('integral-display');
        if (container) {
            container.innerHTML = `
                <div class="game-over">
                    <h2>Game Over!</h2>
                    <p>Final Score: ${this.score}</p>
                    <button onclick="location.reload()">Play Again</button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        const submitButton = document.getElementById('submit-answer');
        const answerInput = document.getElementById('answer-input');
        const hintButton = document.getElementById('hint-button');

        if (submitButton && answerInput) {
            submitButton.addEventListener('click', () => {
                const result = this.checkAnswer(answerInput.value);
                alert(result.message);
                if (result.correct) {
                    answerInput.value = '';
                    this.displayNewQuestion();
                }
            });

            // Also allow Enter key to submit
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitButton.click();
                }
            });
        }

        if (hintButton) {
            hintButton.addEventListener('click', () => {
                alert(this.getHint());
            });
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.integrator = new Integrator();
}); 