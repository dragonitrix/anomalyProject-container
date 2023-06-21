const express = require("express");
const cors = require("cors");
const short = require("short-uuid");
const bodyParser = require("body-parser");
const keys = require("./config/keys.js");
const app = express();
const mongoose = require("mongoose");

const ShortUniqueId = require("short-unique-id");
const shortshort = new ShortUniqueId();

const bcrypt = require("bcrypt");
const saltRounds = 10;

mongoose.connect(keys.mongoURI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});


require("./model/PlayerAccount");
require("./model/PlayerInfo");
require("./model/PlayerScore");
require("./model/Question");
require("./model/EvalQuestion");
require("./model/Answer");
require("./model/AchievementProgress");
require("./model/GroupID");
require("./model/GroupInfo");
require("./model/Message");

const Account = mongoose.model("PlayerAccounts");
const AdminAccount = mongoose.model("AdminAccounts");
const Info = mongoose.model("PlayerInfos");
const PlayerScore = mongoose.model("PlayerScores");
const Question = mongoose.model("Questions");
const Answer = mongoose.model("Answers");
const AchievementProgress = mongoose.model("AchievementProgresses");
const EvalQuestion = mongoose.model("EvalQuestions");
const GroupID = mongoose.model("GroupIDs");
const GroupInfo = mongoose.model("GroupInfos");
const Message = mongoose.model("Messages");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.post("/api/register", async (req, res) => {
	const { email, password, name } = req.body;
	var { groupid } = req.body;
	if (!email || !password || !name) {
		res.send("400: Bad request");
		return;
	}

	if (!groupid) {
		groupid = "";
	} else {
		var validID = await GroupID.findOne({
			id: groupid,
		});
		if (!validID) {
			console.log("invalid groupID");
			groupid = "";
		}
	}

	var userAccount = await Account.findOne({
		email: email,
		groupid: groupid,
	});

	if (userAccount) {
		console.log("duplicate user");
		res.send("406: Duplicate");
		return;
	}

	var id = short.generate();

	var userAccount = new Account({
		id: id,
		email: email,
		password: password,
		groupid: groupid,
		createDate: Date.now(),
	});

	await userAccount.save();

	await initDefaultUserInfo(id, name);

	console.log("register new user: " + userAccount.id);
	res.json({
		id: userAccount.id,
		groupid: groupid,
	});
});

app.post("/api/login", async (req, res) => {
	const { email, password } = req.body;
	var { groupid } = req.body;
	if (!groupid) groupid = "";

	console.log("email: " + email);
	console.log("groupid: " + groupid);

	//check if in admin pool
	var adminAccount = await AdminAccount.findOne({
		email: email,
		groupid: groupid,
	});
	if (adminAccount) {
		//console.log("password: " + password);
		//console.log("hash: " + adminAccount.password);
		bcrypt.compare(
			password,
			adminAccount.password,
			async function (err, result) {
				// result == true
				if (result) {
					console.log(" admin login ");
					res.json(adminAccount);
					return;
				} else {
					console.log("admin validation fail");
					res.send("400: Bad request");
					return;
				}
			}
		);
		return;
	} else {
		var userAccount = await Account.findOne({
			email: email,
			groupid: groupid,
		});

		if (userAccount) {
			if (!userAccount.groupid) userAccount.groupid = "";
			if (!userAccount.admin) userAccount.admin = false;
			console.log("login attempted. ");
			res.json(userAccount);
		} else {
			console.log("no userfound on database");
			res.send("400: Bad request");
		}
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
		for (let i = 0; i < playerAnswers.length; i++) {
			const element = playerAnswers[i];
			dimensionAnswerID.push(element.questionID);
		}
		res.json(dimensionAnswerID);
	} else {
		res.send("400: Bad request");
	}
});

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

	await ReCalculatePlayerScore(playerID);

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

	await ReCalculatePlayerScore(playerID);

	var scores = [];
	//
	//for (let i = 0; i < 6; i++) {
	//	var dimension = i + 1;
	//	var playerAnswers = await Answer.find({
	//		playerID: playerID,
	//		answerType: type,
	//		dimension: dimension,
	//	});
	//	var evals = await EvalQuestion.find({
	//		dimension: dimension,
	//	});
	//
	//	var score = 0;
	//
	//	if (playerAnswers) {
	//		for (let j = 0; j < playerAnswers.length; j++) {
	//			const answer = playerAnswers[j];
	//			score += answer.answer + 1;
	//		}
	//	}
	//
	//	//console.log("score: " + score + " max: " + evals.length * 5);
	//
	//	scores.push(score / (evals.length * 5));
	//}

	var playerScore = await PlayerScore.findOne({
		playerID: playerID,
	});
	if (!playerScore) {
		playerScore = await initDefaultPlayerScore(playerID);
	}

	//console.log("type:: " + type);
	//console.log(playerScore);

	if (type == 2) {
		scores = playerScore.preEvalScores;
	}

	if (type == 3) {
		scores = playerScore.postEvalScores;
	}

	res.json({ evalScore: scores });
});

app.post("/api/getPlayerIDs", async (req, res) => {
	const { groupid } = req.body;
	console.log(groupid);
	//console.log("request answer for pID:" + playerID + " on " + dimension + " dimension");
	var playerID = await Account.find({
		groupid: groupid,
	});
	var playerIDs = [];
	if (playerID) {
		for (let i = 0; i < playerID.length; i++) {
			const element = playerID[i];
			playerIDs.push(element.id);
		}
		res.json(playerIDs);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerScoreInfo", async (req, res) => {
	const { playerid } = req.body;

	var startTime = Date.now();

	//console.log("getPlayerScoreInfo");

	//validate playerID
	var playeraccount = await Account.findOne({
		id: playerid,
	});

	if (!playeraccount) {
		console.log("no account found");
		res.send("400: Bad request");
		return;
	}


	var playerScore = await PlayerScore.findOne({
		playerID: playerid,
	});

	var playerScoreInfo = {
		email: playeraccount.email,
		playerScore: playerScore,
	};

	var now = Date.now();
	var deltatime = now - startTime;

	console.log("success retrive player log in " + deltatime + " ms");
	res.json(playerScoreInfo);

	//console.log(playeraccount);
	//console.log(playeraccount.email);

	//var playerScore = {
	//	id: playerid,
	//	name: "",
	//	email: playeraccount.email,
	//	testProgress: [],
	//	evalProgress_pre: [],
	//	evalProgress_post: [],
	//};
	//
	//for (let i = 0; i < 6; i++) {
	//	var dimension = i + 1;
	//	var a = await Answer.find({
	//		playerID: playerid,
	//		dimension: dimension,
	//	});
	//	var q = await Question.find({
	//		dimension: dimension,
	//	});
	//	var aCount = a.length;
	//	var qCount = q.length;
	//	playerScore.testProgress.push({
	//		progress: aCount,
	//		total: qCount,
	//	});
	//}
	//for (let i = 0; i < 6; i++) {
	//	var dimension = i + 1;
	//	var playerAnswers = await Answer.find({
	//		playerID: playerid,
	//		answerType: 2,
	//		dimension: dimension,
	//	});
	//	var evals = await EvalQuestion.find({
	//		dimension: dimension,
	//	});
	//
	//	var score = 0;
	//
	//	if (playerAnswers) {
	//		for (let j = 0; j < playerAnswers.length; j++) {
	//			const answer = playerAnswers[j];
	//			score += answer.answer + 1;
	//		}
	//	}
	//	playerScore.evalProgress_pre.push({
	//		progress: score,
	//		total: evals.length * 5,
	//	});
	//}
	//for (let i = 0; i < 6; i++) {
	//	var dimension = i + 1;
	//	var playerAnswers = await Answer.find({
	//		playerID: playerid,
	//		answerType: 3,
	//		dimension: dimension,
	//	});
	//	var evals = await EvalQuestion.find({
	//		dimension: dimension,
	//	});
	//
	//	var score = 0;
	//
	//	if (playerAnswers) {
	//		for (let j = 0; j < playerAnswers.length; j++) {
	//			const answer = playerAnswers[j];
	//			score += answer.answer + 1;
	//		}
	//	}
	//	playerScore.evalProgress_post.push({
	//		progress: score,
	//		total: evals.length * 5,
	//	});
	//}
});

app.post("/api/getGroupInfo", async (req, res) => {
	const { groupID } = req.body;

	var groupInfo = await GroupInfo.findOne({
		groupID: groupID,
	});

	if (groupInfo) {
		res.json(groupInfo);
	} else {
		res.send("invalid data");
	}
});

app.post("/api/updateGroupDate", async (req, res) => {
	const { groupID, date } = req.body;

	var groupInfo = await GroupInfo.findOne({
		groupID: groupID,
	});

	if (groupInfo) {
		//groupInfo.classStartTime = date
		//await groupInfo.save();
		res.json(groupInfo);
	} else {
		res.send("invalid data");
	}
});

app.post("/api/getOverallScore", async (req, res) => {



	const { groupid } = req.body;

	console.log("getGroupScore");

	//hard coding getting data from achievement
	missionUID = [
		[
			"3dpTiiCnZ9RR6nzXntk2DB", //D1
			"gGuove6vaWsiKmercmJzxf",
			"9x2EfuRJhYfT6phTZwDbSS",
		],
		[
			"jjbxNCgdZPWaPxYPQC5o35", //D2
			"8ge2gDyDwUtEYfCJ4u9btn",
			"7V9Aj8KM3HMPoXsp2LrGjh",
		],
		[
			"gieagNQB8xxYhNWHds85vd", //D3
			"hxSjKQBAfgGM98vHqJ5EWe",
			"bF3ca6QTti9JpF5gdQXYGp",
		],
		[
			"rPaTur4X2bmo8hb5zvuBNq", //D4
			"4MVHyAbgjVGUcoZ8wFaVTM",
			"m1j5VhQLPQ6jQYeri7PPYB",
		],
		[
			"dzyw463KZujvbkhTF273kJ", //D5
			"uL5miRSqF6TFn7nYCFjz6q",
			"5y6ULqs81KBJvpGh7LthWp",
		],
		[
			"skBgLH3ohXQV8A8Pkmn1oi", //D6
			"cDdrvpPezzSfFYGv3vD1z4",
			"f3Ewv6DwJNqYzkChQstKo1",
		],
	];

	var testDatas = [
		[{}, {}, {}, {}],
		[{}, {}, {}, {}],
		[{}, {}, {}, {}],
		[{}, {}, {}, {}],
		[{}, {}, {}, {}],
		[{}, {}, {}, {}],
	];
	var missionDatas = [
		[{}, {}, {}],
		[{}, {}, {}],
		[{}, {}, {}],
		[{}, {}, {}],
		[{}, {}, {}],
		[{}, {}, {}],
	];
	var evalDatas = [
		[{}, {}],
		[{}, {}],
		[{}, {}],
		[{}, {}],
		[{}, {}],
		[{}, {}],
	];

	//???
	for (let i = 0; i < missionDatas.length; i++) {
		for (let j = 0; j < missionDatas[i].length; j++) {
			missionDatas[i][j] = {
				count: 0,
				avg: 0,
				sd: 0
			}
		}
	}
	//console.log("missiondata b");
	//console.log(missionDatas);

	var players = await Account.find({
		groupid: groupid,
	});

	if (players) {
		console.log("players found: " + players.length);
		var playerIDs = [];
		for (var i = 0; i < players.length; i++) {
			var player = players[i];
			var playerID = player.id;
			playerIDs.push(playerID);
		}

		//test filter
		//var playerInfo = await Info.find({
		//	id: { $in: playerIDs },
		//});


		var totalScore = {
			mission: [[], [], [], [], [], []],
			test: [[], [], [], [], [], []],
			testAnswer: [[], [], [], [], [], []],
			evalPre: [[], [], [], [], [], []],
			evalPost: [[], [], [], [], [], []],
		}

		console.log("start preparing data");

		for (var i = 0; i < playerIDs.length; i++) {
			const playerID = playerIDs[i];

			var playerScore = await PlayerScore.findOne({
				playerID: playerID,
			});
			if (!playerScore) playerScore = await initDefaultPlayerScore(playerID);

			for (var j = 0; j < 6; j++) {
				totalScore.mission[j].push(playerScore.missionScores[j]);
				totalScore.test[j].push(playerScore.testScores[j]);
				totalScore.testAnswer[j].push(playerScore.testAnswers[j]);
				totalScore.evalPre[j].push(playerScore.preEvalScores[j]);
				totalScore.evalPost[j].push(playerScore.postEvalScores[j]);
			}

			//mission data
			var achievements = await AchievementProgress.find({
				playerID: playerID,
			});

			for (let j = 0; j < achievements.length; j++) {
				const achievement = achievements[j];
				for (let k = 0; k < 6; k++) {
					var aID = achievement.achievementID;
					if (aID == missionUID[k][0]) missionDatas[k][0].count++;
					if (aID == missionUID[k][1]) missionDatas[k][1].count++;
					if (aID == missionUID[k][2]) missionDatas[k][2].count++;
				}
			}
		}
		console.log("finished preparing data");

		for (var i = 0; i < 6; i++) {

			var test_5 = [];
			var test_10 = [];
			var test_15 = [];
			var test_20 = [];

			// var mission_try = [];
			// var mission_finish = [];
			// var mission_perfect = [];

			var eval_pre = [];
			var eval_post = [];

			for (var j = 0; j < playerIDs.length; j++) {
				// test data
				var testAnswer = totalScore.testAnswer[i][j];
				var testScore = totalScore.test[i][j];
				if (testAnswer >= 5) test_5.push(testScore)
				if (testAnswer >= 10) test_10.push(testScore)
				if (testAnswer >= 15) test_15.push(testScore)
				if (testAnswer >= 20) test_20.push(testScore)

				// //mission data
				// var missionScore = totalScore.mission[i][j];
				// if (missionScore) mission_try.push(missionScore);
				// if (missionScore > 0) mission_finish.push(missionScore);
				// if (missionScore >= 3) mission_perfect.push(missionScore);

				eval_pre.push(totalScore.evalPre[i][j])
				eval_post.push(totalScore.evalPost[i][j])
			}

			testDatas[i][0] = {
				count: test_5.length,
				avg: getAvg(test_5),
				sd: getStandardDeviation(test_5)
			}
			testDatas[i][1] = {
				count: test_10.length,
				avg: getAvg(test_10),
				sd: getStandardDeviation(test_10)
			}
			testDatas[i][2] = {
				count: test_15.length,
				avg: getAvg(test_15),
				sd: getStandardDeviation(test_15)
			}
			testDatas[i][3] = {
				count: test_20.length,
				avg: getAvg(test_20),
				sd: getStandardDeviation(test_20)
			}

			evalDatas[i][0] = {
				count: getTotal(eval_pre),
				avg: getAvg(eval_pre),
				sd: getStandardDeviation(eval_pre)
			}
			evalDatas[i][1] = {
				count: getTotal(eval_post),
				avg: getAvg(eval_post),
				sd: getStandardDeviation(eval_post)
			}
		}

		//console.log(testDatas);
		//console.log(missionDatas);
		//console.log(evalDatas);

		var msg = {
			count: playerIDs.length,

			testDatas: testDatas,
			missionDatas: missionDatas,
			evalDatas: evalDatas,
		};

		console.log("finish getting group data");
		//console.log(msg);
		res.json(msg);
	} else {
		res.send("400: Bad request");
	}
});

app.listen(keys.port, () => {
	console.log("v 2");
	console.log("Listening on port: " + keys.port);
});

async function regisAdmin() {
	var groupids = await GroupID.find();

	var emails = [];
	var passwords = [];

	console.log("== groupid");
	for (let i = 0; i < groupids.length; i++) {
		const groupid = groupids[i];
		console.log(groupid.id);

		//gen email
		var uuid = shortshort();
		var email = "admin" + uuid + "@mail.com";
		emails.push(email);
		passwords.push(shortshort());
	}

	console.log("== email");
	for (let i = 0; i < emails.length; i++) {
		console.log(emails[i]);
	}
	console.log("== password");
	for (let i = 0; i < passwords.length; i++) {
		console.log(passwords[i]);
	}

	//console.log("== password hash");
	//for (let i = 0; i < groupids.length; i++) {
	//	//console.log(passwords[i]);
	//	bcrypt.genSalt(saltRounds, function(err, salt) {
	//		bcrypt.hash(passwords[i], salt, function(err, hash) {
	//			// Store hash in your password DB.
	//			passwordshash.push(hash);
	//		});
	//	});
	//}

	for (let i = 0; i < groupids.length; i++) {
		const groupid = groupids[i];
		const email = emails[i];
		//const password = passwords[i];
		var password = "";

		bcrypt.genSalt(saltRounds, async function (err, salt) {
			bcrypt.hash(passwords[i], salt, async function (err, hash) {
				// Store hash in your password DB.
				password = hash;
				var id = short.generate();

				var userAccount = new AdminAccount({
					id: id,
					email: email,
					password: password,
					groupid: groupid.id,
					admin: true,
					createDate: Date.now(),
				});

				await userAccount.save();
				await initDefaultUserInfo(id, "admin");
				console.log("register new user: " + userAccount.id);
			});
		});
	}
}

async function regisAdmin1() {
	//gen email
	var uuid = shortshort();
	var email = "admin" + uuid + "@mail.com";
	console.log("email", email);
	var password = shortshort();
	var passwordhash = "";
	console.log("pass", password);

	bcrypt.genSalt(saltRounds, async function (err, salt) {
		bcrypt.hash(password, salt, async function (err, hash) {
			// Store hash in your password DB.
			passwordhash = hash;
			var id = short.generate();

			var userAccount = new AdminAccount({
				id: id,
				email: email,
				password: passwordhash,
				groupid: "",
				admin: true,
				createDate: Date.now(),
			});

			await userAccount.save();
			await initDefaultUserInfo(id, "admin");
			console.log("register new user: " + userAccount.id);
		});
	});
}

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

async function initDefaultPlayerScore(id) {
	//create default setting
	var playerScore = new PlayerScore({
		id: id,
		missionScores: [0, 0, 0, 0, 0, 0],
		testScores: [0, 0, 0, 0, 0, 0],
		testAnswers: [0, 0, 0, 0, 0, 0],
		preEvalScores: [0, 0, 0, 0, 0, 0],
		postEvalScores: [0, 0, 0, 0, 0, 0],
	});
	await playerScore.save();
	return playerScore;
}

app.post("/api/updatePlayerMissionScore", async (req, res) => {
	const { playerID, dimension, score } = req.body;

	var playerScore = await PlayerScore.findOne({
		playerID: playerID,
	});

	if (!playerScore) {
		playerScore = await initDefaultPlayerScore(playerID);
	}
	playerScore.missionScores[dimension - 1] = score;
	await playerScore.save();
	res.json(playerScore);
});

app.post("/api/updatePlayerTestScore", async (req, res) => {
	const { playerID, dimension, score } = req.body;

	var playerScore = await PlayerScore.findOne({
		playerID: playerID,
	});

	if (!playerScore) {
		playerScore = await initDefaultPlayerScore(playerID);
	}

	playerScore.testScores[dimension - 1] = score;
	await playerScore.save();
	res.json(playerScore);
});

app.post("/api/updatePlayerPreEvalScore", async (req, res) => {
	const { playerID, dimension, score } = req.body;

	var playerScore = await PlayerScore.findOne({
		playerID: playerID,
	});

	if (!playerScore) {
		playerScore = await initDefaultPlayerScore(playerID);
	}

	playerScore.preEvalScores[dimension - 1] = score;
	await playerScore.save();
	res.json(playerScore);
});

app.post("/api/updatePlayerPostEvalScore", async (req, res) => {
	const { playerID, dimension, score } = req.body;

	var playerScore = await PlayerScore.findOne({
		playerID: playerID,
	});

	if (!playerScore) {
		playerScore = await initDefaultPlayerScore(playerID);
	}

	playerScore.postEvalScores[dimension - 1] = score;
	await playerScore.save();
	res.json(playerScore);
});

async function ReCalculatePlayerScore(playerID) {
	//console.log("ReCalculatePlayerScore");
	var playerScore = await PlayerScore.findOne({
		playerID: playerID,
	});

	if (!playerScore) {
		playerScore = await initDefaultPlayerScore(playerID);
	}

	var id = playerID;

	for (let i = 1; i <= 6; i++) {
		var dimension = i;

		var testAnswer = await Answer.find({
			playerID: id,
			answerType: 1,
			dimension: dimension,
		});
		playerScore.testAnswers[dimension - 1] = testAnswer.length;

		var testAnswerCorrected = await Answer.find({
			playerID: id,
			answerType: 1,
			dimension: dimension,
			isCorrected: true,
		});
		playerScore.testScores[dimension - 1] = testAnswerCorrected.length;

		var preEvalAnswer = await Answer.find({
			playerID: id,
			answerType: 2,
			dimension: dimension,
			isCorrected: true,
		});
		playerScore.preEvalScores[dimension - 1] = preEvalAnswer.length;

		var postEvalAnswer = await Answer.find({
			playerID: id,
			answerType: 3,
			dimension: dimension,
			isCorrected: true,
		});
		playerScore.postEvalScores[dimension - 1] = postEvalAnswer.length;
	}
	//console.log(playerScore);
	await playerScore.save();
}

app.post("/api/sendMessage", async (req, res) => {
	const { playerID, groupID, text } = req.body;

	var message = new Message({
		id: short.generate(),
		sessionID: short.generate(),
		sessionType: 0,
		playerID: playerID,
		groupID: groupID,
		timeStamp: Date.now(),
		text: text
	})
	await message.save();

	res.send("200: success");
});

function getTotal(array) {
	if (!array || array.length === 0) { return 0; }
	const n = array.length
	const total = array.reduce((a, b) => a + b)
	return total
}

function getAvg(array) {
	if (!array || array.length === 0) { return 0; }
	const n = array.length
	const mean = array.reduce((a, b) => a + b) / n
	return mean
}

function getStandardDeviation(array) {
	if (!array || array.length === 0) { return 0; }
	const n = array.length
	const mean = array.reduce((a, b) => a + b) / n
	return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}