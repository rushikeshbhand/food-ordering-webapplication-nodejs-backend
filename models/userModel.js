const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, minlength:4, required: true},
    email: {type: String, required: true, unique: true},
    createdAt: { type: Date, default: Date.now}
})

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;