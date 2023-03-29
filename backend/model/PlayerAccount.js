const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountSchema = new Schema({
    email: String,
    password: String,
    createDate: Date
});

mongoose.model('PlayerAccounts',AccountSchema);

