const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

/** Send Email Verification Email ***/
const sendVerificationEmail = (req, verificationLink) => {

    // Read the HTML template
    const emailTemplate = require('fs').readFileSync('views/emails/send_verification_email_template.html', 'utf-8');
    const logo = `${process.env.CLIENT_URL}/assets/images/mail-logo.png`;
    // Replace placeholders in the template
    const emailContent = emailTemplate.replace('[USER_NAME]', req.body.first_name + ` ` + req.body.last_name)
        .replace('[LOGO]', logo)
        .replace('[CLIENT_URL]', process.env.CLIENT_URL)
        .replace('[APP_NAME]', process.env.APP_NAME)
        .replace('[VERIFICATION_LINK]', verificationLink);

    // Send the email
    const mailOptions = {
        from: `<${process.env.SMTP_USER}>`,
        to: req.body.email,
        subject: 'Email Verification',
        html: emailContent
    };
    return sendEmailCommon(mailOptions);
};

/** Register Time Send Email ***/
const sendWelcomeEmail = (req) => {

    // Read the HTML template
    const emailTemplate = require('fs').readFileSync('views/emails/welcome_email_template.html', 'utf-8');
    const logo = `${process.env.CLIENT_URL}/assets/images/mail-logo.png`;
    const emailContent = emailTemplate.replace('[USER_NAME]', req.body.first_name + ` ` + req.body.last_name)
        .replace('[CLIENT_URL]', process.env.CLIENT_URL)
        .replace('[APP_NAME]', process.env.APP_NAME)
        .replace('[EMAIL]', req.body.email)
        .replace('[PASSWORD]', req.body.password)
        .replace('[LOGO]', logo)
        .replace('[LOGIN_URL]', `${process.env.CLIENT_URL}/user/login`);

    // Send the email
    const mailOptions = {
        from: `<${process.env.SMTP_USER}>`,
        to: req.body.email,
        subject: 'Welcome to Our App!',
        html: emailContent
    };
    return sendEmailCommon(mailOptions);

};

/** Forgot Password Send Email ***/
const forgotPasswordEmail = (req, token) => {
    const roleName = req.body.for_admin ? 'admin' : 'user';
    const mailOptions = {
        from: `<${process.env.SMTP_USER}>`,
        to: req.body.email,
        subject: 'Reset Password',
        text: `Click the following link to reset your password: <a href="${process.env.CLIENT_URL}/${roleName}/reset-password/${token}" target="_blank" ><u>Link</u></a>`,
        html: `<b>Hello User,</b><br /><p>Click the following link to reset your password: (<a href="${process.env.CLIENT_URL}/${roleName}/reset-password/${token}" target="_blank" ><u>Link</u></a>)</p>`, // html body
    };
    return sendEmailCommon(mailOptions);
};




const sendEmailCommon = (mailOptions) => {
    // Return a promise to properly handle asynchronous operation
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                //await logError(6, error.status, error.message, null, null);
                reject(false); // Reject the promise if there is an error
            } else {
                resolve(true); // Resolve the promise if email sending is successful
            }
        });
    });
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, forgotPasswordEmail };
