const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendWelcomeEmail = async (email, fullName) => {
    try {
      await transporter.sendMail({
        from: `"TradeTrail" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to TradeTrail!',
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Welcome to TradeTrail!</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.6;
              }
              .container {
                width: 90%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              h1 {
                color: #2c3e50;
              }
              p {
                margin-bottom: 15px;
              }
              .signature {
                margin-top: 30px;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Welcome to TradeTrail, ${fullName}!</h1>
              <p>
                We're thrilled to have you join our vibrant community dedicated to building a sustainable future.
                At TradeTrail, you can explore innovative ways to participate in the circular economy—whether you're swapping subscriptions,
                trading second-hand items, or engaging in unique auctions.
              </p>
              <p>
                Your account is now active, and we invite you to dive in and discover all the eco-friendly features our platform has to offer.
                Every action you take helps reduce waste and supports a more responsible way of living.
              </p>
              <p>
                If you have any questions or need assistance, our friendly support team is always here to help.
                Together, let's create a smarter, greener future.
              </p>
              <p class="signature">
                Warm regards,<br>
                The TradeTrail Team
              </p>
            </div>
          </body>
        </html>
        `
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };
  

exports.sendLoginNotification = async (email, fullName) => {
  try {
    await transporter.sendMail({
      from: `"TradeTrail Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'New Login Detected',
      html: `
        <h1>Hello ${fullName}</h1>
        <p>There was a recent login to your TradeTrail account.</p>
        <p>If this was you, no action is needed.</p>
        <p>If you didn't initiate this login, please contact support immediately.</p>
      `
    });
  } catch (error) {
    console.error('Error sending login notification:', error);
  }
};

exports.sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: `"TradeTrail" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Email Verification</h1>
        <p>Click this link to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Link expires in 24 hours</p>
      `
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};