const validator = require('./validate');
const { formatValidationErrors } = require('../_helpers/common');
const register = (req, res, next) => {
    let validationRule = {
        "name": "required|string",
        "email": "required|email|exist:User,email",
    };

    if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};


const saveCustomer = (req, res, next) => {
    const id = req?.params?.id; // this will be undefined if creating
    console.log('id',id)
    // Normalize phone number
    if (req.body.phone && typeof req.body.phone === 'string') {
        req.body.phone = req.body.phone.replace(/[^\d]/g, ''); // Keep only digits
    }
    let validationRule = {
        "name": "required|string",
        "email": id ? `required|email|exist_update:User,email,${id}` : "required|email|exist:User,email",
        "phone": id ? `required|numeric|exist_update:Supplier,phone,${id}` : "required|numeric|exist:User,phone",
    };

    if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: formatValidationErrors(err.all())
                });
        } else {
            next();
        }
    });
};


const saveTeamMember = (req, res, next) => {
    const id = req?.params?.id; // this will be undefined if creating

    let validationRule = {
        "name": "required|string",
        "email": id ? `required|email|exist_update:User,email,${id}` : "required|email|exist:User,email",
        "phone": id ? `required|exist_update:User,phone,${id}` : "required|exist:User,phone",
    };


    if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};

const saveTradeProfessional = (req, res, next) => {
    const id = req?.params?.id; // this will be undefined if creating
    // Normalize phone number
    if (req.body.phone && typeof req.body.phone === 'string') {
        req.body.phone = req.body.phone.replace(/[^\d]/g, ''); // Keep only digits
        req.body.business_phone = req.body.business_phone.replace(/[^\d]/g, ''); // Keep only digits
    }
    let validationRule = {
        "name": "required|string",
        "email": id ? `required|email|exist_update:User,email,${id}` : "required|email|exist:User,email",
        "phone": id ? `required|numeric|exist_update:Supplier,phone,${id}` : "required|numeric|exist:User,phone",
        "password": "required",
    };

    if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
    }


    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};


const saveSupplier = (req, res, next) => {
    const id = req?.params?.id; // this will be undefined if creating

    let validationRule = {
        "companyName": "required|string",
        "companyEmail": id ? `required|email|exist_update:Supplier,companyEmail,${id}` : "required|email|exist:Supplier,companyEmail",
        "companyPhone": id ? `required|exist_update:Supplier,companyPhone,${id}` : "required|exist:Supplier,companyPhone",
        "addresses.addressLine1": `required|string`,
        "addresses.city": `required|string`,
        "addresses.country": `required|string`,
    };

    if (req.body.companyEmail && typeof req.body.companyEmail === 'string') {
        req.body.companyEmail = req.body.companyEmail.trim().toLowerCase();
    }



    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};


const userRoleValidate = (req, res, next) => {


    // Check if id is provided, if yes, skip validation for the current record
    const roleId = req.params.id ? `,${req.params.id}` : '';

    // Define the validation rule
    let validationRule = {
        "name": `required|exist:role,name`,
    };

    // Perform the validation
    validator(req.body, validationRule, {}, async (err, status) => {
        if (!status) {
            // Send validation error response if validation fails
            return res.status(422).send({
                type: 'validation_error',
                message: 'Your form data is invalid',
                data: err
            });
        } else {
            // Proceed to the next middleware if validation passes
            console.log('I am here again');
            next();
        }
    });
};

const login = (req, res, next) => {
    const validationRule = {
        "email": "required|email",
        "password": "required",
    };

    if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};

const update = (req, res, next) => {

    const validationRule = {
        "first_name": "required|string",
        "last_name": "required|string",
        "email": "required|email|exist_update:User,email," + req.params.id,
        "roles": "required",
    };
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};

const updateUserProfile = (req, res, next) => {

    const validationRule = {
        "first_name": "required|string",
        "last_name": "required|string",
        "email": `required|email|exist_update:User,email,${req.params.id}`,
        //"phonenumber": "required",
        "password": "required",

    };
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};

const UpadetPassword = (req, res, next) => {
    const validationRule = {
        "password": "required|string|min:6|check_password",
    };
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};

const forgotPassword = (req, res, next) => {
    const validationRule = {
        "email": "required|email",
    };

    if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};

const resetPassword = (req, res, next) => {
    const validationRule = {
        "password": "required|string|min:6|confirmed|check_password",
        "password_confirmation": "required|string|min:6|check_password",
        "token": "required",
    };
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(200)
                .send({
                    type: 'validation_error',
                    message: 'You form data is invalid',
                    data: err
                });
        } else {
            next();
        }
    });
};



const updateTradeProfessional = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().required(),
            status: Joi.number(),
            business_name: Joi.string().required(),
            business_email: Joi.string().email().required(),
            business_phone: Joi.string().required(),
        });

        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { saveCustomer, updateTradeProfessional, saveTradeProfessional, saveTeamMember, saveSupplier, register, update, UpadetPassword, forgotPassword, resetPassword, login, updateUserProfile, userRoleValidate };