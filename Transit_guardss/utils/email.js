const nodemailer = require('nodemailer');

// Replace these with your real credentials or environment variables
const EMAIL_USER = process.env.EMAIL_USER || 'transit.guards.app@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'kuvk xkxk plbc qcnx';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendReportEmail(report) {
  const { category, content, threatLevel, stationName, lineName, location } = report;

  const mailOptions = {
    from: EMAIL_USER,
    to: 'sebmanzanares@gmail.com', // Change to actual recipient email
    subject: `[Transit Guards] New Report - ${category} (${threatLevel})`,
    text: `
A new report has been submitted:

Category: ${category}
Threat Level: ${threatLevel}
Station: ${stationName || 'N/A'}
Line: ${lineName || 'N/A'}
Location: ${location ? `Lat: ${location.lat}, Lng: ${location.lng}` : 'N/A'}

Details:
${content}

Please take any necessary action.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

module.exports = { sendReportEmail };
// This code sets up a Nodemailer transporter to send emails when a new report is created.
// It uses Gmail as the email service and requires an email and app password for authentication.