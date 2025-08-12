// Import Nodemailer for sending emails
const nodemailer = require("nodemailer");

// sendEmail is an asynchronous function that sends an email using the given options
const sendEmail = async (options) => {
  // 1) Create a transporter (email sending service configuration)
  // This defines the SMTP settings for the email server
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // SMTP server host (from environment variables)
    port: process.env.EMAIL_PORT, // SMTP server port
    secure: false, // false means STARTTLS (secure connection after handshake)
    auth: {
      user: process.env.EMAIL_USERNAME, // SMTP username
      pass: process.env.EMAIL_PASSWORD, // SMTP password
    },
  });

  // 2) Define the email details
  const mailOptions = {
    from: "Loukya Sri <lasya@gmail.com>", // Sender's name and email
    to: options.email, // Recipient email address (passed in options)
    subject: options.subject, // Email subject
    text: options.message, // Plain text email body
  };

  // 3) Send the email
  try {
    const info = await transporter.sendMail(mailOptions); // Send email asynchronously
    // You could log info.messageId or preview URL here if needed
  } catch (err) {
    console.error("Email send error:", err); // Log error if sending fails
    throw err; // Re-throw error to be handled by the caller
  }
};

// Export sendEmail so it can be used in other files
module.exports = sendEmail;
