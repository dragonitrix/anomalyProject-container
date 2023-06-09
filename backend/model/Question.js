const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionSchema = new Schema({
    id: String,
    type: Number,
    dimension: Number,
    question:String,
    choices:[String],
    answer: Number,
    weight: Number,
    hint:String
});

mongoose.model('Questions',QuestionSchema);

