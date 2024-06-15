const mongoose = require('mongoose')

const ContactSchema = new mongoose.Schema({
    name: {
        type: String, required: true
    },
    email: {
        type: String, required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 10,
        validate: {
          validator: function (v) {
            return /^\d{10}$/.test(v); // Regular expression to ensure the phone number contains only digits
          },
          message: props => `${props.value} is not a valid 10-digit phone number!`
        }
      },
    message: {
        type: String, required: true
    }
})

const Contact = mongoose.model('contact', ContactSchema)
module.exports = Contact