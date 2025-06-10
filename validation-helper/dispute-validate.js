const Joi = require('joi');

const disputeValidate = {
    createDispute: Joi.object({
        order: Joi.string().required().messages({
            'string.empty': 'Order ID is required',
            'any.required': 'Order ID is required'
        }),
        issueType: Joi.string()
            .valid('ORDER_ISSUE', 'PAYMENT_ISSUE', 'INVOICE_ISSUE', 'PRODUCT_ISSUE')
            .required()
            .messages({
                'string.empty': 'Issue type is required',
                'any.required': 'Issue type is required',
                'any.only': 'Invalid issue type'
            }),
        description: Joi.string().required().min(10).max(500).messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description cannot exceed 500 characters',
            'any.required': 'Description is required'
        }),
        attachments: Joi.array().items(Joi.string()).optional()
    }),

    updateStatus: Joi.object({
        status: Joi.number()
            .valid(0, 1, 2, 3)
            .required()
            .messages({
                'number.base': 'Status must be a number',
                'any.only': 'Invalid status value',
                'any.required': 'Status is required'
            }),
        resolution: Joi.string().when('status', {
            is: 2,
            then: Joi.string().required().min(10).max(500),
            otherwise: Joi.string().optional()
        }).messages({
            'string.empty': 'Resolution is required when status is resolved',
            'string.min': 'Resolution must be at least 10 characters long',
            'string.max': 'Resolution cannot exceed 500 characters'
        })
    })
};

module.exports = { disputeValidate }; 