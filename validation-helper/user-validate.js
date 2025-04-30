const validator = require('./validate');


const register = (req, res, next) => {
    let validationRule = {
        "name": "required|string",
        "email": "required|email|exist:User,email",
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

const saveCategory = (req, res, next) => {
    let validationRule = {
        "name": "required|string|max:255",
        "parent": "nullable|mongoid", // optional parent category ID
    };

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422).send({
                type: 'validation_error',
                message: 'Your form data is invalid',
                data: err
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
        "phone": id ? `required|numeric|exist_update:User,phone,${id}` : "required|numeric|exist:User,phone",
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


const saveSupplier = (req, res, next) => {
    const id = req?.params?.id; // this will be undefined if creating

    let validationRule = {
        "companyName": "required|string",
        "companyEmail": id ? `required|email|exist_update:Supplier,companyEmail,${id}` : "required|email|exist:Supplier,companyEmail",
        "companyPhone": id ? `required|numeric|exist_update:Supplier,companyPhone,${id}` : "required|numeric|exist:Supplier,companyPhone",
        "addresses.addressLine1":  `required|string`,
        "addresses.city":  `required|string`,
        "addresses.country":  `required|string`, 
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


const userRoleValidate = (req, res, next) => {
    console.log('I am here');

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



module.exports = { saveTeamMember,saveSupplier,saveCategory, register, update, UpadetPassword, forgotPassword, resetPassword, login, updateUserProfile, userRoleValidate };