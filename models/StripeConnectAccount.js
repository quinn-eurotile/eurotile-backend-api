// Importing mongoose
const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

// Define schema for Stripe Connect Account
const stripeConnectAccountSchema = new Schema({
    // Reference to the internal user in your system
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Stripe account ID returned by Stripe (e.g., acct_1XYZ...)
    stripeAccountId: {
      type: String,
      required: true,
      unique: true
    },

    // Type of Stripe Connect account
    accountType: {
      type: String,
      enum: ['standard', 'express', 'custom'],
      required: true,
      default: 'express'
    },

    // Onboarding status for the user
    isOnboardingCompleted: {
      type: Boolean,
      default: false
    },

    // Charges enabled flag from Stripe
    chargesEnabled: {
      type: Boolean,
      default: false
    },

    // Payouts enabled flag from Stripe
    payoutsEnabled: {
      type: Boolean,
      default: false
    },

    // Details about account capabilities
    capabilities: {
      cardPayments: { type: String, enum: ['active', 'inactive', 'pending'], default: 'inactive' },
      transfers: { type: String, enum: ['active', 'inactive', 'pending'], default: 'inactive' }
    },

    // Information about verification status
    verification: {
      status: { type: String, enum: ['verified', 'pending', 'unverified'], default: 'pending' },
      disabledReason: { type: String },
      dueBy: { type: Date }
    },

    // Detailed onboarding requirements
    requirements: {
      currentlyDue: [String],
      eventuallyDue: [String],
      pastDue: [String],
      pendingVerification: [String]
    },

    // Bank or external account ID linked
    externalAccountId: {
      type: String
    },

    // Business profile information
    businessProfile: {
      mcc: { type: String }, // Merchant Category Code
      url: { type: String }
    },

    // Whether the account is soft-deleted or restricted
    isDisabled: {
      type: Boolean,
      default: false
    },

    // Date when the account was last synced from Stripe
    lastSyncedAt: {
      type: Date
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
)

// Export the model
module.exports = mongoose.model('StripeConnectAccount', stripeConnectAccountSchema)
