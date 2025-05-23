const nodemailer = require('nodemailer');
const { getClientUrlByRole } = require('../_helpers/common');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});
const capitalize = (str) => {
    return str?.charAt(0)?.toUpperCase() + str?.slice(1);
};
const APP_NAME = process?.env?.APP_NAME || 'Euro Tile';

const sendAccountStatusEmail = async (req, link) => {
    try {
        const CLIENT_URL = getClientUrlByRole(req.body.userRole); // or user.role if it's a string
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;
        const link = `${CLIENT_URL}/en/login`;
        const isRejected = req?.body?.status === 4; // or any logic you use
        const reason = req?.body?.reason || '';

        const statusBlock = isRejected
            ? `<div style="background: #fcebea; padding: 15px; border-left: 5px solid #e3342f; margin: 20px 0; font-size: 14px; color: #cc1f1a;">
            <strong>Account Rejected:</strong> ${reason}
        </div>`
            : `<div style="background: #e6ffed; padding: 15px; border-left: 5px solid #38c172; margin: 20px 0; font-size: 14px; color: #1f9d55;">
            <strong>Account Approved</strong>
        </div>`;

        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/send_account_status_email_template.html', 'utf-8');
        // Replace placeholders in the template
        const emailContent = emailTemplate
            .replace('[USER_NAME]', capitalize(req?.body?.name))
            .replace('[LOGO]', logo)
            .replace(/\[CLIENT_URL\]/g, process.env.CLIENT_URL)
            .replace(/\[APP_NAME\]/g, APP_NAME)
            .replace('[LINK]', link)
            .replace('[STATUS_BLOCK]', statusBlock);

        // Send the email
        const mailOptions = {
            from: `<${process?.env?.SMTP_USER}>`,
            to: req?.body?.email,
            subject: 'Account Status Notification',
            html: emailContent
        };
        const result = await sendEmailCommon(mailOptions);
        return result;
    } catch (error) {
        console.error('Error in sendAccountStatusEmail:', error);
        return false; // or rethrow or handle however you need
    }
};

/** Send Email Verification Email ***/
const sendVerificationEmail = async (req, verificationLink) => {
    try {
        const CLIENT_URL = getClientUrlByRole('Admin'); // or user.role if it's a string
        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/send_verification_email_template.html', 'utf-8');
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;
        // Replace placeholders in the template
        const emailContent = emailTemplate.replace('[USER_NAME]', capitalize(req?.body?.name))
            .replace('[LOGO]', logo)
            .replace('[CLIENT_URL]', process?.env?.CLIENT_URL)
            .replace('[APP_NAME]', APP_NAME)
            .replace('[VERIFICATION_LINK]', verificationLink);

        // Send the email
        const mailOptions = {
            from: `<${process?.env?.SMTP_USER}>`,
            to: req?.body?.email,
            subject: 'Email Verification',
            html: emailContent
        };
        const result = await sendEmailCommon(mailOptions);
        return result;
    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        return false; // or rethrow or handle however you need
    }

};

/** Register Time Send Email ***/
const sendWelcomeEmail = async (req) => {
    try {
        const CLIENT_URL = getClientUrlByRole('Admin'); // or user.role if it's a string
        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/welcome_email_template.html', 'utf-8');
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;
        const emailContent = emailTemplate.replace('[USER_NAME]', req.body.first_name + ` ` + req.body.last_name)
            .replace('[CLIENT_URL]', CLIENT_URL)
            .replace('[APP_NAME]', APP_NAME)
            .replace('[EMAIL]', req.body.email)
            .replace('[PASSWORD]', req.body.password)
            .replace('[LOGO]', logo)
            .replace('[LOGIN_URL]', `${CLIENT_URL}/user/login`);

        // Send the email
        const mailOptions = {
            from: `<${process.env.SMTP_USER}>`,
            to: req.body.email,
            subject: 'Welcome to Our App!',
            html: emailContent
        };
        const result = await sendEmailCommon(mailOptions);
        return result;
    } catch (error) {
        console.error('Error in sendWelcomeEmail:', error);
        return false; // or rethrow or handle however you need
    }


};


/** Forgot Password Send Email ***/
const forgotPasswordEmail = async (req, token) => {
    try {
        const CLIENT_URL = getClientUrlByRole('Admin'); // or user.role if it's a string
        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/forgot_password_template.html', 'utf-8');
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;
        let resetPassLink = `${CLIENT_URL}/reset-password/${token}`;
        // Replace placeholders in the template
        const emailContent = emailTemplate.replace('[USER_NAME]', 'User')
            .replace('[LOGO]', logo)
            .replace('[CLIENT_URL]', CLIENT_URL)
            .replace('[APP_NAME]', APP_NAME)
            .replace('[RESET_PASSWORD_LINK]', resetPassLink);

        // Send the email
        const mailOptions = {
            from: `<${process.env.SMTP_USER}>`,
            to: req.body.email,
            subject: 'RESET PASSWORD',
            html: emailContent
        };
        const result = await sendEmailCommon(mailOptions);
        return result;
    } catch (error) {
        console.error('Error in forgotPasswordEmail:', error);
        return false; // or rethrow or handle however you need
    }

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

module.exports = { sendAccountStatusEmail, sendVerificationEmail, sendWelcomeEmail, forgotPasswordEmail };
