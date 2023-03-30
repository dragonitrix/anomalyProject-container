const mongoose = require("mongoose");
const { Schema } = mongoose;

const AnswerSchema = new Schema({
	id: String,
	dimension: Number,
	answer: Number,
	isCorrected: Boolean,
});

const ScoreSchema = new Schema({
	id: String,
	dimensionAnswers:[AnswerSchema],
	evalAnswers:[AnswerSchema]
});

mongoose.model("PlayerScore", ScoreSchema);
