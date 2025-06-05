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
        const { lowerBound, upperBound, numerator } = question.integral;
        
        function formatTerm(term) {
            // For simple numbers, just use mn tag
            if (!isNaN(term)) {
                return `<mn>${term}</mn>`;
            }

            // Handle square roots
            if (term.startsWith('√')) {
                const innerExpr = term.substring(1).match(/\((.*)\)/)[1];
                return `<msqrt>${formatExpression([innerExpr])}</msqrt>`;
            }
            
            // Handle terms with exponents
            if (term.includes('^')) {
                const parts = term.split('^');
                const base = parts[0];
                const power = parts[1];
                
                // Handle case where base contains parentheses
                if (base.includes('(')) {
                    const baseContent = base.match(/\((.*)\)/)[1];
                    return `<msup><mfenced><mrow>${formatExpression([baseContent])}</mrow></mfenced><mn>${power}</mn></msup>`;
                } else {
                    return `<msup><mi>${base}</mi><mn>${power}</mn></msup>`;
                }
            }

            // Handle functions like sin(x), cos(x)
            if (term.includes('(')) {
                const func = term.split('(')[0];
                const arg = term.split('(')[1].replace(')', '');
                return `<mi mathvariant="normal">${func}</mi><mo>(</mo>${formatExpression([arg])}<mo>)</mo>`;
            }

            // Handle terms with basic operations (+ or -)
            if (term.includes('+') || term.includes('-')) {
                return term.split(/([+-])/).map((part, i) => {
                    if (part === '+') return '<mo>+</mo>';
                    if (part === '-') return '<mo>-</mo>';
                    if (part) return `<mi>${part}</mi>`;
                    return '';
                }).join('');
            }

            // Handle regular terms
            return `<mi>${term}</mi>`;
        }

        function formatExpression(terms) {
            if (!terms || terms.length === 0) return '';
            return terms.map((term, index) => {
                // If it's a negative term (except first term), handle the minus sign
                if (term.startsWith('-') && index > 0) {
                    return `<mo>-</mo>${formatTerm(term.substring(1))}`;
                }
                // Add plus sign between terms
                return index > 0 ? `<mo>+</mo>${formatTerm(term)}` : formatTerm(term);
            }).join('');
        }

        // Just use the numerator directly if no denominator
        const content = question.integral.denominator ? 
            `<mfrac><mrow>${formatExpression(numerator)}</mrow><mrow>${formatExpression(question.integral.denominator)}</mrow></mfrac>` :
            formatExpression(numerator);

        return `
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="color: white; font-size: 8em;">
                <mrow>
                    <msubsup>
                        <mo>∫</mo>
                        <mn>${lowerBound || ''}</mn>
                        <mn>${upperBound || ''}</mn>
                    </msubsup>
                    ${content}
                    <mo>dx</mo>
                </mrow>
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