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

    // Detailed onboarding requirements
    requirements: {
      currentlyDue: [String],
      eventuallyDue: [String],
      pastDue: [String],
      pendingVerification: [String]
    },

    

    // Business type (individual, company, etc.)
    businessType: {
      type: String,
      enum: ['individual', 'company', 'non_profit', 'government_entity'],
      required: true
    },

    // Business profile information
    businessProfile: {
      mcc: { type: String }, // Merchant Category Code
      url: { type: String },
      name: { type: String },
      annualRevenue: { type: Number },
      estimatedWorkerCount: { type: Number },
      supportAddress: { type: Object },
      supportEmail: { type: String },
      supportPhone: { type: String },
      supportUrl: { type: String }
    },

    // Account settings
    settings: {
      bacsDebitPayments: {
        displayName: { type: String },
        serviceUserNumber: { type: String }
      },
      branding: {
        icon: { type: String },
        logo: { type: String },
        primaryColor: { type: String },
        secondaryColor: { type: String }
      },
      cardPayments: {
        statementDescriptorPrefix: { type: String },
        statementDescriptorPrefixKanji: { type: String },
        statementDescriptorPrefixKana: { type: String }
      },
      dashboard: {
        displayName: { type: String },
        timezone: { type: String }
      },
      payments: {
        statementDescriptor: { type: String },
        statementDescriptorKana: { type: String },
        statementDescriptorKanji: { type: String }
      },
      payouts: {
        debitNegativeBalances: { type: Boolean },
        schedule: { type: Object },
        statementDescriptor: { type: String }
      }
    },

    // Account details
    country: { type: String },
    defaultCurrency: { type: String },
    detailsSubmitted: { type: Boolean },
    email: { type: String },

    // Individual or company information
    individual: {
      id: { type: String },
      created: { type: Number }
    },

    // External accounts (bank accounts, debit cards)
    externalAccounts: {
      totalCount: { type: Number },
      hasMore: { type: Boolean },
      data: [{ type: Object }]
    },

    // Terms of service acceptance
    tosAcceptance: {
      date: { type: Number }
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
