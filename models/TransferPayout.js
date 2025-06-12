const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const transferPayoutSchema = new mongoose.Schema({
    transferId: {
        type: String,
        required: true,
        unique: true
    },
    object: {
        type: String,
        default: 'transfer'
    },
    amount: {
        type: Number,
        required: true
    },
    amountReversed: {
        type: Number,
        default: 0
    },
    balanceTransaction: {
        type: String
    },
    created: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    destination: {
        type: String,
        required: true
    },
    destinationPayment: {
        type: String
    },
    livemode: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    reversals: {
        object: {
            type: String,
            default: 'list'
        },
        data: [{
            type: mongoose.Schema.Types.Mixed
        }],
        hasMore: {
            type: Boolean,
            default: false
        },
        totalCount: {
            type: Number,
            default: 0
        },
        url: String
    },
    reversed: {
        type: Boolean,
        default: false
    },
    sourceTransaction: {
        type: String,
        default: null
    },
    sourceType: {
        type: String
    },
    transferGroup: {
        type: String
    },
    createdBy: { type: Schema.Types.ObjectId, refPath: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, refPath: 'User', required: true },
}, {
    timestamps: true
});

// Create index on transferId for faster queries
transferPayoutSchema.index({ transferId: 1 });

transferPayoutSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('TransferPayout', transferPayoutSchema);