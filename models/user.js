const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt=require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});



const User = mongoose.model('User', userSchema);

module.exports = User;