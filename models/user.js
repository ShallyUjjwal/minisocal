
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/myminiproject')    


const userSchema = new mongoose.Schema({ 
    username: { type: String },
    name: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: true },
    age: { type: Number},
    profilepic:{ type: String,
      default: "image.png"
    },
    posts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
  });









const User = mongoose.model('User', userSchema);    
module.exports = User;  