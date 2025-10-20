/* Question model
 * properties:
 *  - text: string
 *  - choices: array of strings
 *  - correctIndex: number
 */


function Question(text, choices, correctIndex){
	this.text = text || '';
	this.choices = Array.isArray(choices) ? choices : [];
	this.correctIndex = Number.isInteger(correctIndex) ? correctIndex : 0;
}

Question.prototype.isCorrect = function(choiceIndex){
	return choiceIndex === this.correctIndex;
};

/* Expose to global scope for simple usage without bundler */
window.Question = Question;
