
const stripe = require('../utils/stripeClient');

module.exports = class StripeController {


    /** Get Order List **/
    async createConnectedAccount(req, res) {
        try {
            const account = await stripe.accounts.create({
                type: 'express', // or 'custom' for full control
                country: 'UK',
                email: req?.user?.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            // Save account.id to MongoDB
            await User.findByIdAndUpdate(req.user._id, { stripeAccountId: account.id, });

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'https://yourfrontend.com/reauth',
                return_url: 'https://yourfrontend.com/dashboard',
                type: 'account_onboarding',
            });

            res.json({ url: accountLink.url });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

};