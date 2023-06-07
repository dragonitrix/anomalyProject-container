const mongoose = require("mongoose");
const { Schema } = mongoose;

const PlayerScoreSchema = new Schema({
	playerID: String,
    missionScores:[Number],
    testScores:[Number],
    testAnswers:[Number],
    preEvalScores:[Number],
    postEvalScores:[Number],
});


mongoose.model("PlayerScores", PlayerScoreSchema);