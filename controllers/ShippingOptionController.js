const ShippingOption = require("../models/ShippingOption");

module.exports = class ShippingOptionController {


    /** Get Shipping Options */
    async getShippingOptions(req, res) {
        try {
            // const shippingOptions = await ShippingOption.find({});
            const shippingOptions = await ShippingOption.find().sort({ createdAt: 1 });
            if (!shippingOptions) {
                return res.status(404).json({ message: 'No shipping options found' });
            }
            return res.status(200).json({ message: 'Shipping options get successfully', data: shippingOptions });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }


    async updateShippingOption(req, res) {
        try {
            const shippingOption = await ShippingOption.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!shippingOption) {
                return res.status(404).json({ message: 'Shipping option not found' });
            }
            return res.status(200).json({ message: 'Shipping option updated successfully', data: shippingOption });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
}