const mongoose = require('mongoose');
const { Schema } = mongoose;

const AchievementProgressSchema = new Schema({
    playerID: String,
	achievementID: String,
	currentProgress: Number
});

mongoose.model('AchievementProgresses',AchievementProgressSchema);

