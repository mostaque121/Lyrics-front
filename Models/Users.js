const mongoose = require('mongoose');

// Define the schema for a user
const UsersSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true // Ensures no two users can have the same email
  },
  password: {
    type: String,
    required: true
  },
  userType:{
    type: String,
    required: true,
    default: "user"
  },
  avatar:{
    type:String,
  },
  imageName:{
    type:String,
  },
  lastActive: {
    type: Date,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
},
{
  timestamps: true,
});

// Create a model using the schema
const User = mongoose.model('User', UsersSchema);

module.exports = User;
