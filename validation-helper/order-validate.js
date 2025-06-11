const { orderStatusOptions } = require('../configs/constant');

const validateSupplierOrderStatus = (status, notes) => {
    if (!status) {
        return 'Status is required';
    }

    if (!orderStatusOptions.map(opt => opt.value).includes(status)) {
        return 'Invalid status value';
    }

    if (notes && typeof notes !== 'string') {
        return 'Notes must be a string';
    }

    if (notes && notes.length > 500) {
        return 'Notes cannot exceed 500 characters';
    }

    return null;
};

module.exports = {
    validateSupplierOrderStatus
}; 