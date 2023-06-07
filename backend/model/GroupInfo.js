const mongoose = require('mongoose');
const { Schema } = mongoose;

const GroupInfoSchema = new Schema({
    groupID:String,
    adminUser:String,
    link:String,
    classStartTime:Date,
    studentCount:Number
});

mongoose.model('GroupInfos',GroupInfoSchema);

