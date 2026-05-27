const mongoose=require("mongoose");
const schema=mongoose.Schema;
const model=mongoose.model;
const studentSchema=schema({
    name:{
        type:String,
        required:true
    },
    course:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    image:{
        data:String,
        contentType:String
    },
    age:{
        type:Number,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});
const Student=model("Student",studentSchema);
module.exports=Student;