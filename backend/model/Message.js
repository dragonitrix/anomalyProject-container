const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
    id: String,
    sessionID:String,
    sessionType:Number, // 0: student-prof, 1:admin
    playerID: String,
    groupID: String,
    timeStamp:Date,
    text:String
});

mongoose.model('Messages',MessageSchema);

