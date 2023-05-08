const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnswerSchema = new Schema({
    playerID: String,
    answerType: Number, // 0: mission, 1: dimension test, 2: eval_pre, 3: eval_post
	questionID: String,
	dimension: Number,
	answer: Number,
	isCorrected: Boolean,
});

mongoose.model('Answers',AnswerSchema);

