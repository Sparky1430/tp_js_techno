/* Initialisation simple de l'application */
document.addEventListener('DOMContentLoaded', function(){
	// crée ou remplace la zone de quiz dans le DOM et retourne l'élément conteneur
	function ensureQuizArea(){
		var existing = document.getElementById('quiz-area');
		if(existing){
			existing.remove();
		}

		var section = document.createElement('section');
		section.id = 'quiz-area';
		section.className = 'card';
		section.setAttribute('aria-live', 'polite');
		section.innerHTML = '\n\t	<div id="question-container">\n\t\t\t<p id="question-text">La question apparaîtra ici</p>\n\t\t</div>\n\n\t\t<div id="choices" class="choices" role="list"></div>\n\n\t\t<div class="controls">\n\t\t\t<button id="next-btn" class="btn">Suivant</button>\n\t\t\t<button id="restart-btn" class="btn secondary">Recommencer</button>\n\t\t</div>\n\n\t\t<div id="progress" class="progress"></div>\n\t\t<div id="score" class="score"></div>\n\t';

		// append after the form if present, otherwise to body
		var form = document.querySelector('form');
		if(form && form.parentNode){
			form.parentNode.insertBefore(section, form.nextSibling);
		} else {
			document.body.appendChild(section);
		}

		return section;
	}

	// Initialise un quiz et attache le controller au conteneur spécifique
	function startQuizWithOptions(options){
		var container = ensureQuizArea();
		var quiz = QuizService.createQuiz(options);
		var controller = new QuizController(quiz, container);
		window.QuizApp = { quiz: quiz, controller: controller, container: container };
		return controller;
	}

	// Écoute la soumission du formulaire (présent dans le nouveau HTML)
	var form = document.querySelector('form');
	if(form){
		form.addEventListener('submit', function(e){
			e.preventDefault();
			var countEl = document.getElementById('nbrQuestions');
			var count = countEl ? parseInt(countEl.value, 10) : undefined;
			startQuizWithOptions({ count: count });
		});
	} else {
		// Si pas de formulaire, démarrer un quiz par défaut
		startQuizWithOptions();
	}
});
