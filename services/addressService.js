const Address = require('../models/Address');
const mongoose = require("mongoose");

/**
 * Get all active addresses for a user (can be trade professional ordering for someone else)
 */
async function getAddressesByUser(userId) {
	try {
		const addresses = await Address.find({ userId, isDeleted: false }).exec();
		return addresses;
	} catch (error) {
		throw {
			message: error?.message || 'Failed to fetch addresses',
			statusCode: error?.statusCode || 500
		};
	}
}


/**
 * Create or update an address for a user
 */
async function saveAddressData(userId, addressData) {
	try {
		const isUpdating = !!addressData?._id;
		let address;
		if (isUpdating) {
			address = await Address.findOne({
				_id:  new mongoose.Types.ObjectId(String(addressData._id)),
				userId : new mongoose.Types.ObjectId(String(userId)),
				isDeleted: false
			});
			if (!address) throw { message: 'Address not found', statusCode: 404 };
			Object.assign(address, addressData);
		} else {
			address = new Address({ userId, ...addressData });
		}

		if (addressData.isDefault) {
			await Address.updateMany(
				{ userId, _id: { $ne: address._id } },
				{ $set: { isDefault: false } }
			);
		}

		await address.save();
		return address;

	} catch (error) {
		throw {
			message: error?.message || 'Failed to save address',
			statusCode: error?.statusCode || 500
		};
	}
}


/**
 * Update an address for a user (no creation)
 */
async function updateAddressData(userId, addressData) {
	try {
		if (!addressData?._id) {
			throw { message: 'Address ID is required for updating', statusCode: 400 };
		}

		const address = await Address.findOne({ _id: addressData._id, userId, isDeleted: false });

		if (!address) {
			throw { message: 'Address not found', statusCode: 404 };
		}

		Object.assign(address, addressData);

		if (addressData.isDefault) {
			await Address.updateMany(
				{ userId, _id: { $ne: address._id } },
				{ $set: { isDefault: false } }
			);
		}

		await address.save();
		return address;

	} catch (error) {
		throw {
			message: error?.message || 'Failed to update address',
			statusCode: error?.statusCode || 500
		};
	}
}


/**
 * Soft delete address
 */
async function deleteData(userId, addressId) {
	try {
		const address = await Address.findOne({ _id: addressId, userId, isDeleted: false });

		if (!address) {
			throw { message: 'Address not found', statusCode: 404 };
		}

		address.isDeleted = true;
		await address.save();

		return address;

	} catch (error) {
		throw {
			message: error?.message || 'Failed to delete address',
			statusCode: error?.statusCode || 500
		};
	}
}


module.exports = { getAddressesByUser, saveAddressData, deleteData, updateAddressData };
