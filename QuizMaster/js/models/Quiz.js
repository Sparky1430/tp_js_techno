// js/models/Quiz.js
export default class Quiz {
    constructor(questions = []) {
        this.questions = questions; // array of Question instances
        this.currentIndex = 0;
        this.score = 0;
        this.userAnswers = new Array(questions.length).fill(null); // store chosen answer strings
    }

    get total() {
        return this.questions.length;
    }

    get currentQuestion() {
        return this.questions[this.currentIndex] || null;
    }

    answerCurrentQuestion(answer) {
        if (!this.currentQuestion) return;
        const prev = this.userAnswers[this.currentIndex];
        // if previously answered, and was correct, we should not double count
        if (prev === null) {
            if (answer === this.currentQuestion.correctAnswer) {
                this.score += 1;
            }
        } else {
            // If changing a previous answer, adjust score accordingly
            if (prev === this.currentQuestion.correctAnswer && answer !== prev) {
                this.score -= 1;
            } else if (prev !== this.currentQuestion.correctAnswer && answer === this.currentQuestion.correctAnswer) {
                this.score += 1;
            }
        }
        this.userAnswers[this.currentIndex] = answer;
    }

    goNext() {
        if (this.currentIndex < this.total - 1) {
            this.currentIndex += 1;
            return true;
        }
        return false;
    }

    goPrev() {
        if (this.currentIndex > 0) {
            this.currentIndex -= 1;
            return true;
        }
        return false;
    }

    isFinished() {
        // finished when currentIndex is last and all questions answered OR when currentIndex is last and user presses finish
        return this.userAnswers.every(a => a !== null);
    }

    results() {
        const details = this.questions.map((q, i) => ({
            question: q.question,
            correct: q.correctAnswer,
            chosen: this.userAnswers[i],
            isCorrect: this.userAnswers[i] === q.correctAnswer,
            difficulty: q.difficulty,
            category: q.category
        }));
        return {
            total: this.total,
            score: this.score,
            percent: this.total ? Math.round((this.score / this.total) * 100) : 0,
            details
        };
    }
}
