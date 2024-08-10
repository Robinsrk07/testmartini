const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other email service you prefer
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
console.log(transporter); 

// Function to generate and send OTP email
function sendOTPEmail(recipientEmail, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER, // replace with your email
    to: recipientEmail,
    subject: 'OTP for Registration',
    text: `Your OTP for registration is: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending OTP email:', error);
    } else {
      console.log('OTP email sent:', info.response);
    }
  });
}

module.exports = sendOTPEmail;