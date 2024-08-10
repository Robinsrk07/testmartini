// const mongoose = require("mongoose")

// const userSchema = new mongoose.Schema({
//     name :{
//         type :String,
//         required :true
//     },
//     email :{
//         type :String,
//         required : true
//     },
//     mobile:{
//         type :Number,
//         required :true
//     },
//     password:{
//         type: String,
//         required : true
//     },
//     is_list :{
//         type: Boolean,
//         default : true
//     },
//     wallet_bal :{
//         type :Number,
        
//     }
// })
// module.exports = mongoose.model("user",userSchema)
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: Number,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        required: false
    },
    is_list: {
        type: Boolean,
        default: true
    },
    wallet_bal: {
        type: Number,
        default: 0
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    }
});
module.exports = mongoose.model("User", userSchema);
