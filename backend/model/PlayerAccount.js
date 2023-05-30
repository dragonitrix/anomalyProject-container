const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountSchema = new Schema({
    id: String,
    email:String,
    password: String,
    groupid:String,
    admin: Boolean,
    createDate: Date
});

mongoose.model('PlayerAccounts',AccountSchema);
mongoose.model('AdminAccounts',AccountSchema);

