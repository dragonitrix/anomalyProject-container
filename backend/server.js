const express = require("express");
const cors = require("cors");
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

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/register", async (req, res) => {
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

	var userAccount = new Account({
		email: email,
		password: password,
		createDate: Date.now(),
	});

	await userAccount.save();

	//create default setting
	var userInfo = new Info({
		email: email,
		name: name,
		uni: "",
	});
	await userInfo.save();

	var userScore = new Score({
		email: email,
		score: {
			dimentions: null,
			eval: null,
		},
	});
	await userScore.save();

	res.json(userAccount);
});

app.post("/api/login", async (req, res) => {
	const { email } = req.body;

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

app.post("/api/getPlayerData", async (req, res) => {
	const { email } = req.body;

	var info = await Info.findOne({
		email: email,
	});

	if (info) {
		res.json(info);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/getPlayerScore", async (req, res) => {
	const { email } = req.body;

	var score = await Score.findOne({
		email: email,
	});

	if (score) {
		res.json(score);
	} else {
		res.send("400: Bad request");
	}
});

app.post("/api/updatePlayerScore", async (req, res) => {
	const { email } = req.body;

	//var score = await Score.findOne({
	//	email: email,
	//});
	//if (score) {
	//	res.json(score);
	//}else{
	//	res.send("400: Bad request");
	//}
});

app.listen(keys.port, () => {
	console.log("v 1.5");
	console.log("Listening on port: " + keys.port);
});
