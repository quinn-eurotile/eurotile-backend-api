const Validator = require('validatorjs');
/************Include model to check*****************/
const Models = require("../models");

const validator = (body, rules, customMessages, callback) => {
    const validation = new Validator(body, rules, customMessages);
    validation.passes(() => callback(null, true));
    validation.fails(() => callback(validation.errors, false));
};

/**
 * Checks if incoming value already exist for unique and non-unique fields in the database
 * e.g email: required|email|exists:User,email
 */
 //const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/;
 //const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,})$/;
 //const passwordRegex = /^.*(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&]).*$/;
 const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

// Tighten password policy
Validator.register('check_password', value => passwordRegex.test(value),
     'Password must be 8 charcter long and it should contains 1 uppercase, 1 lowercase , 1 number and a special character');
	 
// Capitalize helper
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);


Validator.registerAsync('exist', async function (value, attribute, req, passes) {
    try {
        const [table, column] = attribute.split(",");
        if (!table || !column) {
            return passes(false, 'Invalid format. Use: exist:Table,field');
        }

        const Model = Models[table];
        if (!Model) return passes(false, `Model "${table}" not found`);

        const conditions = {
            // [column]: value,
            [column]: { $regex: `^${value}$`, $options: 'i' }, // Case-insensitive match
            isDeleted: false // Check only non-deleted records
        };

        const existing = await Model.findOne(conditions);
        if (existing) {
            return passes(false, `${capitalize(column)} already in use`);
        }

        passes();
    } catch (err) {
        passes(false, err.message || 'Validation error');
    }
});

Validator.registerAsync('exist_update', async function (value, attribute, req, passes) {
    try {
        const [table, column, updateId] = attribute.split(",");
        if (!table || !column || !updateId) {
            return passes(false, 'Invalid format. Use: exist_update:Table,field,id');
        }

        const Model = Models[table];
        if (!Model) return passes(false, `Model "${table}" not found`);

        const conditions = {
            // [column]: value,
            [column]: { $regex: `^${value}$`, $options: 'i' }, // Case-insensitive match
            isDeleted: false // Check only non-deleted records
        };

        const existing = await Model.findOne(conditions);
        if (existing && String(existing._id) !== String(updateId)) {
            return passes(false, `${capitalize(column)} has already been taken by another ${table}`);
        }

        passes();
    } catch (err) {
        passes(false, err.message || 'Validation error');
    }
});

module.exports = validator;