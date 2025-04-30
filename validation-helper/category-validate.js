const Validator = require('validatorjs');

// Custom rule to check if a value is a valid MongoDB ObjectId or null
Validator.register('isMongoIdOrNull', function (value) {
    if (value === null || value === undefined || value === '') return true; // Allow null or empty
    return /^[0-9a-fA-F]{24}$/.test(value); // Validate MongoDB ObjectId
}, 'The :attribute must be a valid MongoDB ObjectId or null.');

/** Validate Cat Before Save And Update */
const saveCategory = (req, res, next) => {
    const id = req?.body?.parent;

    const validationRule = {
        name: id
            ? `required|string|max:255|exist_update:Category,name,${id}`
            : "required|string|max:255|exist:Category,name",
        parent: "isMongoIdOrNull",
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

module.exports = { saveCategory };
