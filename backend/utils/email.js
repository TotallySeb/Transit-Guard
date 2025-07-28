// utils/email.js (CommonJS version)

const nodemailer = require('nodemailer');
const path = require('path');

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
  const { category, content, threatLevel, stationName, lineName, location, media } = report;

  // Prepare attachments if media exists
  const attachments = (media || [])
    .filter(file => file.path)
    .map(file => ({
      filename: path.basename(file.path),
      path: file.path,
    }));

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
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

module.exports = { sendReportEmail };
