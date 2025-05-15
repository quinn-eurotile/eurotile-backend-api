const Validator = require('validatorjs');
const { formatValidationErrors } = require('../_helpers/common');

// Custom rule: allow null or MongoDB ObjectId
Validator.register('isMongoIdOrNull', function (value) {
    if (value === null || value === undefined || value === '') return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
}, 'The :attribute must be a valid MongoDB ObjectId or null.');



/** saveAttribute */
const saveAttribute = (req, res, next) => {
    const id = req?.params?.id; // this will be undefined if creating
    const validationRule = {
        "name": id ? `required|exist_update:ProductAttribute,name,${id}` : "required|exist:ProductAttribute,name",
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
}
/** Validate Tax Before Save or Update */
const saveTax = (req, res, next) => {
    const validationRule = {
        customerType: 'required|string|in:Retail,Trade',
        taxPercentage: 'required|numeric|min:0|max:100',
    };

    const validation = new Validator(req.body, validationRule);

    validation.checkAsync(
        () => next(), // success
        () => {
            res.status(422).send({
                type: 'validation_error',
                message: 'Your form data is invalid',
                data: validation.errors.all(),
            });
        }
    );
};

module.exports = { saveAttribute,saveTax };
