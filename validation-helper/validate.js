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
	 
//check if the field value is alerdy taken	 
Validator.registerAsync('exist', function(value,  attribute, req, passes) {
   
    if (!attribute) throw new Error('Specify Requirements i.e fieldName: exist:table,column');
    
    //split table and column
    let attArr = attribute.split(",");

    if (attArr.length !== 2) throw new Error(`Invalid format for validation rule on ${attribute}`);
    
    //assign array index 0 and 1 to table and column respectively
    const [table, column] = attArr;

    // Ensure that the model exists
    if (!Models[table]) {
        throw new Error(`Model ${table} not found in the Models object`);
    }

   // console.log('Models[table]',attribute)
    //define custom error message
    let msg = (column == "username") ? `${column.charAt(0).toUpperCase() + column.slice(1)} has already been taken `: `${column.charAt(0).toUpperCase() + column.slice(1)} already in use`
    
    //check if incoming value already exists in the database
    Models[table].findOne({ [column]: value })
    .then((result) => {
        if(result){
            passes(false, msg); // return false if value exists
            return;
        }
        passes();
    })
});

//check if the field value update in edit case and it is taken by other collection 
Validator.registerAsync('exist_update', function(value,  attribute, req, passes) {
    if (!attribute) throw new Error('Specify Requirements i.e fieldName: exist:table,column');
    //split table and column
    let attArr = attribute.split(",");
    if (attArr.length !== 3) throw new Error(`Invalid format for validation rule on ${attribute}`);

    //assign array index 0 and 1 to table and column respectively
    const { 0: table, 1: column, 2: update_id } = attArr;
    //define custom error message
    let msg = (column == "username") ? `${column} has already been taken `: `${column} has already been taken other ${table}`
    //check if incoming value already exists in the database
    Models[table].findOne({ [column]: value })
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