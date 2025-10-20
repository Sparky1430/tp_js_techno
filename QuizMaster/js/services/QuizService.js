// js/services/QuizService.js
import Question from "../models/Question.js";

export default class QuizService {
    static BASE = "https://opentdb.com";

    /**
     * Fetch categories from OpenTDB
     * returns array of {id, name}
     */
    static async fetchCategories() {
        const url = `${this.BASE}/api_category.php`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Impossible de récupérer les catégories");
        const data = await res.json();
        return data.trivia_categories || [];
    }

    /**
     * Fetch questions
     * amount: number (1-50)
     * category: number or empty string
     * difficulty: easy|medium|hard or empty string
     * type: multiple (we'll use multiple)
     */
    static async fetchQuestions(amount = 10, category = "", difficulty = "") {
        const params = new URLSearchParams();
        params.append("amount", amount);
        if (category) params.append("category", category);
        if (difficulty) params.append("difficulty", difficulty);
        params.append("type", "multiple");

        const url = `${this.BASE}/api.php?${params.toString()}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Erreur réseau: ${res.status}`);
            const json = await res.json();
            if (json.response_code !== 0) {
                // response_code 0 means success
                throw new Error(`API returned response_code ${json.response_code}`);
            }
            const questions = json.results.map(q => new Question(q));
            return questions;
        } catch (err) {
            // rethrow with friendly message
            throw new Error(`Impossible de récupérer les questions : ${err.message}`);
        }
    }
}
