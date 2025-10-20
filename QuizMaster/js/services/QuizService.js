/* QuizService
 * - fournit des questions par défaut
 * - factory pour créer un Quiz
 */
var QuizService = (function(){
	function defaultQuestions(){
		return [
			new Question('Quel est le plus grand océan du monde ?', ['Atlantique','Pacifique','Indien','Arctique'], 1),
			new Question('Combien y a-t-il de jours dans une année bissextile ?', ['364','365','366','360'], 2),
			new Question('Quelle est la capitale de la France ?', ['Marseille','Lyon','Paris','Nice'], 2),
			new Question('Quelle planète est connue comme la planète rouge ?', ['Terre','Mars','Vénus','Jupiter'], 1)
		];
	}

		return {
			/**
			 * createQuiz(customQuestionsOrOptions)
			 * - If passed an array, uses it as questions.
			 * - If passed an object {count: n}, returns a Quiz with up to n default questions.
			 * - If omitted, returns a Quiz with default questions.
			 */
			createQuiz: function(customQuestionsOrOptions){
				var qs;
				if(Array.isArray(customQuestionsOrOptions) && customQuestionsOrOptions.length){
					qs = customQuestionsOrOptions;
				} else if(customQuestionsOrOptions && typeof customQuestionsOrOptions === 'object' && customQuestionsOrOptions.count){
					var all = defaultQuestions();
					var count = parseInt(customQuestionsOrOptions.count, 10) || all.length;
					if(count <= 0) count = all.length;
					// if asked more than available, just slice available
					qs = all.slice(0, Math.min(count, all.length));
				} else {
					qs = defaultQuestions();
				}

				return new Quiz(qs);
			}
		};
})();

window.QuizService = QuizService;
