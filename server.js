const express = require('express');
require('dotenv').config(); // Load dotenv configuration
require('./dbConnect'); 
const user = require('./models/userModel')
const contact = require('./models/contactFormModel')

const app = express();
const port = process.env.PORT || 4000;

// Middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hey hello welcome to authapp');
});

// signup form 
app.post('/createUser', async (req, res)=>{
  try{
    const { username, password, email} = req.body;
    const newUser = new user({
      username,
      password,
      email
    })
    const createdUser = await newUser.save()
    res.status(201).send(createdUser)
  }
  catch(error){
    console.log(error)
    res.status(400).send(error)
  }
})

// login form 
app.post('/login', async (req, res)=>{
  try{
    const {email, password} = req.body
    const userFound = await user.findOne({email:email, password:password})
    if(userFound){
      res.status(200).send( userFound)
      console.log(userFound)
    }
    else{
      res.status(404).send('User not found')
    }
  }
  catch(error){
    console.log(error)
    res.status(400).send(error)
  }
})

// submit contact form 
app.post('/contact', async (req, res) => {
  try{
    const {name, email, phoneNumber, message} = req.body
    const newContact = new contact({
      name,
      email,
      phoneNumber,
      message
    })
    const createdContact = await newContact.save()
    res.status(201).send(createdContact)
  }catch(err){
    console.log(err)
    res.status(400).send(err.message)
  }
  const{name , email, phoneNumber, message} = req.body
})

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
