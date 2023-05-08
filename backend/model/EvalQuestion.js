const mongoose = require("mongoose");
const { Schema } = mongoose;

const EvalQuestionSchema = new Schema({
	id: String,
	type: Number,
	dimension: Number,
	question: String,
	choices: [String],
	answer: Number,
});

mongoose.model("EvalQuestions", EvalQuestionSchema);
