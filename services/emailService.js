const nodemailer = require('nodemailer');
const { getClientUrlByRole } = require('../_helpers/common');

// SMTP Configuration
const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
};

// If using a service like Gmail, can specify service instead of host/port
if (process.env.SMTP_SERVICE) {
    smtpConfig.service = process.env.SMTP_SERVICE;
    delete smtpConfig.host;
    delete smtpConfig.port;
    delete smtpConfig.secure;
}

// Log SMTP configuration (without sensitive data)
console.log('Setting up nodemailer with config:', {
    ...smtpConfig,
    auth: {
        user: smtpConfig.auth.user,
        pass: '********' // Hide actual password
    }
});

const transporter = nodemailer.createTransport(smtpConfig);

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Nodemailer transporter verification failed:', error);
    } else {
        console.log('Nodemailer server is ready to send emails');
    }
});

const capitalize = (str) => {
    return str?.charAt(0)?.toUpperCase() + str?.slice(1);
};

const APP_NAME = process.env.APP_NAME || 'Euro Tile';
const DEFAULT_FROM_NAME = process.env.SMTP_FROM_NAME || APP_NAME;
const DEFAULT_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

// Helper function to format email sender
const formatSender = (customName = DEFAULT_FROM_NAME) => {
    return `${customName} <${DEFAULT_FROM_EMAIL}>`;
};

const sendAccountStatusEmail = async (req, link, message) => {
    try {
        const CLIENT_URL = getClientUrlByRole(req.body.userRole); // or user.role if it's a string
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;
        const link = `${CLIENT_URL}/en/login`;
        const isRejected = req?.body?.status === 2; // or any logic you use
        const reason = req?.body?.reason || '';

        const statusBlock = isRejected
            ? `<div style="background: #fcebea; padding: 15px; border-left: 5px solid #e3342f; margin: 20px 0; font-size: 14px; color: #cc1f1a;">
            <strong>${message}:</strong> ${reason}
        </div>`
            : `<div style="background: #e6ffed; padding: 15px; border-left: 5px solid #38c172; margin: 20px 0; font-size: 14px; color: #1f9d55;">
            <strong>${message}</strong>
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
            from: formatSender(),
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
            from: formatSender(),
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
            from: formatSender(),
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
            from: formatSender(),
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

/** Send Payment Link Email ***/
const sendPaymentLinkEmail = async (data) => {
    try {
        // console.log('Starting sendPaymentLinkEmail with data:', {
        //     cartId: data.cartId,
        //     clientId: data.clientId,
        //     clientEmail: data.clientEmail,
        //     itemCount: data.cartItems?.length
        // });

        const CLIENT_URL = getClientUrlByRole('Client');
     //   console.log('Client URL:', CLIENT_URL);

        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;
        // Update payment link to match Next.js app routing structure
        const paymentLink = `${CLIENT_URL}/en/payment/${data.cartId}?client=${data.clientId}`;
        
       // console.log('Payment Link:', paymentLink);

        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/payment_link_template.html', 'utf-8');
       // console.log('Email template loaded successfully');

        // Generate product list HTML
        const productListHtml = data.cartItems.map(item => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <img src="${process.env.APP_URL}${item.product?.productFeaturedImage?.filePath}" 
                             alt="${item.product?.name}" 
                             class="product-image">
                        <div class="product-details">
                            <div>${item.product?.name}</div>
                            <div style="color: #666; font-size: 12px;">${item.variation?.name || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${item.quantity} SQ.M</td>
                <td>€${item.price.toFixed(2)}</td>
                <td>€${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');
        
      //  console.log('Product list HTML generated');

        // Replace placeholders in the template
        let emailContent = emailTemplate
            .replace(/\[USER_NAME\]/g, capitalize(data.clientName))
            .replace(/\[LOGO\]/g, logo)
            .replace(/\[APP_NAME\]/g, APP_NAME)  // Using global replacement
            .replace(/\[ORDER_ID\]/g, data.cartId)
            .replace(/\[PRODUCT_LIST\]/g, productListHtml)
            .replace(/\[SUBTOTAL\]/g, data.orderSummary.subtotal.toFixed(2))
            .replace(/\[SHIPPING\]/g, data.orderSummary.shipping.toFixed(2))
            .replace(/\[TOTAL\]/g, data.orderSummary.total.toFixed(2))
            .replace(/\[PAYMENT_LINK\]/g, paymentLink)
            .replace(/\[CURRENT_YEAR\]/g, new Date().getFullYear())
            .replace(/\[CLIENT_URL\]/g, CLIENT_URL);

       // console.log('Email content prepared with all replacements');

        // Send the email
        const mailOptions = {
            from: formatSender(),
            to: data.clientEmail,
            subject: `Payment Request from ${APP_NAME}`,
            html: emailContent
        };

       // console.log('Attempting to send email with options:', {
        //     from: mailOptions.from,
        //     to: mailOptions.to,
        //     subject: mailOptions.subject
        // });

        const result = await sendEmailCommon(mailOptions);
       // console.log('Email sending result:', result);

        return result;
    } catch (error) {
        console.error('Detailed error in sendPaymentLinkEmail:', {
            error: error.message,
            stack: error.stack,
            data: {
                cartId: data.cartId,
                clientId: data.clientId,
                clientEmail: data.clientEmail
            }
        });
        return false;
    }
};

/** Send Order Confirmation Email ***/
const sendOrderConfirmationEmail = async (order, clientEmail, clientName) => {
    console.log('Starting sendOrderConfirmationEmail with:', {
        orderId: order?._id,
        clientEmail,
        clientName,
        orderData: order?.orderData,
        orderDetails: order?.orderDetails?.length
    });

    try {
        const CLIENT_URL = getClientUrlByRole('Client');
        console.log('Client URL:', CLIENT_URL);
        
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;

        // Generate product list HTML with variants
        const productListHtml = order.orderDetails.map(detail => {
            console.log('Processing order detail:', {
                detailId: detail?._id,
                productDetail: detail?.productDetail
            });

            // Parse the product detail JSON string
            let productInfo;
            try {
                productInfo = JSON.parse(detail.productDetail);
                console.log('Parsed product info:', {
                    name: productInfo?.product?.name,
                    dimensions: productInfo?.dimensions,
                    attributes: productInfo?.attributeVariations
                });
            } catch (e) {
                console.error('Error parsing product detail:', e);
                productInfo = {};
            }

            // Format dimensions
            const dimensions = productInfo?.dimensions || {};
            const dimensionText = dimensions.length && dimensions.width && dimensions.height
                ? `${dimensions.length}x${dimensions.width}x${dimensions.height}`
                : '';

            // Format attributes
            const attributes = productInfo?.attributeVariations || [];
            const attributeText = attributes.map(attr => {
                const value = attr.metaValue;
                const unit = attr.productMeasurementUnit?.symbol || '';
                return `${attr.productAttribute?.name}: ${value}${unit}`;
            }).join(', ');

            // Get the first variation image or featured image
            const imagePath = productInfo?.variationImages?.[0]?.filePath || 
                            productInfo?.productFeaturedImage?.filePath ||
                            '/images/placeholder.png';

            return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <img src="${process.env.APP_URL}${imagePath}" 
                             alt="${productInfo?.product?.name || 'Product'}" 
                             class="product-image">
                        <div class="product-details">
                            <div style="font-weight: bold;">${productInfo?.product?.name || 'Product'}</div>
                            ${dimensionText ? `<div style="color: #666; font-size: 12px;">Dimensions: ${dimensionText}</div>` : ''}
                            ${attributeText ? `<div style="color: #666; font-size: 12px;">${attributeText}</div>` : ''}
                            <div style="color: #666; font-size: 12px;">SKU: ${productInfo?.product?.sku || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td>${detail.quantity} SQ.M</td>
                <td>€${detail.price.toFixed(2)}</td>
                <td>€${(detail.price * detail.quantity).toFixed(2)}</td>
            </tr>
        `}).join('');

        console.log('Generated product list HTML length:', productListHtml.length);

        // Format shipping address
        const shippingAddress = order.shippingAddress ? 
            `${order?.shippingAddress.street}
            ${order?.shippingAddress.city}
            ${order?.shippingAddress.state}
            ${order?.shippingAddress.postalCode}
            ${order?.shippingAddress.country}` : 'Address not available';

        console.log('Formatted shipping address:', shippingAddress);

        // Read the HTML template
        console.log('Reading email template...');
        const emailTemplate = require('fs').readFileSync('views/emails/order_confirmation_template.html', 'utf-8');
        console.log('Email template loaded, length:', emailTemplate.length);

        // Replace placeholders in the template
        const emailContent = emailTemplate
            .replace(/\[USER_NAME\]/g, capitalize(clientName))
            .replace(/\[LOGO\]/g, logo)
            .replace(/\[APP_NAME\]/g, APP_NAME)
            .replace(/\[ORDER_ID\]/g, order._id)
            .replace(/\[ORDER_DATE\]/g, new Date(order.createdAt).toLocaleDateString())
            .replace(/\[SHIPPING_ADDRESS\]/g, shippingAddress)
            .replace(/\[PRODUCT_LIST\]/g, productListHtml)
            .replace(/\[SUBTOTAL\]/g, (order?.subtotal || 0).toFixed(2))
            .replace(/\[SHIPPING\]/g, (order?.shipping || 0).toFixed(2))
            .replace(/\[TOTAL\]/g, (order?.total || 0).toFixed(2))
            .replace(/\[CURRENT_YEAR\]/g, new Date().getFullYear())
            .replace(/\[CLIENT_URL\]/g, CLIENT_URL);

        console.log('Email content generated, length:', emailContent.length);

        // Send the email
        const mailOptions = {
            from: formatSender(),
            to: clientEmail,
            subject: `Order Confirmation - ${order._id}`,
            html: emailContent
        };

        console.log('Sending email with options:', {
            to: clientEmail,
            subject: mailOptions.subject,
            from: mailOptions.from
        });

        const result = await sendEmailCommon(mailOptions);
        console.log('Email send result:', result);
        return result;
    } catch (error) {
        console.error('Error in sendOrderConfirmationEmail:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            order: order?._id,
            clientEmail
        });
        return false;
    }
};

const sendEmailCommon = (mailOptions) => {
    console.log('sendEmailCommon called with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
    });

    // Return a promise to properly handle asynchronous operation
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error('Email sending error:', {
                    error: error.message,
                    stack: error.stack,
                    mailOptions: {
                        from: mailOptions.from,
                        to: mailOptions.to,
                        subject: mailOptions.subject
                    }
                });
                reject(false);
            } else {
                console.log('Email sent successfully:', {
                    messageId: info.messageId,
                    response: info.response
                });
                resolve(true);
            }
        });
    });
};

// Export the new function along with existing ones
module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    forgotPasswordEmail,
    sendPaymentLinkEmail,
    sendAccountStatusEmail,
    sendOrderConfirmationEmail
};
