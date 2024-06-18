const express = require('express');
require('dotenv').config(); // Load dotenv configuration
const cors = require('cors');
require('./dbConnect'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    const salt = await bcrypt.genSalt(10)  //generate unique salt to integrate with plaintext password
    const hashedPassword = await bcrypt.hash(password, salt) //generate hashed password using palintext password and unique salt
    console.log(hashedPassword);
    const newUser = new User({ username, password:hashedPassword, email });
    const createdUser = await newUser.save();
    console.log(createdUser);

    // Access the user ID from the createdUser object
    const userId = createdUser._id;

    // generating jwt token 
     const payLoad = { userId, email}
     const token = jwt.sign(payLoad, process.env.SECRET_KEY, { expiresIn:'1h'})
     console.log(token);
     res.status(201).json({ message: " user created successfully", token, createdUser}) 
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Error creating user', error });
  }
});

// Login form 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userFound = await User.findOne({ email });
    if (userFound) {
      const hashPassword = userFound.password;
      const isPasswordMatch = await bcrypt.compare(password, hashPassword);
      if (isPasswordMatch) {
        const userId = userFound._id;
        const payLoad = { userId, email };
        const token = jwt.sign(payLoad, process.env.SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'User found successfully', token, user: userFound });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
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

// Middleware for verifying JWT token
const verifyingToken = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token is not valid' });
  }
};

// Protected route
app.get('/getInfo', verifyingToken, (req, res) => {
  res.status(200).json({ message: 'You are authorized to access this route', user: req.user });
});



app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
