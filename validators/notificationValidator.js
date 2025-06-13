const Joi = require('joi'); 

// Validate Notification Request
exports.validateNotification = (data) => {
    const schema = Joi.object({
        type: Joi.string().required().valid('ORDER_STATUS', 'PAYMENT_CONFIRMATION', 'ADMIN_MESSAGE', 'TICKET_CREATION'),
        title: Joi.string().required(),     
        message: Joi.string().required(),
        metadata: Joi.object().optional(),
        recipientId: Joi.string().optional(),
        sendEmail: Joi.boolean().default(false)
    });

    return schema.validate(data);
};

 

