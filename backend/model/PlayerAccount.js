const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountSchema = new Schema({
    id: String,
    email:String,
    password: String,
    groupid:String,
    createDate: Date
});

mongoose.model('PlayerAccounts',AccountSchema);

