const nodemailer = require('nodemailer');
const { getClientUrlByRole } = require('../utils/url');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');

class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendSupplierOrderNotification(order, supplier, items) {
        try {
            const CLIENT_URL = getClientUrlByRole('Supplier');
            const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;

            // Calculate supplier-specific totals
            const supplierSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const supplierShipping = order.shipping * (supplierSubtotal / order.subtotal); // Proportional shipping
            const supplierTotal = supplierSubtotal + supplierShipping;

            // Generate product list HTML
            const productListHtml = items.map(item => {
                const productDetail = JSON.parse(item.productDetail);
                return `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <img src="${productDetail.images[0]}" alt="${productDetail.name}" style="width: 50px; height: 50px; object-fit: cover;">
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            ${productDetail.name}<br>
                            <small style="color: #666;">SKU: ${productDetail.sku}</small>
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                            ${item.quantity}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                            ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(item.price)}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                            ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(item.price * item.quantity)}
                        </td>
                    </tr>
                `;
            }).join('');

            const emailTemplate = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { max-width: 200px; }
                        .order-info { margin-bottom: 30px; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .total-section { text-align: right; margin-top: 20px; }
                        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="${logo}" alt="Logo" class="logo">
                            <h2>New Order Notification</h2>
                        </div>
                        
                        <div class="order-info">
                            <p>Dear ${supplier.companyName},</p>
                            <p>You have received a new order (#${order.orderId}). Please review and confirm the following items:</p>
                        </div>

                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="padding: 10px; background: #f8f9fa; text-align: left;">Image</th>
                                    <th style="padding: 10px; background: #f8f9fa; text-align: left;">Product</th>
                                    <th style="padding: 10px; background: #f8f9fa; text-align: center;">Quantity</th>
                                    <th style="padding: 10px; background: #f8f9fa; text-align: right;">Price</th>
                                    <th style="padding: 10px; background: #f8f9fa; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productListHtml}
                            </tbody>
                        </table>

                        <div class="total-section">
                            <p>Subtotal: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(supplierSubtotal)}</p>
                            <p>Shipping: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(supplierShipping)}</p>
                            <p><strong>Total: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(supplierTotal)}</strong></p>
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${CLIENT_URL}/supplier/orders/${order._id}" class="button">View Order Details</a>
                        </div>

                        <div style="margin-top: 30px;">
                            <p>Please log in to your supplier dashboard to confirm this order and update its status.</p>
                            <p>Thank you for your business!</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: supplier.email,
                subject: `New Order Notification - ${order.orderId}`,
                html: emailTemplate
            });

            return true;
        } catch (error) {
            console.error('Error sending supplier notification:', error);
            return false;
        }
    }

    async sendOrderStatusUpdateNotification(order, supplier, status, notes) {
        try {
            const customerEmail = order.customer.email;
            const statusUpdateTemplate = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Order Status Update</h2>
                        <p>Dear Customer,</p>
                        <p>There has been an update to your order #${order.orderId}.</p>
                        <p>Supplier ${supplier.companyName} has updated the status of their items to: <strong>${status}</strong></p>
                        ${notes ? `<p>Notes from supplier: ${notes}</p>` : ''}
                        <p>You can view your order details by logging into your account.</p>
                        <p>Thank you for shopping with us!</p>
                    </div>
                </body>
                </html>
            `;

            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: customerEmail,
                subject: `Order Status Update - ${order.orderId}`,
                html: statusUpdateTemplate
            });

            return true;
        } catch (error) {
            console.error('Error sending status update notification:', error);
            return false;
        }
    }
}

module.exports = new NotificationService(); 