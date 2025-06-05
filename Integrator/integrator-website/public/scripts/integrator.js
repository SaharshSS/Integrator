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
        this.displayAnswerChoices();
    }

    displayAnswerChoices() {
        const answerContainer = document.getElementById('answer-container');
        if (!answerContainer || !this.currentQuestion) return;

        // Clear previous answers
        answerContainer.innerHTML = '';

        // Get all possible answers including the correct one
        if (!this.currentQuestion.wrongAnswers) {
            console.error('No wrong answers found for question:', this.currentQuestion);
            return;
        }

        const answers = [...this.currentQuestion.wrongAnswers, this.currentQuestion.solution];
        
        // Shuffle the answers
        const shuffledAnswers = answers.sort(() => Math.random() - 0.5);

        // Create buttons for each answer
        shuffledAnswers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-button';
            button.textContent = answer;
            button.onclick = () => this.checkAnswer(answer);
            answerContainer.appendChild(button);
        });
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
                const innerExpr = term.substring(1);
                // Remove outer parentheses if they exist
                const content = innerExpr.startsWith('(') && innerExpr.endsWith(')') ? 
                    innerExpr.slice(1, -1) : innerExpr;
                
                // Split the content by + or - to handle each term separately
                const terms = content.split(/([+-])/g).map(t => t.trim()).filter(t => t);
                const formattedTerms = terms.map((t, i) => {
                    if (t === '+' || t === '-') return `<mo>${t}</mo>`;
                    // Handle exponents within terms
                    if (t.includes('^')) {
                        const [base, power] = t.split('^');
                        // If base contains x, only apply exponent to x
                        if (base.includes('x')) {
                            const [coef, ...rest] = base.split('x');
                            return `${coef ? `<mn>${coef}</mn>` : ''}<msup><mi>x</mi><mn>${power}</mn></msup>`;
                        }
                        return `<msup><mi>${base}</mi><mn>${power}</mn></msup>`;
                    }
                    return formatExpression([t]);
                }).join('');
                return `<msqrt><mrow>${formattedTerms}</mrow></msqrt>`;
            }
            
            // Handle terms with exponents outside of square roots
            if (term.includes('^')) {
                const parts = term.split('^');
                let base = parts[0];
                let power = parts[1];
                
                // If power contains parentheses, extract just the number
                if (power.includes(')')) {
                    power = power.replace(')', '');
                    base = base + ')';  // Add the closing parenthesis to the base
                }
                
                // Handle case where base contains parentheses
                if (base.includes('(')) {
                    const baseContent = base.match(/\((.*?)\)/)[1];
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
            
            function formatSingleTerm(term) {
                // Split the term into parts by + or -
                const parts = term.split(/([+-])/g).map(t => t.trim()).filter(t => t);
                
                return parts.map((part, idx) => {
                    // Return operators as is
                    if (part === '+' || part === '-') {
                        return `<mo>${part}</mo>`;
                    }
                    
                    // Handle terms with exponents
                    if (part.includes('^')) {
                        const [base, power] = part.split('^');
                        // If base contains x, only apply exponent to x
                        if (base.includes('x')) {
                            const [coef, ...rest] = base.split('x');
                            return `${coef ? `<mn>${coef}</mn>` : ''}<msup><mi>x</mi><mn>${power}</mn></msup>`;
                        }
                        return `<msup><mi>${base}</mi><mn>${power}</mn></msup>`;
                    }
                    
                    // Handle regular terms
                    if (!isNaN(part)) {
                        return `<mn>${part}</mn>`;
                    }
                    return `<mi>${part}</mi>`;
                }).join('');
            }
            
            return terms.map((term, index) => {
                // If it's a negative term (except first term), handle the minus sign
                if (term.startsWith('-') && index > 0) {
                    return `<mo>-</mo>${formatSingleTerm(term.substring(1))}`;
                }
                // Add plus sign between terms
                return index > 0 ? `<mo>+</mo>${formatSingleTerm(term)}` : formatSingleTerm(term);
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
        console.log('Updating display with current question:', this.currentQuestion);
        const container = document.getElementById('integral-display');
        const questionBox = document.getElementById('question-box');
        
        if (!container || !questionBox || !this.currentQuestion) {
            console.error('Could not find display containers or question');
            return;
        }

        // Update question box
        questionBox.textContent = this.currentQuestion.question;

        // Update integral display
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
            difficultyDisplay.className = `difficulty ${this.currentQuestion.difficulty.toLowerCase().replace(/\s+/g, '')}`;
        }
    }

    checkAnswer(userAnswer) {
        if (!this.currentQuestion) return false;

        const normalizedUserAnswer = userAnswer.trim();
        const normalizedSolution = this.currentQuestion.solution.trim();

        if (normalizedUserAnswer === normalizedSolution) {
            const pointsEarned = this.calculatePoints();
            this.score += pointsEarned;
            this.currentQuestion.completed = true;
            alert(`Correct! You earned ${pointsEarned} points!`);
            this.displayNewQuestion();
            return true;
        }
        
        alert('Try again!');
        return false;
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
        const hintButton = document.getElementById('hint-button');
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