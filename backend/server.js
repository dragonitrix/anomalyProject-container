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
require("./model/PlayerScore");
require("./model/Question");

const Account = mongoose.model("PlayerAccounts");
const Info = mongoose.model("PlayerInfos");
const Score = mongoose.model("PlayerScore");
const Question = mongoose.model("Questions");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.post("/api/register", async (req, res) => {
	console.log(req.body);
	const { email, password, name } = req.body;
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
		createDate: Date.now(),
	});

	await userAccount.save();

	//create default setting
	var userInfo = new Info({
		id: id,
		nickname: name,
		fullname: "",
		faculty: "",
		uni: "",
	});
	await userInfo.save();

	var userScore = new Score({
		id: id,
		dimentions: [],
		eval: [],
	});
	await userScore.save();

	res.send(id);
});

app.post("/api/login", async (req, res) => {
	const { email, password } = req.body;

	var userAccount = await Account.findOne({
		email: email,
	});

	if (userAccount) {
		res.json(userAccount);
		//console.log(userAccount.password);
		//console.log(password);
		//if (userAccount.password == password) {
		//	res.json(userAccount);
		//} else {
		//	res.send("401: Unauthorized");
		//}
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
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerScore", async (req, res) => {
	const { id } = req.body;

	var score = await Score.findOne({
		id: id,
	});

	if (score) {
		res.json(score);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/UpdatePlayerAnswer", async (req, res) => {
	const { id, answer } = req.body;

	//console.log(req.body);
	var _answer = JSON.parse(answer);

	var playerScore = await Score.findOne({
		id: id,
	});

	if (!playerScore) {
		playerScore = new Score({
			id: id,
			dimentions: [],
			eval: [],
		});
	} 
	var dupe = false;
	for (let i = 0; i < playerScore.dimensionAnswers.length; i++) {
		dimensionAnswer = playerScore.dimensionAnswers[i];
		if (dimensionAnswer.id == _answer.id) {
			dupe = true;
			dimensionAnswer = _answer;
			break;
		}
	}

	if (!dupe) {
		playerScore.dimensionAnswers.push(_answer);
	}

	await playerScore.save();


	res.send("update success");

	//var score = await Score.findOne({
	//	email: email,
	//});
	//if (score) {
	//	res.json(score);
	//}else{
	//	res.send("400: Bad request");
	//}
});

app.post("/api/getQuestionID", async (req, res) => {
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

app.post("/api/fetchPlayerScore", async (req, res) => {
	const { id } = req.body;

	var questionCounts = [];

	for (let i = 0; i < 6; i++) {
		var count = await Question.count({
			dimension: i + 1,
		});
		questionCounts.push(count);
	}
	//console.log(questionCounts);

	var score = await Score.findOne({
		id: id,
	});
	//console.log(score);

	var response = [];
	for (let i = 0; i < 6; i++) {
		var d = {
			correct: 0,
			total: questionCounts[i],
		};
		response.push(d);
	}
	//console.log(response);

	if (score) {
		for (let i = 0; i < score.dimensionAnswers.length; i++) {
			var answer = score.dimensionAnswers[i];
			//console.log(answer);
			if (answer.isCorrected) {
				response[answer.dimension - 1].correct ++;
				//console.log("add score");
				//console.log(response[answer.dimension - 1]);
			}
		}
		//console.log(response);
		res.json(response);
	} else {
		res.send("400: Bad request");
	}
});

app.listen(keys.port, () => {
	console.log("v 1.5");
	console.log("Listening on port: " + keys.port);
});
