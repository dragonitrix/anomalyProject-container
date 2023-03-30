const mongoose = require('mongoose');
const { Schema } = mongoose;

const InfoSchema = new Schema({
    id: String,
    nickname: String,
    fullname: String,
    faculty: String,
    uni: String,
});

mongoose.model('PlayerInfos',InfoSchema);

