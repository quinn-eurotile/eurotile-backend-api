const modelInstance = require("../models");
const mongoose = require('mongoose');

class CommonService {


    /** Update Status Of Any Model Using Proper Arguments Pass */
    async updateStatusById(req, model, allowedStatuses = [0, 1]) {
        try {
            console.log('  const { id } = req.params;',  req.params);
            
            if (!modelInstance[model]) throw { message: `Model "${model}" not found` , statusCode: 404 };
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

}

module.exports = new CommonService();