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
require("./model/Question");
require("./model/EvalQuestion");
require("./model/Answer");
require("./model/AchievementProgress");
require("./model/GroupID");

const Account = mongoose.model("PlayerAccounts");
const AdminAccount = mongoose.model("AdminAccounts");
const Info = mongoose.model("PlayerInfos");
const Question = mongoose.model("Questions");
const Answer = mongoose.model("Answers");
const AchievementProgress = mongoose.model("AchievementProgresses");
const EvalQuestion = mongoose.model("EvalQuestions");
const GroupID = mongoose.model("GroupIDs");

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
			dimension: dimension,
		});
		var evals = await EvalQuestion.find({
			dimension: dimension,
		});

		var score = 0;

		if (playerAnswers) {
			for (let j = 0; j < playerAnswers.length; j++) {
				const answer = playerAnswers[j];
				score += answer.answer + 1;
			}
		}

		//console.log("score: " + score + " max: " + evals.length * 5);

		scores.push(score / (evals.length * 5));
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
		//dimensionAnswerID = playerScore.dimensionAnswers[dimension];
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

	//var playerinfo = await Info.find({
	//	id: playerid,
	//});

	//var playerAnswers = await Answer.find({
	//	playerID: playerID,
	//});

	//console.log(playeraccount);
	//console.log(playeraccount.email);

	var playerScore = {
		id: playerid,
		name: "",
		email: playeraccount.email,
		testProgress: [],
		evalProgress_pre: [],
		evalProgress_post: [],
	};

	for (let i = 0; i < 6; i++) {
		var dimension = i + 1;
		var a = await Answer.find({
			playerID: playerid,
			dimension: dimension,
		});
		var q = await Question.find({
			dimension: dimension,
		});
		var aCount = a.length;
		var qCount = q.length;
		playerScore.testProgress.push({
			progress: aCount,
			total: qCount,
		});
	}
	for (let i = 0; i < 6; i++) {
		var dimension = i + 1;
		var playerAnswers = await Answer.find({
			playerID: playerid,
			answerType: 2,
			dimension: dimension,
		});
		var evals = await EvalQuestion.find({
			dimension: dimension,
		});

		var score = 0;

		if (playerAnswers) {
			for (let j = 0; j < playerAnswers.length; j++) {
				const answer = playerAnswers[j];
				score += answer.answer + 1;
			}
		}
		playerScore.evalProgress_pre.push({
			progress: score,
			total: evals.length * 5,
		});
	}
	for (let i = 0; i < 6; i++) {
		var dimension = i + 1;
		var playerAnswers = await Answer.find({
			playerID: playerid,
			answerType: 3,
			dimension: dimension,
		});
		var evals = await EvalQuestion.find({
			dimension: dimension,
		});

		var score = 0;

		if (playerAnswers) {
			for (let j = 0; j < playerAnswers.length; j++) {
				const answer = playerAnswers[j];
				score += answer.answer + 1;
			}
		}
		playerScore.evalProgress_post.push({
			progress: score,
			total: evals.length * 5,
		});
	}

	console.log("get score complete");
	res.json(playerScore);
});

app.post("/api/getOverallScore", async (req, res) => {
	const { groupid } = req.body;

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
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];
	var missionDatas = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0],
	];
	var evalCounts = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
	];
	var evalTotals = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
	];
	var evalAvgs = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
	];

	var players = await Account.find({
		groupid: groupid,
	});

	if (players) {
		//console.log(players);
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

		for (var i = 0; i < playerIDs.length; i++) {
			const playerID = playerIDs[i];

			//test data
			var answers = await Answer.find({
				playerID: playerID,
				answerType: 1,
			});
			var testcounts = [0, 0, 0, 0, 0, 0];

			for (let j = 0; j < answers.length; j++) {
				testcounts[answers[j].dimension - 1]++;
			}
			for (let j = 0; j < testcounts.length; j++) {
				if (testcounts[j] >= 5) testDatas[j][0]++;
				if (testcounts[j] >= 10) testDatas[j][1]++;
				if (testcounts[j] >= 15) testDatas[j][2]++;
				if (testcounts[j] >= 20) testDatas[j][3]++;
			}

			//mission data
			var achievements = await AchievementProgress.find({
				playerID: playerID,
			});

			for (let j = 0; j < achievements.length; j++) {
				const achievement = achievements[j];
				for (let k = 0; k < 6; k++) {
					var aID = achievement.achievementID;
					if (aID == missionUID[k][0]) missionDatas[k][0]++;
					if (aID == missionUID[k][1]) missionDatas[k][1]++;
					if (aID == missionUID[k][2]) missionDatas[k][2]++;
				}
			}

			//eval data
			var evals_pre = await Answer.find({
				playerID: playerID,
				answerType: 2,
			});
			var evals_post = await Answer.find({
				playerID: playerID,
				answerType: 3,
			});

			var prescore = [0, 0, 0, 0, 0, 0];
			var postscore = [0, 0, 0, 0, 0, 0];

			for (let j = 0; j < evals_pre.length; j++) {
				prescore[evals_pre[j].dimension - 1] += evals_pre[j].answer;
			}
			for (let j = 0; j < evals_post.length; j++) {
				postscore[evals_post[j].dimension - 1] += evals_post[j].answer;
			}

			//add evals count
			//add total
			for (let j = 0; j < prescore.length; j++) {
				if (prescore[j] != 0) evalCounts[j][0]++;
				evalTotals[j][0] += prescore[j];
			}
			for (let j = 0; j < postscore.length; j++) {
				if (postscore[j] != 0) evalCounts[j][1]++;
				evalTotals[j][1] += postscore[j];
			}
		}

		for (let i = 0; i < evalTotals.length; i++) {
			evalAvgs[i][0] =
				Math.round((evalTotals[i][0] / evalCounts[i][0]) * 100) / 100;
			evalAvgs[i][1] =
				Math.round((evalTotals[i][1] / evalCounts[i][1]) * 100) / 100;
		}

		var msg = {
			count:playerIDs.length,
			testDatas: testDatas,
			missionDatas: missionDatas,
			evalCounts: evalCounts,
			evalTotals: evalTotals,
			evalAvgs: evalAvgs,
		};
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
