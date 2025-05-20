const supportTicketModel = require('../models/SupportTicket');
const mongoose = require('mongoose');

class SupportTicket {

    async saveTax(id, data) {
        try {
            if (!id) {
                // CREATE
                return await supportTicketModel.create(data);
            } else {
                // VALIDATE ID
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw { message: 'Invalid support ticket ID', statusCode: 400 };
                }

                // UPDATE
                const updatedTax = await supportTicketModel.findByIdAndUpdate(id, data, { new: true });

                if (!updatedTax) {
                    throw { message: 'Support ticket entry not found', statusCode: 404 };
                }

                return updatedTax;
            }
        } catch (error) {
            throw {
                message: error?.message || 'Error creating support ticket',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async deleteTax(id) {
        try {
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw {
                    message: 'Invalid supplier ID',
                    statusCode: 400
                };
            }
            const taxData = await supportTicketModel.findById({ _id: id });
            if (!taxData) throw new Error({ message: 'Tax record not found', statusCode: 404 });
            taxData.isDeleted = true;
            return await taxData.save();
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching users',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async getTaxById(id) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw {
                message: 'Invalid supplier ID',
                statusCode: 400
            };
        }
        return await supportTicketModel.findById(id);
    }

    async buildTaxListQuery(req) {
        const query = req.query;

        // console.log('query build',query)
        const conditionArr = [{  },];
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            }
        }

        // Add search conditions if 'search_string' is provided
        // if (query.search_string !== undefined && query.search_string !== "") {
        //     const searchString = query.search_string;
        //     const searchConditions = [
        //         { customerType: new RegExp(searchString, "i") }
        //     ];

        //     // Check if the search string is a valid number
        //     const parsedNumber = Number(searchString);
        //     if (!isNaN(parsedNumber)) {
        //         searchConditions.push({ taxPercentage: parsedNumber });
        //     }

        //     conditionArr.push({ $or: searchConditions });
        // }

        // Construct the final query
        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    async taxList(query, options) {
        try {
            console.log('query', query);
            return await supportTicketModel.paginate(query, options);
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new SupportTicket();