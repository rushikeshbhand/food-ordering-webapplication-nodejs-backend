const express = require('express');
require('dotenv').config();
const cors = require('cors');
require('./dbConnect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');
const Contact = require('./models/contactFormModel');
const Product = require('./models/productModel');
const Cart = require('./models/cartModel');
const Razorpay = require('razorpay');

const app = express();
const port = process.env.PORT || 4000;

// It allows requests of all origins 
app.use(cors({
  origin: '*', // Allow all origins
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization,auth-token'
}));

// Is parse form data 
app.use(express.urlencoded({ extended: true }));

// It parse json data into js object 
app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('Hey hello, welcome to authapp');
});


// create razor pay order 
const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

app.post('/createOrder', verifyingToken, (req, res) => {
  try {
    const { amount, currency } = req.body;
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: currency,
      receipt: `order_rcptid_${Math.random() * 1000}`
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        return res.status(500).json({ message: 'Error creating order', err });
      }
      res.json({ id: order.id, amount: order.amount, currency: order.currency });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating order' });
  }
});





// Place order from cart
app.post('/placeOrder', verifyingToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('products');
    if (!cart) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalPrice = cart.products.reduce((acc, product) => acc + product.price, 0);

    const options = {
      amount: totalPrice * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: `order_rcptid_${Math.random() * 1000}`
    };

    instance.orders.create(options, function (err, order) {
      if (err) {
        return res.status(500).json({ message: 'Error creating order', err });
      }

      // Clear cart after placing order
      cart.products = [];
      cart.save();

      res.json({ id: order.id, amount: order.amount, currency: order.currency });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error placing order' });
  }
});

// Remove product from cart
app.post('/removeFromCart', verifyingToken, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.userId;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(400).json({ message: 'Cart not found' });
    }

    cart.products = cart.products.filter(product => product.toString() !== productId);
    await cart.save();

    res.json({ message: 'Product removed from cart', cart });
  } catch (err) {
    res.status(500).json({ message: 'Error removing product from cart', err });
  }
});





// Signup form 
app.post('/createUser', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const salt = await bcrypt.genSalt(10)  //generate unique salt to integrate with plaintext password
    const hashedPassword = await bcrypt.hash(password, salt) //generate hashed password using palintext password and unique salt
    console.log(hashedPassword);
    const newUser = new User({ username, password: hashedPassword, email });
    const createdUser = await newUser.save();
    console.log(createdUser);

    // Access the user ID from the createdUser object
    const userId = createdUser._id;

    // generating jwt token 
    const payLoad = { userId, email }
    const token = jwt.sign(payLoad, process.env.SECRET_KEY)
    console.log(token);
    res.status(201).json({ message: " user created successfully", token, createdUser })
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
        const token = jwt.sign(payLoad, process.env.SECRET_KEY);
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

// Protected route
app.get('/getInfo', verifyingToken, (req, res) => {
  res.status(200).json({ message: 'You are authorized to access this route', user: req.user });
});

// product form 
app.post('/createProduct', async (req, res) => {
  try {
    const { name, price, imageUrl } = req.body;
    const newProduct = new Product({ name, price, imageUrl })
    const createdProduct = await newProduct.save();
    res.status(201).json({ message: "Product created successfully", product: createdProduct })
  }
  catch (error) {
    console.log(error)
    res.status(400).json({ message: "Error creating product", error })
  }
})

// Product retrieval route
app.get('/products', async (req, res) => {
  try {
    const allProducts = await Product.find(); // Use await to get the products

    res.status(200).json({ message: "All products found successfully", products: allProducts });
    console.log(allProducts);
  } catch (err) {
    res.status(404).json({ message: "Error finding products: " + err });
  }
});

// Add Product to Cart
app.post('/addToCart', verifyingToken, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.userId;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, products: [] });
    }
    cart.products.push(productId);
    await cart.save();
    res.json({ message: 'Product added to cart', cart });
  } catch (err) {
    res.status(500).json({ message: 'Error adding product to cart', err });
  }
});

// Get Cart
app.get('/cart', verifyingToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('products');
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', err });
  }
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
