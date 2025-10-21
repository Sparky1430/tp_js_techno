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

    // timer for each question (seconds)
    this._questionTime = 10; // default 10 seconds
    this._timeLeft = 0;
    this._timer = null;

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
    if (this.form) {
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.startQuiz();
      });
    }

    if (this.prevBtn) this.prevBtn.addEventListener("click", () => this._onPrev());
    if (this.nextBtn) this.nextBtn.addEventListener("click", () => this._onNext());
    if (this.restartBtn) this.restartBtn.addEventListener("click", () => this._onRestart());
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
    const amount = Number(this.nbrQuestions?.value) || 10;
    const category = this.category?.value || "";
    const difficulty = this.difficulty?.value || "";

    // UI feedback
    this._showMessage && this._showMessage("Récupération des questions...", false);
    if (this.startBtn) this.startBtn.disabled = true;

        try {
            const questions = await QuizService.fetchQuestions(amount, category, difficulty);
            if (!questions || questions.length === 0) {
                throw new Error("Aucune question récupérée pour cette configuration.");
            }

            // create quiz model
            this.quiz = new Quiz(questions);

            // hide config form, show quiz container
         
            if (this.home) this.home.style.display = "none";
            if (this.resultsContainer) this.resultsContainer.style.display = "none";
            if (this.quizContainer) this.quizContainer.style.display = "flex";
            this._clearMessage && this._clearMessage();

            // render first question
            this._renderCurrentQuestion && this._renderCurrentQuestion();
            this._updateMeta && this._updateMeta();
        } catch (err) {
            this._showMessage(err.message, true);
    } finally {
      if (this.startBtn) this.startBtn.disabled = false;
    }
    }

    _renderCurrentQuestion() {
    if (!this.quiz || !this.questionCard) return;
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
  this._updateNavButtons && this._updateNavButtons();

  // start timer for this question
  this._startTimer && this._startTimer();
    }

    _onSelectAnswer(answer, btnElem) {
    if (!this.quiz) return;
    // submit to model
    this.quiz.answerCurrentQuestion(answer);

    // stop timer when user answers
    this._clearTimer && this._clearTimer();

        // visually mark selected button and unmark others
    const allBtns = this.questionCard.querySelectorAll(".answerBtn, .answerRadio, button");
        allBtns.forEach(b => {
            b.dataset.selected = "false";
            b.setAttribute("aria-pressed", "false");
            b.classList.remove("correct");
            b.classList.remove("incorrect");
        });

    if (btnElem) {
      btnElem.dataset.selected = "true";
      btnElem.setAttribute("aria-pressed", "true");
    }

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
  this._updateMeta && this._updateMeta();

        // if this was the last question and all answered, show results
    const atLast = this.quiz.currentIndex === this.quiz.total - 1;
    if (atLast && this.quiz.isFinished()) {
      this._showResults && this._showResults();
    }
    }

    _onNext() {
        // clear any running timer before navigating
        this._clearTimer && this._clearTimer();

        if (!this.quiz) return;
        const moved = this.quiz.goNext();

        if (moved) {
            this._renderCurrentQuestion && this._renderCurrentQuestion();
            this._updateMeta && this._updateMeta();
            return;
        }

        // si on n'a pas pu avancer, on est probablement sur la dernière question
        if (this.quiz.isFinished()) {
            this._showResults && this._showResults();
        } else {
            this._showMessage && this._showMessage("Vous êtes à la dernière question. Répondez puis utilisez Précédent ou Recommencer.", false);
        }
    }

    _onPrev() {
    if (!this.quiz) return;
    const moved = this.quiz.goPrev();
    if (moved) {
      this._renderCurrentQuestion && this._renderCurrentQuestion();
      this._updateMeta && this._updateMeta();
    }
    }

    _onRestart() {
        // reset UI
    if (this.form) this.form.style.display = "block";
    if (this.quizContainer) this.quizContainer.style.display = "none";
    if (this.resultsContainer) this.resultsContainer.style.display = "none";
    this._clearMessage && this._clearMessage();
        // keep selects as they were
        this.quiz = null;
        window.location.href = 'index.html';
    }

    _updateMeta() {
    if (!this.quiz) return;
    const idx = this.quiz.currentIndex + 1;
    if (this.questionMeta) this.questionMeta.textContent = `Question ${idx} of ${this.quiz.total}`;

    // ✅ Affichage catégorie & difficulté
    const q = this.quiz.currentQuestion;
    if (this.categoryBtn) this.categoryBtn.textContent = q?.category || '';
    if (this.difficultyBtn) this.difficultyBtn.textContent = q?.difficulty || '';

    // calcul de la progression
    const progressPercent = (idx / this.quiz.total) * 100;
    if (this.progressFill) this.progressFill.style.width = `${progressPercent}%`;
    }

    _updateNavButtons() {
    if (!this.quiz) return;
    if (this.prevBtn) this.prevBtn.disabled = this.quiz.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.quiz.currentIndex === this.quiz.total - 1 && !this.quiz.isFinished();
    }

  // Timer methods
  _startTimer() {
    // clear any previous timer
    this._clearTimer && this._clearTimer();
    this._timeLeft = this._questionTime;
    // initial display
    this._showMessage && this._showMessage(`Temps restant pour répondre : ${this._timeLeft} secondes`, false);
    const self = this;
    this._timer = setInterval(() => self._tick(), 1000);
  }

  _tick() {
    this._timeLeft -= 1;
    if (this._timeLeft <= 0) {
      this._clearTimer && this._clearTimer();
      this._onTimeUp && this._onTimeUp();
      return;
    }
    this._showMessage && this._showMessage(`Temps restant pour répondre : ${this._timeLeft} secondes`, false);
  }

  _clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    // remove timer message if it was the timer one
    if (this.message && this.message.textContent && this.message.textContent.startsWith('Temps restant')) {
      this._clearMessage && this._clearMessage();
    }
  }

  _onTimeUp() {
    // show a short message
    this._showMessage && this._showMessage('Temps écoulé pour cette question.', false);
    // move to next after a short pause
    setTimeout(() => {
      if (!this.quiz) return;
      const moved = this.quiz.goNext();
      if (moved) {
        this._renderCurrentQuestion && this._renderCurrentQuestion();
        this._updateMeta && this._updateMeta();
      } else {
        if (this.quiz.isFinished()) {
          this._showResults && this._showResults();
        }
      }
    }, 800);
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


// Thème: light par défaut (aucun attribut). On stocke dans localStorage.
(function setupThemeToggle() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');

  function apply(label, isDark) {
    btn.textContent = isDark ? '☀️ Light mode' : '🌙 Dark mode';
    btn.setAttribute('aria-pressed', String(isDark));
  }

  // Init depuis storage
  const stored = localStorage.getItem('theme'); // 'dark' | 'light' | null
  if (stored === 'dark') {
    root.setAttribute('data-theme', 'dark');
    apply('Dark', true);
  } else {
    root.removeAttribute('data-theme');
    apply('Light', false);
  }

  btn.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');     // repasse en light
      localStorage.setItem('theme', 'light');
      apply('Light', false);
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      apply('Dark', true);
    }
  });
})();