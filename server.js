const express = require('express');
require('dotenv').config(); // Load dotenv configuration
const cors = require('cors');
require('./dbConnect'); 
const User = require('./models/userModel');
const Contact = require('./models/contactFormModel');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hey hello, welcome to authapp');
});

// Signup form 
app.post('/createUser', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const newUser = new User({ username, password, email });
    const createdUser = await newUser.save();
    res.status(201).json(createdUser);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Error creating user', error });
  }
});

// Login form 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userFound = await User.findOne({ email, password });
    if (userFound) {
      res.status(200).json({ message: 'User found successfully', user: userFound });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Error logging in', error });
  }
});

// Submit contact form 
app.post('/contact', async (req, res) => {
  try {
    const { name, email, phoneNumber, message } = req.body;
    const newContact = new Contact({ name, email, phoneNumber, message });
    const createdContact = await newContact.save();
    res.status(201).json(createdContact);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Error submitting contact form', error });
  }
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
