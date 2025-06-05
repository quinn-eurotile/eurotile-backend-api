const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentDetailSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order' },

  id: { type: String, required: true }, // payment_intent id
  object: { type: String },             // should be 'payment_intent'
  amount: { type: Number, required: true },
  amount_received: { type: Number, default: 0 },
  amount_capturable: { type: Number, default: 0 },
  amount_details: Schema.Types.Mixed,

  application: { type: String, default: null },
  application_fee_amount: { type: Number, default: null },

  automatic_payment_methods: {
    allow_redirects: { type: String },
    enabled: { type: Boolean }
  },

  canceled_at: { type: Date, default: null },
  cancellation_reason: { type: String, default: null },
  capture_method: { type: String },
  client_secret: { type: String, required: true },
  confirmation_method: { type: String },
  created: { type: Number }, // Stripe timestamp (UNIX)

  currency: { type: String, required: true },
  customer: { type: String, default: null },
  description: { type: String, default: null },
  last_payment_error: Schema.Types.Mixed,
  latest_charge: { type: String, default: null },

  livemode: { type: Boolean },
  metadata: { type: Map, of: String },

  next_action: Schema.Types.Mixed,
  on_behalf_of: { type: String, default: null },

  payment_method: { type: String, default: null },
  payment_method_configuration_details: {
    id: { type: String },
    parent: { type: String, default: null }
  },

  payment_method_options: Schema.Types.Mixed,
  payment_method_types: [{ type: String }],

  processing: Schema.Types.Mixed,
  receipt_email: { type: String, default: null },
  review: { type: String, default: null },
  setup_future_usage: { type: String },
  shipping: Schema.Types.Mixed,
  source: { type: String, default: null },

  statement_descriptor: { type: String, default: null },
  statement_descriptor_suffix: { type: String, default: null },
  status: {
    type: String,
    enum: [
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'succeeded',
      'canceled'
    ],
    required: true
  },

  transfer_data: Schema.Types.Mixed,
  transfer_group: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentDetail', paymentDetailSchema);
