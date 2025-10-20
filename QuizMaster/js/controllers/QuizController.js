/* QuizController: manipule le DOM et relie le Quiz au HTML
 * Utilise un objet global QuizApp pour l'initialisation simple
 */
var QuizController = (function(){
	function QuizController(quiz, root){
		this.quiz = quiz;
		this.root = root || document;

		// cache éléments
		this.questionText = this.root.querySelector('#question-text');
		this.choicesEl = this.root.querySelector('#choices');
		this.nextBtn = this.root.querySelector('#next-btn');
		this.restartBtn = this.root.querySelector('#restart-btn');
		this.progress = this.root.querySelector('#progress');
		this.scoreEl = this.root.querySelector('#score');

		this._bindEvents();
		this.render();
	}

	QuizController.prototype._bindEvents = function(){
		var self = this;
		this.nextBtn.addEventListener('click', function(){
			// go to next question if possible
			if(!self.quiz.next()){
				// show final
				self._showFinal();
			} else {
				self.render();
			}
		});

		this.restartBtn.addEventListener('click', function(){
			self.quiz.restart();
			self.render();
		});
	};

	QuizController.prototype._clearChoices = function(){
		this.choicesEl.innerHTML = '';
	};

	QuizController.prototype.render = function(){
		var q = this.quiz.getCurrentQuestion();
		if(!q){
			this._showFinal();
			return;
		}

		this.questionText.textContent = q.text;
		this._clearChoices();

		var self = this;
		// until answered, next button should be disabled
		this.nextBtn.disabled = true;
		q.choices.forEach(function(choiceText, idx){
			var btn = document.createElement('button');
			btn.className = 'choice';
			btn.textContent = choiceText;
			btn.dataset.index = idx;

			btn.addEventListener('click', function(){
				var chosen = parseInt(this.dataset.index, 10);
				var correct = self.quiz.answerCurrent(chosen);
				if(correct){
					this.classList.add('correct');
				} else {
					this.classList.add('wrong');
					// mark correct one
					var correctBtn = self.choicesEl.querySelector('[data-index="'+ self.quiz.getCurrentQuestion().correctIndex +'"]');
					if(correctBtn) correctBtn.classList.add('correct');
				}

				// disable all choices after answering
				Array.prototype.forEach.call(self.choicesEl.children, function(c){ c.disabled = true; });
				// update score display
				self._updateProgress();
				// enable next button so user can proceed
				self.nextBtn.disabled = false;
			});

			self.choicesEl.appendChild(btn);
		});

		this._updateProgress();
	};

	QuizController.prototype._updateProgress = function(){
		var current = this.quiz.currentIndex + 1;
		var total = this.quiz.questions.length;
		this.progress.textContent = 'Question ' + current + ' / ' + total;
		this.scoreEl.textContent = 'Score: ' + this.quiz.score + ' / ' + total;
	};

	QuizController.prototype._showFinal = function(){
		this.questionText.textContent = 'Quiz terminé! Votre score: ' + this.quiz.score + ' / ' + this.quiz.questions.length;
		this._clearChoices();
		this.progress.textContent = '';
	};

	return QuizController;
})();

window.QuizController = QuizController;
