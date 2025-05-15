const modelInstance = require("../models");
const mongoose = require('mongoose');

class CommonService {


    /** Update Status Of Any Model Using Proper Arguments Pass */
    async updateStatusById(req, model, allowedStatuses = [0, 1]) {
        try {
            if (!modelInstance[model]) throw { message: `Model "${model}" not found`, statusCode: 404 };
            const { status } = req.body;
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw { message: 'Invalid ID', statusCode: 400 };
            }
            if (!allowedStatuses.includes(status)) {
                throw { message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`, statusCode: 400 };
            }
            const updatedDoc = await modelInstance[model].findByIdAndUpdate(id, { status }, { new: true });
            if (!updatedDoc) {
                throw { message: 'Document not found', statusCode: 404 };
            }
            return updatedDoc;
        } catch (error) {
            throw { message: error?.message || 'Failed to update status', statusCode: error?.statusCode || 500 };
        }
    }


    /** Soft Delete Any Model Using Proper Arguments Passed */
    /** Toggle isDeleted flag of any model using proper arguments passed */
    async updateIsDeletedById(req, model, isDeleted = true, allowedValues = [true, false]) {
        try {
            if (!modelInstance[model]) {
                throw { message: `Model "${model}" not found`, statusCode: 404 };
            }
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw { message: 'Invalid ID', statusCode: 400 };
            }
            if (!allowedValues.includes(isDeleted)) {
                throw { message: `Invalid value for isDeleted. Allowed values: ${allowedValues.join(', ')}`, statusCode: 400 };
            }
            const updatedDoc = await modelInstance[model].findByIdAndUpdate(
                id,
                { isDeleted },
                { new: true }
            );
            if (!updatedDoc) {
                throw { message: 'Document not found', statusCode: 404 };
            }
            return updatedDoc;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update isDeleted flag',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Get all documents of any model with optional filters, pagination, sorting */
    async getAllData(model, {
        filters = {},
        projection = null,
        sort = {},
        page = 1,
        limit = 10,
    } = {}) {
        try {
            if (!modelInstance[model]) {
                throw { message: `Model "${model}" not found`, statusCode: 404 };
            }

            const skip = (page - 1) * limit;

            const data = await modelInstance[model]
                .find(filters, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await modelInstance[model].countDocuments(filters);

            return data
        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch data',
                statusCode: error?.statusCode || 500
            };
        }
    }


}

module.exports = new CommonService();