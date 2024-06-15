const mongoose = require('mongoose');
require('dotenv').config(); // Load dotenv configuration

const dbConnection = mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.DB_NAME
}).then(() => {
  console.log('Node.js is connected to MongoDB successfully');
}).catch((error) => {
  console.log('Error connecting: ' + error.message);
});

module.exports = dbConnection;
