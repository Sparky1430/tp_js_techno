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
        this.categoryBtn = document.getElementById("categoryBtn");
        this.difficultyBtn = document.getElementById("difficultyBtn");


        // quiz elements
        this.quizContainer = document.getElementById("quizContainer");
        this.questionCard = document.getElementById("questionCard");
        this.prevBtn = document.getElementById("prevBtn");
        this.nextBtn = document.getElementById("nextBtn");
        this.questionMeta = document.getElementById("questionMeta");
        this.scoreMeta = document.getElementById("scoreMeta");
        this.home = document.getElementById("home");
        this.progressFill = document.getElementById("progressFill");


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
            this.quizContainer.style.display = "flex";
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

// un nom unique pour le groupe radio (pour cette question)
const groupName = `question-${this.quiz.currentIndex}`;

q.shuffledAnswers.forEach(answerText => {
    const li = document.createElement("li");

    const label = document.createElement("label");
    label.style.cursor = "pointer";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = groupName;
    input.value = answerText;
    input.className = "answerRadio";

    // marquer comme sélectionné si l'utilisateur a déjà répondu
    const chosen = this.quiz.userAnswers[this.quiz.currentIndex];
    if (chosen && chosen === answerText) {
        input.checked = true;
    }

    input.addEventListener("change", (e) => {
        this._onSelectAnswer(e.target.value, e.target);
    });

    label.appendChild(input);
    label.append(` ${answerText}`); // espace pour bien séparer le texte

    li.appendChild(label);
    ul.appendChild(li);
});


        this.questionCard.appendChild(ul);

        // show correct/incorrect feedback only after answered; we do not auto show it here — logic handled on selection


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
        this.questionMeta.textContent = `Question ${idx} of ${this.quiz.total}`;
        this.scoreMeta.textContent = `Score: ${this.quiz.score}/${this.quiz.total}`;

        // ✅ Affichage catégorie & difficulté
        const q = this.quiz.currentQuestion;
        this.categoryBtn.textContent = q.category;
        this.difficultyBtn.textContent = q.difficulty;

        // calcul de la progression
        const progressPercent = (idx / this.quiz.total) * 100;
        this.progressFill.style.width = `${progressPercent}%`;
    }

    _updateNavButtons() {
        this.prevBtn.disabled = this.quiz.currentIndex === 0;
        this.nextBtn.disabled = this.quiz.currentIndex === this.quiz.total - 1 && !this.quiz.isFinished();
    }

_showResults() {
    const r = this.quiz.results(); // { score, total, percent, details: [...] }
    const correctCount = r.score;
    const total = r.total;
    const percentage = Math.round((correctCount / total) * 100);

    const getScoreMessage = () => {
        if (percentage >= 90) return "Outstanding! 🎉";
        if (percentage >= 70) return "Great job! 👏";
        if (percentage >= 50) return "Good effort! 👍";
        return "Keep practicing! 💪";
    };

    // Helpers SVG (check / x)
    const checkSvg = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" stroke="rgb(34,197,94)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    const xSvg = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="rgb(239,68,68)" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

    // On remplit la section résultats
    this.resultsContainer.innerHTML = `
      <div class="results-card">
        <div class="results-head" style="text-align:center; margin-bottom: 8px;">
          <h1>Quiz Complete!</h1>
          <p class="results-subtle">${getScoreMessage()}</p>
        </div>

        <div class="results-metrics">
          <div class="metric">
            <div class="value">${correctCount}/${total}</div>
            <div class="label">Correct Answers</div>
          </div>
          <div class="sep-vert"></div>
          <div class="metric">
            <div class="value">${percentage}%</div>
            <div class="label">Score</div>
          </div>
        </div>

        <div class="sep"></div>

        <div class="results-section-title">Review Your Answers</div>
        <div class="review-list" id="reviewList"></div>

        <button id="restartBtn" type="button">
          Start New Quiz
        </button>
      </div>
    `;

    // Construire la liste détaillée (on part de this.quiz.questions + réponses)
    const list = this.resultsContainer.querySelector("#reviewList");

    // On reconstitue ce dont on a besoin depuis le modèle
    // r.details = [{ question, correct, chosen, isCorrect, category?, difficulty? }, ...]
    r.details.forEach((d, i) => {
        const isCorrect = d.isCorrect === true;
        const wasAnswered = !!d.chosen;

        // badges: si ton modèle n’expose pas category/difficulty dans details,
        // tu peux les récupérer via this.quiz.questions[i]
        let category = d.category, difficulty = d.difficulty;
        if (!category || !difficulty) {
            const q = this.quiz.questions[i];
            category = q?.category || "";
            difficulty = q?.difficulty || "";
        }

        const yourAnswerLine = wasAnswered && !isCorrect
          ? `<div class="wrong">Your answer: ${d.chosen}</div>`
          : "";

        const notAnsweredLine = !wasAnswered
          ? `<div class="muted">Not answered</div>`
          : "";

        const correctLine = `<div class="right">Correct answer: ${d.correct}</div>`;

        const item = document.createElement("div");
        item.className = "review-item";
        item.innerHTML = `
          <div class="review-row">
            <div class="icon-dot ${isCorrect ? "correct" : "incorrect"}">
              ${isCorrect ? checkSvg : xSvg}
            </div>
            <div class="review-content">
              <div class="review-head">
                <p class="review-qtext">
                  <span class="results-subtle">Q${i + 1}:</span> ${d.question}
                </p>
                <div class="badges">
                  <span class="badge secondary">${category}</span>
                  <span class="badge outline">${difficulty}</span>
                </div>
              </div>
              <div class="answers">
                ${yourAnswerLine}
                ${notAnsweredLine}
                ${correctLine}
              </div>
            </div>
          </div>
        `;
        list.appendChild(item);
    });

    // Bouton restart (réutilise ton handler déjà bindé dans _bindEvents)
    const newRestartBtn = this.resultsContainer.querySelector("#restartBtn");
    newRestartBtn.addEventListener("click", () => this._onRestart());

    // Afficher la page résultats / cacher le quiz
    this.quizContainer.style.display = "none";
    this.resultsContainer.style.display = "flex";
}


    _showMessage(text, isError = false) {
        this.message.textContent = text;
        this.message.style.color = isError ? "darkred" : "inherit";
    }

    _clearMessage() {
        this.message.textContent = "";
    }
}
