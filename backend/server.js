const express = require("express");
const cors = require("cors");
const short = require("short-uuid");
const bodyParser = require("body-parser");
const keys = require("./config/keys.js");
const app = express();
const mongoose = require("mongoose");
mongoose.connect(keys.mongoURI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

require("./model/PlayerAccount");
require("./model/PlayerInfo");
require("./model/Question");
require("./model/EvalQuestion");
require("./model/Answer");
require("./model/AchievementProgress");

const Account = mongoose.model("PlayerAccounts");
const Info = mongoose.model("PlayerInfos");
const Question = mongoose.model("Questions");
const Answer = mongoose.model("Answers");
const AchievementProgress = mongoose.model("AchievementProgresses");
const EvalQuestion = mongoose.model("EvalQuestions");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.post("/api/register", async (req, res) => {
	const { email, password, name, groupid } = req.body;
	if (!email || !password || !name) {
		res.send("400: Bad request");
		return;
	}

	var userAccount = await Account.findOne({
		email: email,
	});

	if (userAccount) {
		res.send("406: Duplicate");
		return;
	}

	var id = short.generate();

	var userAccount = new Account({
		id: id,
		email: email,
		password: password,
		groupid: groupid ? groupid : "",
		createDate: Date.now(),
	});

	await userAccount.save();

	await initDefaultUserInfo(id, name);

	res.json({
		id: userAccount.id,
		groupid: groupid ? groupid : "",
	});
});

app.post("/api/login", async (req, res) => {
	const { email, password } = req.body;

	var userAccount = await Account.findOne({
		email: email,
	});

	if (userAccount) {
		if (!userAccount.groupid) {
			userAccount.groupid = "";
		}
		res.json(userAccount);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerInfo", async (req, res) => {
	const { id } = req.body;

	var info = await Info.findOne({
		id: id,
	});

	if (info) {
		res.json(info);
	} else {
		var _info = initDefaultUserInfo(id);
		res.json(_info);
		//res.send("400: Bad request");
	}
});

app.post("/api/updatePlayerInfo", async (req, res) => {
	const { playerInfo } = req.body;
	var _info;
	try {
		_info = JSON.parse(playerInfo);
	} catch (error) {
		res.send("update faill");
		return;
	}

	const { id, nickname, fullname, faculty, uni, evalStatus } = _info;

	var _playerInfo = await Info.findOne({
		id: id,
	});

	if (_playerInfo) {
		_playerInfo.id = id;
		_playerInfo.nickname = nickname;
		_playerInfo.fullname = fullname;
		_playerInfo.faculty = faculty;
		_playerInfo.uni = uni;
		_playerInfo.evalStatus = evalStatus;
		await _playerInfo.save();
	} else {
		await initDefaultUserInfo(id);
	}
	res.send("update success");
});

app.post("/api/getQuestionIDs", async (req, res) => {
	const { dimension } = req.body;

	//console.log(req.body);

	var questions = await Question.find({
		dimension: dimension,
	});

	//console.log(questions);

	var ids = [];

	if (questions) {
		//res.json(questions);
		//res.send(question.length);

		for (let i = 0; i < questions.length; i++) {
			ids.push(questions[i].id);
		}
		res.json(ids);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getQuestion", async (req, res) => {
	const { id } = req.body;

	var question = await Question.findOne({
		id: id,
	});

	if (question) {
		res.json(question);
		//res.send(question.length);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getAllEvalIDs", async (req, res) => {
	const { dimension } = req.body;

	//console.log(req.body);

	var questions = await EvalQuestion.find({});

	//console.log(questions);

	var ids = [];

	if (questions) {
		//res.json(questions);
		//res.send(question.length);

		for (let i = 0; i < questions.length; i++) {
			ids.push(questions[i].id);
		}
		res.json(ids);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getEvalIDs", async (req, res) => {
	const { dimension } = req.body;

	//console.log(req.body);

	var questions = await EvalQuestion.find({
		dimension: dimension,
	});

	//console.log(questions);

	var ids = [];

	if (questions) {
		//res.json(questions);
		//res.send(question.length);

		for (let i = 0; i < questions.length; i++) {
			ids.push(questions[i].id);
		}
		res.json(ids);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getEval", async (req, res) => {
	const { id } = req.body;

	var question = await EvalQuestion.findOne({
		id: id,
	});

	if (question) {
		res.json(question);
		//res.send(question.length);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerAnswerIDs", async (req, res) => {
	const { playerID, dimension } = req.body;
	//console.log("request answer for pID:" + playerID + " on " + dimension + " dimension");
	var playerAnswers = await Answer.find({
		playerID: playerID,
		answerType: 1,
		dimension: dimension,
	});
	var dimensionAnswerID = [];
	if (playerAnswers) {
		//dimensionAnswerID = playerScore.dimensionAnswers[dimension];
		for (let i = 0; i < playerAnswers.length; i++) {
			const element = playerAnswers[i];
			dimensionAnswerID.push(element.questionID);
		}
		res.json(dimensionAnswerID);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerAnswer", async (req, res) => {
	const { playerID, questionID } = req.body;

	var playerAnswer = await Answer.findOne({
		playerID: playerID,
		questionID: questionID,
	});

	if (playerAnswer) {
		res.json(playerAnswer);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerEvalAnswerIDs", async (req, res) => {
	const { playerID } = req.body;
	//console.log("request answer for pID:" + playerID + " on " + dimension + " dimension");
	var playerAnswers = await Answer.find({
		playerID: playerID,
		answerType: { $in: [2, 3] },
	});
	var dimensionAnswerID = [];
	if (playerAnswers) {
		//dimensionAnswerID = playerScore.dimensionAnswers[dimension];
		for (let i = 0; i < playerAnswers.length; i++) {
			const element = playerAnswers[i];
			dimensionAnswerID.push(element.questionID);
		}
		res.json(dimensionAnswerID);
	} else {
		res.send("400: Bad request");
	}
});

//{"playerID":"mkStmK1CDJtYn1JqobCWnY","answerType":1,"questionID":"gn4Pd385tT6tyyggFt3XUR","dimension":1,"answer":1,"isCorrected":false}

app.post("/api/updatePlayerAnswer", async (req, res) => {
	const { playerAnswer } = req.body;
	var _answer;
	try {
		_answer = JSON.parse(playerAnswer);
	} catch (error) {
		res.send("update faill");
		return;
	}
	const { playerID, questionID, answerType, dimension, answer, isCorrected } =
		_answer;

	var _playerAnswer = await Answer.findOne({
		playerID: playerID,
		questionID: questionID,
		answerType: answerType,
	});

	if (_playerAnswer) {
		_playerAnswer.answer = answer;
		_playerAnswer.isCorrected = isCorrected;
		await _playerAnswer.save();
	} else {
		_playerAnswer = new Answer({
			playerID: playerID,
			answerType: answerType,
			questionID: questionID,
			dimension: dimension,
			answer: answer,
			isCorrected: isCorrected,
		});
		await _playerAnswer.save();
	}
	res.send("update success");
});

app.post("/api/getAchievementIDs", async (req, res) => {
	const { playerID } = req.body;
	//console.log("request answer for pID:" + playerID + " on " + dimension + " dimension");
	var achievements = await AchievementProgress.find({
		playerID: playerID,
	});
	var achievementsIDs = [];
	if (achievements) {
		//dimensionAnswerID = playerScore.dimensionAnswers[dimension];
		for (let i = 0; i < achievements.length; i++) {
			const element = achievements[i];
			achievementsIDs.push(element.achievementID);
		}
		res.json(achievementsIDs);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getAchievementProgress", async (req, res) => {
	const { playerID, achievementID } = req.body;

	var achievement = await AchievementProgress.findOne({
		playerID: playerID,
		achievementID: achievementID,
	});

	if (achievement) {
		res.json(achievement);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/updateAchievementProgress", async (req, res) => {
	const { achievement } = req.body;
	var obj;
	try {
		obj = JSON.parse(achievement);
	} catch (error) {
		res.send("update faill");
		return;
	}
	const { playerID, achievementID, currentProgress } = obj;

	var _achievement = await AchievementProgress.findOne({
		playerID: playerID,
		achievementID: achievementID,
	});

	if (_achievement) {
		_achievement.currentProgress = currentProgress;
		await _achievement.save();
	} else {
		_achievement = new AchievementProgress({
			playerID: playerID,
			achievementID: achievementID,
			currentProgress: currentProgress,
		});
		await _achievement.save();
	}
	res.send("update success");
});

app.post("/api/getPlayerEvalScore", async (req, res) => {
	const { playerID, type } = req.body;

	var scores = [];

	for (let i = 0; i < 6; i++) {
		var dimension = i + 1;
		var playerAnswers = await Answer.find({
			playerID: playerID,
			answerType: type,
			dimension:dimension
		});
		var evals = await EvalQuestion.find({
			dimension:dimension
		})

		var score = 0;

		if (playerAnswers) {
			for (let j = 0; j < playerAnswers.length; j++) {
				const answer = playerAnswers[j];
				score += answer.answer;
			}
		}

		scores.push(score/(evals.length * 4));
	}

	res.json({evalScore:scores});

});

app.listen(keys.port, () => {
	console.log("v 2");
	console.log("Listening on port: " + keys.port);
});

async function initDefaultUserInfo(id, name) {
	if (!name) name = "agent";
	//create default setting
	var userInfo = new Info({
		id: id,
		nickname: name,
		fullname: "",
		faculty: "",
		uni: "",
		evalStatus: [false, false, false, false, false, false],
	});
	await userInfo.save();
	return userInfo;
}
