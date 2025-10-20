// js/controllers/QuizController.js
import QuizService from "../services/QuizService.js";
import Quiz from "../models/Quiz.js";

export default class QuizController {
    constructor() {
        // config form elements
        this.form = document.getElementById("configForm");
        this.nbrQuestions = document.getElementById("nbrQuestions");
        this.category = document.getElementById("category");
        this.difficulty = document.getElementById("difficulty");
        this.startBtn = document.getElementById("startBtn");

        // quiz elements
        this.quizContainer = document.getElementById("quizContainer");
        this.questionCard = document.getElementById("questionCard");
        this.prevBtn = document.getElementById("prevBtn");
        this.nextBtn = document.getElementById("nextBtn");
        this.questionMeta = document.getElementById("questionMeta");
        this.scoreMeta = document.getElementById("scoreMeta");
        this.home = document.getElementById("home");

        // results
        this.resultsContainer = document.getElementById("resultsContainer");
        this.finalScore = document.getElementById("finalScore");
        this.resultsDetails = document.getElementById("resultsDetails");
        this.restartBtn = document.getElementById("restartBtn");

        // messages
        this.message = document.getElementById("message");

        this.quiz = null;

        this._bindEvents();
        this._init();
    }

    async _init() {
        // load categories to populate select
        try {
            const cats = await QuizService.fetchCategories();
            this._populateCategories(cats);
        } catch (err) {
            this._showMessage(err.message, true);
        }
    }

    _bindEvents() {
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.startQuiz();
        });

        this.prevBtn.addEventListener("click", () => this._onPrev());
        this.nextBtn.addEventListener("click", () => this._onNext());
        this.restartBtn.addEventListener("click", () => this._onRestart());
    }

    _populateCategories(categories) {
        // categories: array {id, name}
        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            this.category.appendChild(opt);
        });
    }

    async startQuiz() {
        // read config
        const amount = Number(this.nbrQuestions.value) || 10;
        const category = this.category.value || "";
        const difficulty = this.difficulty.value || "";

        // UI feedback
        this._showMessage("Récupération des questions...", false);
        this.startBtn.disabled = true;

        try {
            const questions = await QuizService.fetchQuestions(amount, category, difficulty);
            if (!questions || questions.length === 0) {
                throw new Error("Aucune question récupérée pour cette configuration.");
            }

            // create quiz model
            this.quiz = new Quiz(questions);

            // hide config form, show quiz container
         
            this.home.style.display = "none";
            this.resultsContainer.style.display = "none";
            this.quizContainer.style.display = "block";
            this._clearMessage();

            // render first question
            this._renderCurrentQuestion();
            this._updateMeta();
        } catch (err) {
            this._showMessage(err.message, true);
        } finally {
            this.startBtn.disabled = false;
        }
    }

    _renderCurrentQuestion() {
        const q = this.quiz.currentQuestion;
        if (!q) return;

        // Build question HTML (no styling - your CSS later)
        this.questionCard.innerHTML = "";

        // question header
        const h = document.createElement("h3");
        h.textContent = q.question;
        this.questionCard.appendChild(h);

        // answers list
        const ul = document.createElement("ul");
        ul.setAttribute("role", "list");
        ul.style.listStyle = "none";
        ul.style.padding = "0";

        q.shuffledAnswers.forEach(answerText => {
            const li = document.createElement("li");
            const btn = document.createElement("button");
            btn.className = "answerBtn";
            btn.type = "button";
            btn.textContent = answerText;
            btn.dataset.answer = answerText;

            // mark selected if the user already answered this question
            const chosen = this.quiz.userAnswers[this.quiz.currentIndex];
            if (chosen && chosen === answerText) {
                btn.setAttribute("aria-pressed", "true");
                btn.dataset.selected = "true";
            } else {
                btn.dataset.selected = "false";
            }

            btn.addEventListener("click", (e) => {
                this._onSelectAnswer(e.currentTarget.dataset.answer, e.currentTarget);
            });

            li.appendChild(btn);
            ul.appendChild(li);
        });

        this.questionCard.appendChild(ul);

        // show correct/incorrect feedback only after answered; we do not auto show it here — logic handled on selection
        // optional: show category/difficulty
        const meta = document.createElement("p");
        meta.textContent = `${q.category} — ${q.difficulty}`;
        this.questionCard.appendChild(meta);

        // update navigation button state
        this._updateNavButtons();
    }

    _onSelectAnswer(answer, btnElem) {
        // submit to model
        this.quiz.answerCurrentQuestion(answer);

        // visually mark selected button and unmark others
        const allBtns = this.questionCard.querySelectorAll(".answerBtn");
        allBtns.forEach(b => {
            b.dataset.selected = "false";
            b.setAttribute("aria-pressed", "false");
            b.classList.remove("correct");
            b.classList.remove("incorrect");
        });

        btnElem.dataset.selected = "true";
        btnElem.setAttribute("aria-pressed", "true");

        // add simple feedback classes (you'll style them later)
        if (answer === this.quiz.currentQuestion.correctAnswer) {
            btnElem.classList.add("correct");
        } else {
            btnElem.classList.add("incorrect");
            // optionally mark the correct one
            allBtns.forEach(b => {
                if (b.dataset.answer === this.quiz.currentQuestion.correctAnswer) {
                    b.classList.add("correct");
                }
            });
        }

        // update score display
        this._updateMeta();

        // if this was the last question and all answered, show results
        const atLast = this.quiz.currentIndex === this.quiz.total - 1;
        if (atLast && this.quiz.isFinished()) {
            this._showResults();
        }
    }

    _onNext() {
        const moved = this.quiz.goNext();
        if (moved) {
            this._renderCurrentQuestion();
            this._updateMeta();
        } else {
            // if not moved, probably at last
            if (this.quiz.isFinished()) {
                this._showResults();
            } else {
                this._showMessage("Vous êtes à la dernière question. Répondez puis appuyez sur 'Nouveau quiz' ou 'Précédent'.", false);
            }
        }
    }

    _onPrev() {
        const moved = this.quiz.goPrev();
        if (moved) {
            this._renderCurrentQuestion();
            this._updateMeta();
        }
    }

    _onRestart() {
        // reset UI
        this.form.style.display = "block";
        this.quizContainer.style.display = "none";
        this.resultsContainer.style.display = "none";
        this._clearMessage();
        // keep selects as they were
        this.quiz = null;
    }

    _updateMeta() {
        const idx = this.quiz.currentIndex + 1;
        this.questionMeta.textContent = `Question ${idx}/${this.quiz.total}`;
        this.scoreMeta.textContent = `Score: ${this.quiz.score}/${this.quiz.total}`;
    }

    _updateNavButtons() {
        this.prevBtn.disabled = this.quiz.currentIndex === 0;
        this.nextBtn.disabled = this.quiz.currentIndex === this.quiz.total - 1 && !this.quiz.isFinished();
    }

    _showResults() {
        const r = this.quiz.results();
        this.finalScore.textContent = `Votre score : ${r.score}/${r.total} (${r.percent}%)`;
        this.resultsDetails.innerHTML = "";

        // details list
        const ul = document.createElement("ul");
        r.details.forEach((d, i) => {
            const li = document.createElement("li");
            li.innerHTML = `<strong>Q${i+1}:</strong> ${d.question} <br>
                <em>Ta réponse:</em> ${d.chosen || "<i>non répondu</i>"} — <em>Correcte:</em> ${d.correct} 
                ${d.isCorrect ? "✅" : "❌"}`;
            ul.appendChild(li);
        });

        this.resultsDetails.appendChild(ul);

        // show results container
        this.quizContainer.style.display = "none";
        this.resultsContainer.style.display = "block";
    }

    _showMessage(text, isError = false) {
        this.message.textContent = text;
        this.message.style.color = isError ? "darkred" : "inherit";
    }

    _clearMessage() {
        this.message.textContent = "";
    }
}

