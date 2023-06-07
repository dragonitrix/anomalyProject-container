const express = require("express");
const keys = require("./config/keys.js");
const app = express();
const mongoose = require("mongoose");

const short = require("short-uuid");
const bodyParser = require("body-parser");
const https = require("https");
const axios = require("axios");
const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId();

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

app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cors());

app.post("/updateQuestion", async (req, res) => {
	//console.log(req.body);
	const question = JSON.parse(req.body.question);

	var q = await Question.findOne({
		id: question.id,
	});

	if (q) {
		q = new Question(question);
		await q.save();
		console.log("update q id: " + q.id);
		res.send("update q id: " + q.id);
	} else {
		question.id = short.generate();
		q = new Question(question);
		await q.save();

		console.log("added q id: " + q.id);
		res.send("added q id: " + q.id);
	}

	//var score = await Score.findOne({
	//	email: email,
	//});
	//if (score) {
	//	res.json(score);
	//}else{
	//	res.send("400: Bad request");
	//}
});

app.post("/updateEvalQuestion", async (req, res) => {
	//console.log(req.body);
	const question = JSON.parse(req.body.question);

	var q = await EvalQuestion.findOne({
		id: question.id,
	});

	if (q) {
		q = new EvalQuestion(question);
		await q.save();
		console.log("update q id: " + q.id);
		res.send("update q id: " + q.id);
	} else {
		question.id = short.generate();
		q = new EvalQuestion(question);
		await q.save();

		console.log("added q id: " + q.id);
		res.send("added q id: " + q.id);
	}

	//var score = await Score.findOne({
	//	email: email,
	//});
	//if (score) {
	//	res.json(score);
	//}else{
	//	res.send("400: Bad request");
	//}
});

app.listen(keys.port, async () => {
	console.log("Listening on port: " + keys.port);

});

var longestchoice = "";
var longestNoSpace = "";
async function fetchQuestion() {
	var questions = await Question.find();

	for (let i = 0; i < questions.length; i++) {
		const question = questions[i];
		await refineQuestionText(question);
	}

	console.log("finished");

	//console.log("questions count: " + questions.length);
	//console.log("choice count: " + questions.length * 4);
	//console.log("longest: " + longestchoice);
	//console.log("longest: " + longestNoSpace);
	//console.log("longest char count: " + longestNoSpace.length);

	//var temp = longestchoice.split(" ");
	//console.log(temp);
	//for (let i = 0; i < temp.length; i++) {
	//	const t = temp[i];
	//	console.log(t.length);
	//}

	//axios
	//	.request({
	//		baseURL: "https://api.aiforthai.in.th",
	//		url: "/tlexplus",
	//		method: "post",
	//		headers: {
	//			Apikey: "YXgp9HOFfzS25cl6oIpkU9UDfbnYwpzX",
	//			"Content-Type": "application/x-www-form-urlencoded",
	//		},
	//		data: {
	//			text: longestNoSpace,
	//		},
	//	})
	//	.then(function (response) {
	//		var data = response.data;
	//		console.log(data);
	//		console.log("word count: " + data.tokens.length);
	//	});
}

async function refineQuestionText(question) {
	//var choices = question.choices;
	//var new_choices = [];
	//for (let j = 0; j < choices.length; j++) {
	//	const choice = choices[j];
	//	var result = await processText(choice,40);
	//	//console.log(result);
	//	new_choices.push(result);
	//}
	//question.choices = new_choices;

	//console.log(question);
	//
	//await question.save();

	//if (question.question.includes(".")) {
	//	const regex1 = /\.+/;
	//	question.question = question.question.replace(regex1, " $fill ");
	//	const regex2 = /(  )/;
	//	question.question = question.question.replace(regex2, " ");
	//	//console.log(question.question);
	//	console.log(question);
	//	await question.save();
	//}

	if (question.question.length > 50) {
		//console.log(question.question);
		var result = await processText(question.question, 50);
		//console.log(result);
		//console.log("---");
		question.question = result;
		await question.save();
	}
}

async function processText(text, cutlenght) {
	if (!cutlenght) cutlenght = 60;
	var longtext = false;

	var result = text;

	if ((result[0] = " ")) result[0] = "";

	// replace spacial char
	result = result.replace("\t", "");

	//check longest
	if (result.length > longestchoice.length) {
		longestchoice = result;
	}

	var splitText = result.split(" ");

	var rejoinText = "";

	for (let i = 0; i < splitText.length; i++) {
		var text = splitText[i];
		//if (text.length > longestNoSpace.length) {
		//	longestNoSpace = text;
		//}

		if (text.length >= cutlenght) {
			longtext = true;
			text = await processLongText(text);
		}

		if (text != "") {
			rejoinText += text + " ";
		}
	}
	result = rejoinText;
	return result;
}

async function processLongText(longtext) {
	console.log("***processLongText");

	var newText = longtext;

	const url = "https://api.aiforthai.in.th/tlexplus";
	const data = {
		text: longtext,
	};
	const config = {
		headers: {
			Apikey: "YXgp9HOFfzS25cl6oIpkU9UDfbnYwpzX",
			"Content-Type": "application/x-www-form-urlencoded",
		},
	};
	const response = await axios.post(url, data, config);

	var resdata = response.data;
	var tokens = resdata.tokens;
	var cutAt = 9;
	//console.log("word count: " + tokens.length + " cut at: " + cutAt);
	if (tokens.length > cutAt) {
		console.log("old: " + newText);
		var _newText = "";
		for (let i = 0; i < tokens.length; i++) {
			_newText += tokens[i];
			if (i == cutAt) {
				_newText += " ";
			}
		}
		newText = _newText;
		console.log("new: " + newText);
	}
	return newText;

	//var response = await axios
	//	.request({
	//		baseURL: "https://api.aiforthai.in.th",
	//		url: "/tlexplus",
	//		method: "post",
	//		headers: {
	//			Apikey: "YXgp9HOFfzS25cl6oIpkU9UDfbnYwpzX",
	//			"Content-Type": "application/x-www-form-urlencoded",
	//		},
	//
	//		data: {
	//			text: longtext,
	//		},
	//	})
	//.then(function (response) {
	//	var data = response.data;
	//	console.log(data);
	//	var tokens = data.tokens;
	//	var cutAt = 9;
	//	console.log("word count: " + tokens.length + " cut at: " + cutAt);
	//	if (tokens.length > cutAt) {
	//		var _newText = "";
	//		for (let i = 0; i < tokens.length; i++) {
	//			_newText += tokens[i];
	//			if (i == cutAt) {
	//				_newText += " ";
	//			}
	//		}
	//		newText = _newText;
	//		console.log("new: " + _newText);
	//		//return _newText;
	//	} else {
	//		//return newText;
	//	}
	//});

	//return newText;
}

async function UpdateGroupInfo() {
	for (let i = 0; i < groupDatas.length; i++) {
		const groupData = groupDatas[i];

		var groupID = groupData.groupID;

		var playeraccounts = await Account.find({ groupid: groupID });

		var studentCount = 0;

		if (playeraccounts) {
			studentCount = playeraccounts.length;
		}

		var startDate = new Date("June 1, 2023 00:00:00");

		var groupInfo = new GroupInfo({
			groupID: groupData.groupID,
			adminUser: groupData.adminUser,
			link: groupData.link,
			classStartTime: startDate,
			studentCount: studentCount,
		});

		console.log(groupInfo);

		await groupInfo.save();

		//console.log(startDate.toString());
	}
}

async function InitPlayersScore() {
	var accounts = await Account.find();
	var adminaccounts = await AdminAccount.find();

	for (let i = 0; i < accounts.length; i++) {
		const account = accounts[i];
		var id = account.id;

		var playerScore = await PlayerScore.findOne({
			playerID: id,
		});

		if (!playerScore) {
			playerScore = await initDefaultPlayerScore(id);
		}

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
		await playerScore.save();
	}

	for (let i = 0; i < adminaccounts.length; i++) {
		const account = adminaccounts[i];
		var id = account.id;

		var playerScore = await PlayerScore.findOne({
			playerID: id,
		});

		if (!playerScore) {
			playerScore = await initDefaultPlayerScore(id);
		}

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
		await playerScore.save();
	}
}

var groupDatas = [
	{
		groupID: "",
		adminUser: "adminle4Qro@mail.com",
		link: "https://digilearn.camt.cmu.ac.th/",
	},
	{
		groupID: "bHEmBJ",
		adminUser: "adminxGz536@mail.comx",
		link: "https://digilearn.camt.cmu.ac.th?groupid=bHEmBJ",
	},
	{
		groupID: "WXLjFB",
		adminUser: "admin1RFueK@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=WXLjFB",
	},
	{
		groupID: "3pFueX",
		adminUser: "adminlo1BLg@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=3pFueX",
	},
	{
		groupID: "KS8rI7",
		adminUser: "adminzkYBgS@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=KS8rI7",
	},
	{
		groupID: "69WzrL",
		adminUser: "adminMZOPUg@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=69WzrL",
	},
	{
		groupID: "6Pyv6e",
		adminUser: "adminLtlEFz@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=6Pyv6e",
	},
	{
		groupID: "4lkCbI",
		adminUser: "adminSPX4Oo@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=4lkCbI",
	},
	{
		groupID: "GCOIJC",
		adminUser: "adminyXN4gk@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=GCOIJC",
	},
	{
		groupID: "z1Uw2D",
		adminUser: "adminMiefqP@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=z1Uw2D",
	},
	{
		groupID: "Vgzkhq",
		adminUser: "admin7jy8Dm@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=Vgzkhq",
	},
	{
		groupID: "y5XNwu",
		adminUser: "adminmbHVhz@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=y5XNwu",
	},
	{
		groupID: "rXJaUh",
		adminUser: "admin7qf5Li@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=rXJaUh",
	},
	{
		groupID: "Qn9GnD",
		adminUser: "adminRdBK3t@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=Qn9GnD",
	},
	{
		groupID: "rVs0XT",
		adminUser: "admink7lj4W@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=rVs0XT",
	},
	{
		groupID: "I3psWP",
		adminUser: "adminwEyuZy@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=I3psWP",
	},
	{
		groupID: "fOUXRN",
		adminUser: "admindkqAlS@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=fOUXRN",
	},
	{
		groupID: "ZDxs1g",
		adminUser: "admin5oRmKi@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=ZDxs1g",
	},
	{
		groupID: "DNxaZC",
		adminUser: "adminCOrKx7@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=DNxaZC",
	},
	{
		groupID: "l2Ays8",
		adminUser: "adminjWDPlK@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=l2Ays8",
	},
	{
		groupID: "nZB2LT",
		adminUser: "admin4r78BG@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=nZB2LT",
	},
	{
		groupID: "s7vjkM",
		adminUser: "adminT6MUVI@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=s7vjkM",
	},
	{
		groupID: "guuP5M",
		adminUser: "adminc0j6Oe@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=guuP5M",
	},
	{
		groupID: "tHlUoX",
		adminUser: "adminqcYSux@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=tHlUoX",
	},
	{
		groupID: "P5aDPo",
		adminUser: "adminbVYQHo@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=P5aDPo",
	},
	{
		groupID: "xfsTkv",
		adminUser: "admin2Npb3a@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=xfsTkv",
	},
	{
		groupID: "gtnZnF",
		adminUser: "adminm7oCWo@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=gtnZnF",
	},
	{
		groupID: "f5lAS9",
		adminUser: "admin7y6niM@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=f5lAS9",
	},
	{
		groupID: "9MKYXm",
		adminUser: "admincbNXPQ@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=9MKYXm",
	},
	{
		groupID: "ieriNa",
		adminUser: "adminBhe5Ir@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=ieriNa",
	},
	{
		groupID: "sPH5Sf",
		adminUser: "adminmIVU3P@mail.com",
		link: "https://digilearn.camt.cmu.ac.th?groupid=sPH5Sf",
	},
];

async function initDefaultPlayerScore(id) {
	//create default setting
	var playerScore = new PlayerScore({
		playerID: id,
		missionScores: [0, 0, 0, 0, 0, 0],
		testScores: [0, 0, 0, 0, 0, 0],
		testAnswers: [0, 0, 0, 0, 0, 0],
		preEvalScores: [0, 0, 0, 0, 0, 0],
		postEvalScores: [0, 0, 0, 0, 0, 0],
	});
	await playerScore.save();
	return playerScore;
}

async function deleteEvalAnswer() {
	await Answer.deleteMany({
		answerType: 2,
	});
	await Answer.deleteMany({
		answerType: 3,
	});
}

async function InitEvalQuestion() {
	for (let i = 0; i < newEvalQuestion.length; i++) {
		const evalQuestionData = newEvalQuestion[i];

		var uuid = short.generate();

		var evalQuestion = new EvalQuestion({
			id: uuid,
			type: 1,
			dimension: evalQuestionData.dimension,
			question: evalQuestionData.question,
			choices: evalQuestionData.choices,
			answer: evalQuestionData.answer,
		});
		await evalQuestion.save();
	}
}

var newEvalQuestion = [
	{
		dimension: 1,
		question: "ประเด็นปัญหาในการวิจัยมีความหมายตรงกับข้อใด",
		choices: [
			"1 ข้อความเกี่ยวกับคำถามการศึกษาที่นักวิจัยกำหนดขึ้น",
			"2 แนวคำตอบที่นักวิจัยกำหนดเพื่อศึกษา",
			"3 ข้อความเป้าหมายของงานวิจัย",
			"4 แนวคำอธิบายตัวแปรในการทำวิจัย",
		],
		answer: 1,
	},
	{
		dimension: 1,
		question: "ขอบเขตของประเด็นการวิจัยมีความสำคัญอย่างไร",
		choices: [
			"1 กำหนดขอบเขตเรื่องที่สนใจศึกษาในแง่เวลา และพื้นที่",
			"2 เป็นกรอบเกี่ยวกับประชากร กลุ่มตัวอย่าง วิธีการรวบรวมข้อมูล",
			"3 อธิบายให้เห็นตัวแปรที่ต้องศึกษาวิเคราะห์",
			"4 ถูกทุกข้อ",
		],
		answer: 4,
	},
	{
		dimension: 1,
		question:
			"ขั้นตอนระยะแรกเริ่มในการระบุประเด็นการศึกษาได้แก่การแสวงหาวิธีการแก้ปัญหา",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 2,
	},
	{
		dimension: 1,
		question:
			'"การจัดการเรียนการสอนที่เน้นระบบออนไลน์ในระดับอุดมศึกษา" ถือเป็น $fill',
		choices: [
			"1 วัตถุประสงค์การศึกษา",
			"2 คำถามการศึกษา",
			"3 ข้ออ้างในการศึกษา",
			"4 ประเด็นการศึกษาวิจัย",
		],
		answer: 4,
	},
	{
		dimension: 1,
		question:
			"ข้อใดอธิบายไม่ถูกต้องเกี่ยวกับกระบวนการค้นคว้าเพื่อมองหาประเด็นการทำวิจัยอันเป็นที่ยอมรับ",
		choices: [
			"1 เป็นการสำรวจ วิเคราะห์วรรณกรรมประเภทต่างๆที่เกี่ยวข้องกับเรื่องน่าสนใจ",
			"2 สามารถสังเคราะห์ประเด็นน่าสนใจจากข่าวสารประจำวัน หรือผลงานวิชาการ",
			"3 ได้จากการอนุมานด้วยประสบการณ์ และความคิดของผู้วิจัยเองเป็นสำคัญ",
			"4 ค้นคว้าได้จากบทความ ผลงานวิจัย และเอกสารบนเว็บไซต์",
		],
		answer: 3,
	},
	{
		dimension: 1,
		question:
			"ข้อสรุปของนักวิชาการผู้เชี่ยวชาญด้านต่างๆ เป็นคำอธิบายซึ่งไม่จำเป็นต้องสอดรับ หรือรับรองซึ่งกันและกัน",
		choices: ["1 ไม่ทราบ", "2 ไม่แน่ใจ", "3 ไม่เห็นด้วย", "4 เห็นด้วย"],
		answer: 4,
	},
	{
		dimension: 2,
		question: "ข้อใดไม่ใช่ลักษณะของการกำหนดคำถามวิจัยที่ดี",
		choices: [
			"1 เป็นคำถามที่มีความชัดเจนว่าผู้วิจัยต้องการอธิบายอะไร",
			"2 เป็นคำถามที่มีคำตอบชัดเจน ตามที่ผู้วิจัยมีข้อมูลก่อนแล้ว",
			"3 สามารถนำไปสู่วิธีการประเมินเพื่อหาผลลัพธ์ได้",
			"4 สามารถดำเนินการค้นคว้าได้ตามหลักจริยธรรม",
		],
		answer: 2,
	},
	{
		dimension: 2,
		question: 'ข้อใดกล่าวไม่ถูกต้องเกี่ยวกับ"นิยามเชิงปฏิบัติการณ์"',
		choices: [
			"1 นิยามเชิงปฏิบัติการสามารถบ่งชี้คุณลักษณะหรือขอบเขตของตัวแปรได้ชัดเจน",
			"2 นิยามเชิงปฏิบัติการในหัวข้อวิจัยเดียวกันอาจนำไปสู่การวิจัย และผลสรุปผลที่แตกต่างกัน",
			"3 การระบุตัวแปรที่มีลักษณะเป็นนามธรรม โดยไม่จำเป็นต้องให้ความหมายใหม่",
			"4 การให้ความหมายของตัวแปรตามแนวคิดทฤษฎีที่อยู่ในความหมายเฉพาะจากคำถามการวิจัย",
		],
		answer: 3,
	},
	{
		dimension: 2,
		question:
			"เราสามารถทบทวนวรรณกรรมด้วยการสำรวจแนวคิด ทฤษฎี รายงานวิจัย และเอกสารวิชาการจากศาสตร์ต่างๆ",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 1,
	},
	{
		dimension: 2,
		question:
			"หากขาดประสบการณ์เพื่อหาแหล่งข้อมูลเชิงลึกที่จำเป็นต้องใช้ ผู้วิจัยต้องทำเช่นไร",
		choices: [
			"1 ศึกษาจากผลงานวิจัยเก่า",
			"2 ใช้การเสิร์ชหาผ่าน Google",
			"3 ปรึกษาผู้เชี่ยวชาญในเรื่องนั้น",
			"4 ค้นคว้าจากฐานข้อมูลวิจัย",
		],
		answer: 3,
	},
	{
		dimension: 2,
		question:
			"ในกระบวนการเริ่มต้นวิจัย เมื่อกำหนดคำถามสำคัญแล้ว ผู้วิจัยไม่ควรปรับปรุง พัฒนาคำถามอีกต่อไป",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 2,
	},
	{
		dimension: 2,
		question:
			"นักวิจัยควรกำหนดคำถามสำคัญๆ ก่อนที่จะแสวงหาวิธีการเก็บรวบรวม และขั้นตอนการวิเคราะห์ข้อมูลเพื่อตอบคำถาม",
		choices: ["1 ไม่ทราบ", "2 ไม่แน่ใจ", "3 ไม่เห็นด้วย", "4 เห็นด้วย"],
		answer: 4,
	},
	{
		dimension: 3,
		question: "ข้อใดกล่าวถึงตัวแปรต้น และตัวแปรตามได้สมบูรณ์ที่สุด",
		choices: [
			"1 ความสัมพันธ์ระหว่างตัวแปรต้น และตัวแปรตามจำเป็นต้องมีตัวแปรกลางมาขั้นกลาง",
			"2 ความสัมพันธ์ระหว่างตัวแปรต้น และตัวแปรตามจำเป็นต้องทราบมิติด้านเวลา",
			"3 ตัวแปรต้น และตัวแปรตามเป็นสิ่งที่ผู้วิจัยกำหนดขึ้น",
			"4 ตัวแปรตามคือปรากฎการณ์หรือพฤติกรรมอันเป็นผลลัพท์ที่เกิดจากธรรมชาติ",
		],
		answer: 3,
	},
	{
		dimension: 3,
		question:
			"นักวิจัยสามารถควบคุมความถูกต้องของเนื้อหาการศึกษา (Content Validity) ด้วยการทบทวนวรรณกรรมอย่างละเอียด และปรึกษาผู้เชี่ยวชาญ",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 1,
	},
	{
		dimension: 3,
		question:
			"นักวิจัยสามารถกำหนดความเที่ยงตรงภายในงานวิจัย (Internal Validity) ด้วยการกำหนดคำถามที่ชัดเจน และแสวงหาวิธีที่เหมาะสมในการเก็บข้อมูล",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 1,
	},
	{
		dimension: 3,
		question:
			"กระบวนการศึกษาวิจัยในข้อใดเรียงลำดับขั้นตอนอย่างเป็นตรรกะมากที่สุด",
		choices: [
			"1 สรุปสภาพปัญหา-ระบุความจำเป็น-กำหนดคำถาม-แสวงหาวิธีการศึกษา",
			"2 สรุปสภาพปัญหา-แสวงหาวิธีการศึกษา-ระบุความจำเป็น-กำหนดคำถาม",
			"3 ระบุความจำเป็น-สรุปสภาพปัญหา-แสวงหาวิธีการศึกษา-กำหนดคำถาม",
			"4 ระบุความจำเป็น-แสวงหาวิธีการศึกษา-สรุปสภาพปัญหา-กำหนดคำถาม",
		],
		answer: 1,
	},
	{
		dimension: 3,
		question: "ข้อใดแสดงความหมายของแหล่งข้อมูลปฐมภูมิอย่างถูกต้อง",
		choices: [
			"1 เป็นแหล่งข้อมูลหลักในการวิจัยทุกประเภท",
			"2 คือแหล่งข้อมูลที่อาจรวบรวมผ่านการสัมภาษณ์",
			"3 เป็นการเก็บรวบรวมผ่านเว็บไซต์ที่มีการสำรวจ",
			"4 คือแหล่งข้อมูลที่มีการบันทึกไว้แล้ว",
		],
		answer: 2,
	},
	{
		dimension: 3,
		question:
			"ความเข้าใจเกี่ยวกับวิธีการแบบอุปนัย และ/หรือวิธีการแบบนิรนัยเป็นเรื่องไม่สำคัญในการหาข้อสรุป",
		choices: ["1 ไม่ทราบ", "2 ไม่แน่ใจ", "3 ไม่เห็นด้วย", "4 เห็นด้วย"],
		answer: 3,
	},
	{
		dimension: 4,
		question: 'ข้อใดอธิบายกระบวนการของ"การวิจัยเอกสาร" ได้ดีที่สุด',
		choices: [
			"1 วิเคราะห์ ตีความเอกสารวิจัยชิ้นหนึ่งที่มีเนื้อหาเกี่ยวข้องกับประเด็นการวิจัย",
			"2 เปรียบเทียบเนื้อหาเอกสารหลายฉบับเพื่อหาความคล้ายคลึง และความแตกต่าง",
			"3 รวบรวมผลงานวิจัยที่เกี่ยวข้องมาทำการวิเคราะห์ สังเคราะห์ข้อมูล และอภิปราย",
			"4 วิเคราะห์ ตีความเอกสารจำนวนมาก สรุปเนื้อหาสำคัญจนเกิดเป็นงานวิจัยชิ้นใหม่",
		],
		answer: 4,
	},
	{
		dimension: 4,
		question:
			"ความสามารถในการประยุกต์ใช้ความรู้เชิงสถิติอย่างเหมาะสมกับแนวทางการวิเคราะห์ไม่ใช่สิ่งจำเป็นสำหรับการวิจัยเชิงคุณภาพ",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 2,
	},
	{
		dimension: 4,
		question:
			"ข้อใดกล่าวไม่ถูกต้องเกี่ยวกับการวิจัยภาคสนาม หรือการลงพื้นที่เพื่อศึกษาข้อมูล",
		choices: [
			"1 เป็นการลงพื้นที่เพื่อเก็บรวบรวมข้อมูลเกี่ยวกับสถานการณ์ที่สนใจ       ",
			"2 เป็นหนึ่งในประเภทของการวิจัยที่ไม่ใช่การทดลอง",
			"3 เป็นการวิเคราะห์เก็บรวบรวมข้อมูลจากสื่อสิ่งพิมพ์ต่างๆ ที่มีการเผยแพร่",
			"4 เป็นการรวบรวมข้อมูลปฐมภูมิจากแหล่งต้นเหตุของประเด็น",
		],
		answer: 3,
	},
	{
		dimension: 4,
		question:
			"การวิจัยทางสังคมศาสตร์ส่วนมาก อาศัยการทดลองในห้องแลป มากกว่าการใช้วิธีการกึ่งทดลอง",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 2,
	},
	{
		dimension: 4,
		question:
			"เพราะเหตุใด นักวิจัยจึงควรแสวงหาวิธีการที่เหมาะสมเพื่อให้ได้มาซึ่งข้อมูลที่น่าเชื่อถือ มากกว่าจะใช้วิธีการเดิมๆ",
		choices: [
			"1 เป็นการเก็บรวบรวมข้อมูลที่สอดคล้องกับคำถามการศึกษา       ",
			"2 เป็นรูปแบบอันเป็นที่ยอมรับของวิธีการวิจัยเชิงปริมาณ      ",
			"3 เป็นการใช้เครื่องมือเก็บข้อมูลที่แพร่หลาย เช่น แบบสอบถาม",
			"4 เป็นการให้ความสำคัญต่อความน่าเชื่อถือของข้อมูล",
		],
		answer: 4,
	},
	{
		dimension: 4,
		question:
			"วิธีการวิจัยเชิงคุณภาพ (Qualitative Research) จะไม่ใช้สถิติ ตัวเลขในการวิเคราะห์ข้อมูลทุกกรณี",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 2,
	},
	{
		dimension: 5,
		question:
			'ข้อใดเป็นตัวอย่างของ"ความลำเอียงอย่างจงใจ" อันเกี่ยวข้องกับการศึกษาวิจัย',
		choices: [
			"1 บทความของนักศึกษาปริญญาตรีไม่ได้รับการตีพิมพ์ในวารสาร",
			"2 ผู้ให้ข้อมูลวิจัยปฏิเสธการตอบคำถามบางข้อในการสัมภาษณ์",
			"3 กรรมการสอบหัวข้อวิจัยไม่ให้ผ่านเพราะไม่ได้ยื่นโครงร่างวิจัยตามระเบียบ",
			"4 อาจารย์ที่ปรึกษาแนะนำให้ทบทวนผลงานเฉพาะนักวิชาการอเมริกัน",
		],
		answer: 4,
	},
	{
		dimension: 5,
		question:
			"ข้อใดไม่ใช่วิธีการทั่วไปที่ใช้ในการวิจัยทางรัฐประศาสนศาสตร์ หรือทางสังคมศาสตร์",
		choices: [
			"1 การสำรวจ (Surveys)",
			"2 การสังเกตการณ์ (Observations)",
			"3 การทดลอง (Experiments)",
			"4 การสัมภาษณ์ (Interviews)",
		],
		answer: 3,
	},
	{
		dimension: 5,
		question:
			"นักวิจัยมือใหม่ ควรทำอย่างไรเมื่อต้องเผชิญกับคำอธิบายเชิงทฤษฏี และแนวคิดนักวิชาการที่ขัดแย้งกันจำนวนหนึ่ง",
		choices: [
			"1 วิเคราะห์ข้อโต้แย้งทั้งหมดเพื่อหาข้อสรุปจากหลักฐานที่น่าเชื่อถือที่สุด",
			"2 หลีกเลี่ยงผลงานวิจัยที่มีคำอธิบายขัดแย้งกับความคิดของผู้วิจัย",
			"3 ปรับเปลี่ยนแนวคิดการวิจัยให้สอดคล้องกับคำอธิบายที่ใหม่กว่า",
			"4 พยายามเลือกคำอธิบายที่ให้ความกระจ่างมากที่สุด",
		],
		answer: 1,
	},
	{
		dimension: 5,
		question:
			"การค้นหาข้อมูลเบื้องต้นจากบทความวิชาการ และผู้แต่งบทความซึ่งเกี่ยวข้องกับหัวข้อการศึกษา ช่วยแสดงความน่าเชื่อถือของแหล่งอ้างอิงข้อมูล",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 1,
	},
	{
		dimension: 5,
		question:
			"ข้อใดอธิบาย ความสัมพันธ์ (Correlation) และความเป็นเหตุ-เป็นผล (Causation) ได้ถูกต้องที่สุด",
		choices: [
			"1 Correlation อธิบายเชิงเหตุผลที่มีเงื่อนไขของสิ่งที่เกิดก่อน-เกิดหลัง",
			"2 Causation อธิบายเชิงเหตุผลที่เป็นเงื่อนไขสอดคล้องสัมพันธ์กัน",
			"3 Correlation อธิบายต้นเหตุ อันทำให้เกิดผลลัพท์ตามมาจากเหตุ",
			"4 Causation อธิบายต้นเหตุ และผลลัพท์ซึ่งบ่งชี้ทิศทางของต้นเหตุ และผลลัพท์",
		],
		answer: 4,
	},
	{
		dimension: 5,
		question:
			"การสังเกตุ (Observations) ไม่ใช่วิธีการที่น่าเชื่อถือสำหรับการวิจัยทางสังคมศาสตร์ เพราะผู้วิจัยอาจมองต่างกัน",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 2,
	},
	{
		dimension: 6,
		question:
			"ผู้วิจัยที่ขาดความระมัดระวังถึงผลกระทบที่อาจเกิดขึ้นกับผู้ให้สัมภาษณ์ หรือผู้ให้ข้อมูล ถือว่าขาดสิ่งใด",
		choices: [
			"1 Plagiarism",
			"2 Transparency     ",
			"3 Integrity",
			"4 Validity",
		],
		answer: 3,
	},
	{
		dimension: 6,
		question:
			"หากผู้เขียนงานวิจัยได้นำข้อความจากรายงานการวิจัยของผู้อื่นมาใช้โดยอ้างอิงไม่ถูกต้อง ผู้เขียนงานวิจัยอาจได้รับผลกระทบเช่นใด",
		choices: [
			"1 ความน่าเชื่อถือ และความเคารพจากเพื่อนในวงวิชาการลดลง",
			"2 ผู้เขียนอาจถูกดำเนินการทางกฎหมาย",
			"3 วารสารวิชาการ หรือการประชุม ไม่ตีพิมพ์เผยแพร่ผลงานนั้น",
			"4 ทั้งหมดข้างต้น",
		],
		answer: 4,
	},
	{
		dimension: 6,
		question:
			"การนำเสนอความคิดของผู้อื่น หรือทำให้เป็นของตนเองโดยไม่ระบุแหล่งที่มา ไม่ถือว่าเป็นการจารกรรมข้อมูลทางวิชาการ (Plagiarism)",
		choices: ["1 ไม่ทราบ", "2 ไม่แน่ใจ", "3 ไม่เห็นด้วย", "4 เห็นด้วย"],
		answer: 3,
	},
	{
		dimension: 6,
		question: "ข้อใดอธิบายความหมายของ ความลำเอียงในการวิจัย ได้ดีที่สุด",
		choices: [
			"1 ความตระหนักในการเลือกผู้ให้ข้อมูลที่น่าเชื่อถือที่สุด",
			"2 ความใส่ใจในการให้เหตุผลจากข้อถกเถียงของทุกฝ่าย",
			"3 ความโน้มเอียงเข้าข้างเหตุผลด้านหนึ่งเหนือกว่าอีกด้านหนึ่ง",
			"4 ความพยายามเข้าใจมุมมองการอธิบายอย่างลึกซึ้ง",
		],
		answer: 3,
	},
	{
		dimension: 6,
		question: "ข้อใดกล่าวไม่ถูกต้องเกี่ยวกับจรรยาบรรณของนักวิจัย",
		choices: [
			"1 ตระหนักถึงความจำเป็นทางวิชาการ และประเด็นปัญหา",
			"2 ได้รับความยินยอมจากผู้ให้ข้อมูลก่อนทำการวิจัย",
			"3 แสดงความคิดอย่างเป็นอิสระ ไม่ลำเอียงเข้าข้างผู้ให้ทุน",
			"4 เผยแพร่ผลงานวิจัยเพื่อเป็นที่ประจักษ์ในวงวิชาการ",
		],
		answer: 4,
	},
	{
		dimension: 6,
		question:
			"ผู้วิจัยที่มีแนวโน้มรับรองต่อผลการวิเคราะห์ของตนเองว่าถูกต้อง ถือเป็นความลำเอียงรูปแบบหนึ่ง",
		choices: ["1 ใช่", "2 ไม่ใช่", "3 ไม่แน่ใจ", "4 ไม่ทราบ"],
		answer: 1,
	},
];
