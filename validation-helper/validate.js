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

// Check if the field value already exists
Validator.registerAsync('exist', async function (value, attribute, req, passes) {
    try {
        if (!attribute) throw { message: 'Specify requirements like fieldName:exist:table,column' };

        const [table, column] = attribute.split(",");
        if (!table || !column) throw { message: `Invalid format for validation rule: "${attribute}"` };

        const Model = Models[table];
        if (!Model) throw { message: `Model "${table}" not found`};

        const msg = `${capitalize(column)} already in use`;

        const existing = await Model.findOne({ [column]: value });
        if (existing) {
            return passes(false, msg);
        }

        passes();
    } catch (err) {
        return passes(false, err.message || 'Validation error');
    }
});

// Check if the field value exists for another document during update
Validator.registerAsync('exist_update', async function (value, attribute, req, passes) {
    try {
        if (!attribute) throw { message: 'Specify requirements like fieldName:exist_update:table,column,id' };

        const [table, column, updateId] = attribute.split(",");
        if (!table || !column || !updateId) throw { message: `Invalid format for validation rule: "${attribute}"`};

        const Model = Models[table];
        if (!Model) throw { message: `Model "${table}" not found`};

        const msg = `${capitalize(column)} has already been taken by another ${table}`;

        const existing = await Model.findOne({ [column]: value });
        if (existing && String(existing._id) !== updateId) {
            return passes(false,  msg);
        }

        passes();
    } catch (err) {
        return passes(false,  err.message || 'Validation error');
    }
});

//validate category Add function	 
Validator.registerAsync('category_add', function(value,  attribute, req, passes) {
    if (!attribute) throw new Error('Specify Requirements i.e fieldName: exist:table,column');
    //split table and column
    let attArr = attribute.split(",");
    if (attArr.length !== 2) throw new Error(`Invalid format for validation rule on ${attribute}`);
	
    //assign array index 0 and 1 to table and column respectively
    const { 0: table, 1: column } = attArr;
    //define custom error message
    let msg = (column == "username") ? `${column} has already been taken `: `${column} already in use`
    //check if incoming value already exists in the database
	let query = { [column]: value };
    Models[table].findOne(query)
    .then((result) => {
        if(result){
			passes(false, msg); // return false if value exists
			return;
        }
        passes();
    })
});

//check if the field value is alredy taken with parent	 
Validator.registerAsync('category_update', function(value,  attribute, req, passes) {
    if (!attribute) throw new Error('Specify Requirements i.e fieldName: exist:table,column');
    //split table and column
    let attArr = attribute.split(",");
    if (attArr.length !== 3) throw new Error(`Invalid format for validation rule on ${attribute}`);

    //assign array index 0 and 1 to table and column respectively
    const { 0: table, 1: column, 2: update_id } = attArr;
    //define custom error message
    let msg = (column == "username") ? `${column} has already been taken `: `${column} has already been taken other ${table}`
    //check if incoming value already exists in the database
	let query = { [column]: value };
    Models[table].findOne(query)
    .then((result) => {
        if(result){
			if(result.id !== update_id){
				passes(false, msg); // return false if value exists
				return;
			}
        }
        passes();
    })
});


module.exports = validator;