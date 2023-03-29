const mongoose = require('mongoose');
const { Schema } = mongoose;

const InfoSchema = new Schema({
    email: String,
    name: String,
    uni: String,
});

mongoose.model('PlayerInfos',InfoSchema);

