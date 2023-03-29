const mongoose = require("mongoose");
const { Schema } = mongoose;


const AnswerSchema = new Schema({
	id: String,
	answer: Number,
	isCorrected: Boolean,
});

const DimensionSchema = new Schema({
	dimensionAnswers:[AnswerSchema]
});

const ScoreSchema = new Schema({
	email: String,
	scores: {
        dimensions:[DimensionSchema],
        evalAnswers:[AnswerSchema]
    }
});

//scores: {
//	dimentions: [
//		{
//			dimension: [
//                {
//                    id:String,
//                    answer:Number,
//                    isCorrected:Boolean
//                },
//                ...
//            ]
//		},
//      ...
//	];
//    eval:[
//        {
//            id:String,
//            answer:Number,
//            isCorrected:Boolean
//        },
//        ...
//    ]
//}

mongoose.model("PlayerScore", ScoreSchema);
