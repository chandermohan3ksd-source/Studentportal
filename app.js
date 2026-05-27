require("dotenv").config();
const express=require("express");
const mongoose=require("mongoose");
const methodOverride=require("method-override")
const Student=require("./model/student");
const User=require("./model/user.js");
const multer=require("multer");
const path=require("path");
const bcrypt=require("bcrypt");
const session=require("express-session");
const app=express();
const flash=require("connect-flash");
const Port=process.env.PORT || 3000;
app.use(express.static(path.join(__dirname,"/public")));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use("/uploads",express.static("uploads"));
app.use(session({
    secret:"mysuperSecret",
    resave:false,
    saveUninitialized:true
}));
app.use(flash());
app.use((req,res,next)=>{
    res.locals.currUser=req.session.userId;
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
})
const storage=multer.memoryStorage();
const upload=multer({storage})

async function main(){
    await mongoose.connect(process.env.MONGO_URL)
};
main().then(()=>{
    console.log("Db Connection successful");
}).catch((er)=>{
    console.log(er);
});

app.get("/",async(req,res)=>{
    try{
        let search= req.query.search;
    let students;
    if(search){
        students=await Student.find({
            name: {$regex:search,$options:"i"},
        })
    }else{
        students=await Student.find();
    }
    
    res.render("students.ejs",{students});
    }catch(err){
        console.log(err);
        req.flash("error",err.message);
        res.redirect("/");
    }
    
});
app.get("/student/new",isLoggedIn,(req,res)=>{
    res.render("newStudent.ejs");
});
app.get("/student/:id",isLoggedIn,async(req,res)=>{
    let{id}=req.params;
    let student=await Student.findById(id);
    res.render("student.ejs",{student});
});
app.post("/newStudent",
    upload.single("image"),async(req,res)=>{
    let{name,age,course,email}=req.body;
    if(!email || !email || !course || !age){
        req.flash("error","All fields are required !");
        return res.redirect("/student/new")
    }
    let newStudent={
        name:name,
        age:age,
        course:course,
        image:{data:req.file.buffer.toString("base64"),
        contentType:req.file.mimetype,
        },
        email:email,
    };
    await Student.create(newStudent).then(()=>{
        console.log("added")
    }).catch((er)=>{
        console.log(er);
    })
    req.flash("success","Student Added Successfully")
    
    res.redirect("/")
});
app.delete("/student/:id",isLoggedIn,async(req,res)=>{
    try{
          let {id}=req.params;
    let delStudent=await Student.findByIdAndDelete(id);
    req.flash("success","Student Deleted Successfully");
    res.redirect("/");
    }catch(err){
        req.flash("error",err.message);
        res.redirect("/");
    }
  
});
app.get("/edit/:id",async(req,res)=>{
    try{
       let {id}=req.params;
    let student=await Student.findById(id);
    res.render("edit.ejs",{student}); 
    }catch(err){
        req.flash("error",err.message);
    }
    
});
app.put("/edit/:id",isLoggedIn,
    upload.single("image"),
    async(req,res)=>{
        try{
    let {id}=req.params;
    let student=await Student.findById(id);
    let{name,age,course,email}=req.body;
     if(!email || !email || !course || !age){
        req.flash("error","All fields are required !");
        return res.redirect(`/edit/${student._id}`);
    };
    let updatedStud={
     name:name,
     age:age,
     course:course,
     email:email
    };
    if(req.file){
        updatedStud.image={
            data:req.file.buffer.toString("base64"),
            contentType:req.file.mimetype
        };
    }
    await Student.findByIdAndUpdate(id,updatedStud,{new:true});
    req.flash("success","Student Updated Successfully");
    res.redirect(`/student/${id}`);   
        }catch(err){
            req.flash("error",err.message);
        }
  
});
app.get("/register",(req,res)=>{
    res.render("register.ejs");
});
app.post("/register",async(req,res)=>{
    try{
        let {username,email,password}=req.body;
    let hashedPassword=await bcrypt.hash(password,10);
    let newuser=new User({
        username:username,
        email:email,
        password:hashedPassword
    })
    newuser.save();
    req.flash("success","Registeration Successful");
    res.redirect("/login");  
    }catch(err){
        req.flash("error",err.message);
        res.redirect("/register");
    }
  
});
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
app.post("/login",async(req,res)=>{
    try{
        let {email,password}=req.body;
let user=await User.findOne({email});
if(!user){
    req.flash("error","User Not Found");
    return res.redirect("/login");
}
let validUser=await bcrypt.compare(password,user.password);
if(validUser){
    req.session.userId=user._id;
    req.flash("success","Login Successfull")
    res.redirect("/");
}else{
    req.flash("error","Wrong Password");
    res.redirect("/login");
} 
}catch(er){
    req.flash("error",er.message);
    res.redirect("/login")
}
   
});
app.get("/logout",(req,res)=>{

    req.session.userId = null;

    req.flash("success","Logged Out Successfully");

    res.redirect("/");

});
function isLoggedIn(req,res,next){
    if(!req.session.userId){
        req.flash("error","Please Login First")
        return res.redirect("/login");s
    }
    next();
}
app.listen(Port,()=>{
    console.log("server is listing ");
});