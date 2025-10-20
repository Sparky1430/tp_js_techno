// js/models/Question.js
export default class Question {
    constructor({ category, type, difficulty, question, correct_answer, incorrect_answers }) {
        this.category = category;
        this.type = type;
        this.difficulty = difficulty;
        this.rawQuestion = question;
        this.correctAnswer = correct_answer;
        this.incorrectAnswers = incorrect_answers;
        this.allAnswers = this._shuffleAnswers();
    }

    // Decode HTML entities (OpenTDB returns HTML entities)
    static decodeHTMLEntities(str) {
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    }

    get question() {
        return Question.decodeHTMLEntities(this.rawQuestion);
    }

    get shuffledAnswers() {
        // return decoded answers (not modifying internal allAnswers)
        return this.allAnswers.map(a => Question.decodeHTMLEntities(a));
    }

    _shuffleAnswers() {
        const arr = [...this.incorrectAnswers, this.correctAnswer];
        // Fisher-Yates shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
