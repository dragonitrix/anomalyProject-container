const mongoose = require('mongoose');
const { Schema } = mongoose;

const GroupIDSchema = new Schema({
    id: String
});

mongoose.model('GroupIDs',GroupIDSchema);

