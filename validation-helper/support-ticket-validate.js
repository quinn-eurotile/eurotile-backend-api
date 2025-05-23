const Validator = require('validatorjs');
const { formatValidationErrors } = require('../_helpers/common');

// Custom rule: allow null or MongoDB ObjectId
Validator.register('isMongoIdOrNull', function (value) {
    if (value === null || value === undefined || value === '') return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
}, 'The :attribute must be a valid MongoDB ObjectId or null.');



/** Validate Tax Before Save or Update */
const saveSupportTicket = (req, res, next) => {
    const validationRule = {
        title: 'required|string',
        sender: 'required|string',
    };

    const validation = new Validator(req.body, validationRule);

    validation.checkAsync(
        () => next(), // success
        () => {
            res.status(422).send({
                type: 'validation_error',
                message: 'Your form data is invalid',
                data: formatValidationErrors(validation.errors.all())
            });
        }
    );
};

module.exports = { saveSupportTicket };
