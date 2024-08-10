require('dotenv').config();


const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const path = require('path');
const session = require('express-session');
const nocache = require('nocache');
const uuid = require('uuid');
const adminRouter = require('./Routes/adminRouter');
const userRouter = require('./Routes/userRouter');
const { connection } = require('./connection/mongoconnect')
const fileupload = require('express-fileupload');
const passport = require('./passport');
const mongoose = require('mongoose');



const uri = "mongodb+srv://robinsyriak07:rKOg1c9ME4RfL9EO@pinkmartini.qv1ki.mongodb.net/MARTINI?retryWrites=true&w=majority";
// Connect to MongoDB using Mongoose
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000 // Increase the timeout to 30 seconds
})
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('Error connecting to MongoDB:', err));





app.use(nocache())

app.use(passport.initialize());

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileupload());
app.use(passport.session());



app.set('view engine', 'ejs')

 
app.use("/assets", express.static(path.join(__dirname, "assets")));


app.use('/admin', adminRouter);
app.use('/', userRouter);





connection()
  .then(() => {
    console.log('Connection successful!');
  })
  .catch((err) => {
    console.error('Connection error:', err);
  });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
