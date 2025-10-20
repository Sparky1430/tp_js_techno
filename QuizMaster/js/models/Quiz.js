/* Quiz model
 * - questions: array of Question
 * - currentIndex: number
 * - score: number
 */
function Quiz(questions){
	this.questions = Array.isArray(questions) ? questions : [];
	this.currentIndex = 0;
	this.score = 0;
}

Quiz.prototype.getCurrentQuestion = function(){
	return this.questions[this.currentIndex] || null;
};

Quiz.prototype.answerCurrent = function(choiceIndex){
	var q = this.getCurrentQuestion();
	if(!q) return false;
	var correct = q.isCorrect(choiceIndex);
	if(correct) this.score++;
	return correct;
};

Quiz.prototype.next = function(){
	if(this.currentIndex < this.questions.length - 1){
		this.currentIndex++;
		return true;
	}
	return false;
};

Quiz.prototype.restart = function(){
	this.currentIndex = 0;
	this.score = 0;
};

window.Quiz = Quiz;
