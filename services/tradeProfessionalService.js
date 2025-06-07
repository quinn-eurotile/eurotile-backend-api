const User = require('../models/User');
const userBusinessModel = require('../models/UserBusiness');
const userBusinessDocumentModel = require('../models/UserBusinessDocument');
const mongoose = require('mongoose');
const constants = require('../configs/constant');
const helpers = require("../_helpers/common");
const { Order } = require('../models');
const bcrypt = require("bcryptjs");
const stripe = require('../utils/stripeClient');
const { saveAddressData } = require('./addressService');
const StripeConnectAccount = require('../models/StripeConnectAccount');

class TradeProfessional {

    async processPayout(req) {
        try {
            const { amount } = req.body;
            console.log('amount',amount, typeof amount);
            const userId = req.user.id;
    
            // Get user's connect account
            const connectAccount = await StripeConnectAccount.findOne({ createdBy: userId });
            if (!connectAccount) {
                throw { message: 'Connect account not found', statusCode: 404 };
            }
    
            // Verify the account is ready for payouts
            if (!connectAccount.payoutsEnabled) {
                throw { message: 'Payouts are not enabled for this account', statusCode: 400 };
            }
    
            // Get eligible orders (status 4 and shipped 14+ days ago)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
            const eligibleOrders = await Order.find({
                createdBy: userId,
                orderStatus: 4,
                updatedAt: { $lte: fourteenDaysAgo },
                commission: { $gt: 0 }
            });
    
            // Calculate total eligible commission
            const totalEligibleCommission = eligibleOrders.reduce((sum, order) => sum + order.commission, 0);
    
            // Validate requested amount
            if (amount <= 0 || amount > totalEligibleCommission) {
                throw { message: 'Invalid payout amount', statusCode: 400 };
            }
    
            // Create transfer to connected account
            const transfer = await stripe.transfers.create({
                amount: Math.round(parseFloat(amount) * 100), // Convert to cents
                currency: 'eur',
                destination: connectAccount.stripeAccountId,
                description: 'Commission payout'
            });

            console.log('transfer',transfer);
    
            // Update orders to mark commission as paid
            // const ordersToUpdate = eligibleOrders.slice();
            // let remainingAmount = amount;
    
            // for (const order of ordersToUpdate) {
            //     if (remainingAmount <= 0) break;
    
            //     const commissionToPay = Math.min(order.commission, remainingAmount);
            //     remainingAmount -= commissionToPay;
    
            //     // Update order with paid commission amount
            //     await Order.findByIdAndUpdate(order._id, {
            //         $set: {
            //             commissionPaid: true,
            //             commissionPaidAmount: commissionToPay,
            //             commissionPaidAt: new Date(),
            //             commissionTransferId: transfer.id
            //         }
            //     });
            // }
    
            return {
                transferId: transfer.id,
                amount: amount,
                remainingCommission: totalEligibleCommission - amount
            };
    
        } catch (error) {
            throw {
                message: error.message || 'Failed to process payout',
                statusCode: error.statusCode || 500
            };
        }
    }


    /** Create Connect Account */
    async createConnectAccount(req) {
        try {
            const account = await stripe.accounts.create({
                country: 'GB',
                email: req?.user?.email,
                controller: {
                    fees: { payer: 'application' },
                    losses: { payments: 'application' },
                    stripe_dashboard: { type: 'express' }, // or 'none'
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            // Validate required fields from Stripe response
            if (!account.id) {
                throw new Error('Stripe account ID is missing from response');
            }

            if (!account.capabilities) {
                throw new Error('Stripe account capabilities are missing');
            }

            if (!account.controller?.stripe_dashboard?.type) {
                throw new Error('Stripe dashboard type is missing');
            }

            // Create local database entry with validation
            const connectAccount = new StripeConnectAccount({
                createdBy: req.user.id,
                stripeAccountId: account.id,
                accountType: account.controller.stripe_dashboard.type,
                chargesEnabled: !!account.charges_enabled,
                payoutsEnabled: !!account.payouts_enabled,
                isOnboardingCompleted: !!account.details_submitted,
                capabilities: {
                    cardPayments: account.capabilities.card_payments || 'inactive',
                    transfers: account.capabilities.transfers || 'inactive'
                },
                verification: {
                    status: account.verification?.status || 'pending',
                    disabledReason: account.verification?.disabled_reason
                },
                requirements: {
                    currentlyDue: account.requirements?.currently_due || [],
                    eventuallyDue: account.requirements?.eventually_due || [],
                    pastDue: account.requirements?.past_due || [],
                    pendingVerification: account.requirements?.pending_verification || []
                },
                businessType: account.business_type || 'individual',
                businessProfile: {
                    mcc: account.business_profile?.mcc,
                    url: account.business_profile?.url,
                    name: account.business_profile?.name,
                    supportEmail: account.business_profile?.support_email,
                    supportPhone: account.business_profile?.support_phone,
                    supportUrl: account.business_profile?.support_url
                },
                settings: account.settings ? {
                    bacsDebitPayments: account.settings.bacs_debit_payments ? {
                        displayName: account.settings.bacs_debit_payments.display_name,
                        serviceUserNumber: account.settings.bacs_debit_payments.service_user_number
                    } : undefined,
                    branding: account.settings.branding ? {
                        icon: account.settings.branding.icon,
                        logo: account.settings.branding.logo,
                        primaryColor: account.settings.branding.primary_color,
                        secondaryColor: account.settings.branding.secondary_color
                    } : undefined,
                    cardPayments: account.settings.card_payments ? {
                        statementDescriptorPrefix: account.settings.card_payments.statement_descriptor_prefix
                    } : undefined,
                    dashboard: account.settings.dashboard ? {
                        displayName: account.settings.dashboard.display_name,
                        timezone: account.settings.dashboard.timezone
                    } : undefined,
                    payments: account.settings.payments ? {
                        statementDescriptor: account.settings.payments.statement_descriptor
                    } : undefined,
                    payouts: account.settings.payouts ? {
                        debitNegativeBalances: account.settings.payouts.debit_negative_balances,
                        schedule: account.settings.payouts.schedule,
                        statementDescriptor: account.settings.payouts.statement_descriptor
                    } : undefined
                } : undefined,
                country: account.country,
                defaultCurrency: account.default_currency,
                detailsSubmitted: !!account.details_submitted,
                email: account.email,
                individual: account.individual ? {
                    id: account.individual.id,
                    created: account.individual.created
                } : undefined,
                externalAccounts: account.external_accounts ? {
                    totalCount: account.external_accounts.total_count,
                    hasMore: account.external_accounts.has_more,
                    data: account.external_accounts.data
                } : undefined,
                tosAcceptance: account.tos_acceptance ? {
                    date: account.tos_acceptance.date
                } : undefined,
                lastSyncedAt: new Date()
            });

            await connectAccount.save();

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${process.env.CLIENT_URL}/trade-professional/profile`,
                return_url: `${process.env.CLIENT_URL}/trade-professional/profile`,
                type: 'account_onboarding',
            });

            return accountLink;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to create Stripe Connect account',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async getStripeAccountStatus(req) {
        try {
            const userId = req?.user?.id;
            // Find the connected account in our database
            const connectAccount = await StripeConnectAccount.findOne({ createdBy: userId });
            if (!connectAccount) {
                return { success: false, message: 'No connected account found' };
            }

            // Retrieve fresh account details from Stripe
            const stripeAccount = await stripe.accounts.retrieve(connectAccount.stripeAccountId);

            // Update our database with latest status
            await StripeConnectAccount.findByIdAndUpdate(connectAccount._id, {
                chargesEnabled: stripeAccount.charges_enabled,
                payoutsEnabled: stripeAccount.payouts_enabled,
                isOnboardingCompleted: stripeAccount.details_submitted,
                capabilities: {
                    cardPayments: stripeAccount.capabilities?.card_payments || 'inactive',
                    transfers: stripeAccount.capabilities?.transfers || 'inactive'
                },
                requirements: {
                    currentlyDue: stripeAccount.requirements?.currently_due || [],
                    eventuallyDue: stripeAccount.requirements?.eventually_due || [],
                    pastDue: stripeAccount.requirements?.past_due || [],
                    pendingVerification: stripeAccount.requirements?.pending_verification || []
                },
                lastSyncedAt: new Date()
            });

            return {
                success: true,
                data: {
                    status: stripeAccount.payouts_enabled && stripeAccount.details_submitted  ? true : false,
                    stripe_account_id: stripeAccount.id,
                    details_submitted: stripeAccount.details_submitted,
                    charges_enabled: stripeAccount.charges_enabled,
                    payouts_enabled: stripeAccount.payouts_enabled,
                    requirements: stripeAccount.requirements
                }
            };
        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch clients',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async reVerifyStripeAccount(req) {
        try {
            const userId = req?.user?.id;
            // Find the connected account
            const connectAccount = await StripeConnectAccount.findOne({ createdBy: userId });
            if (!connectAccount) {
                return { success: false, message: 'No connected account found' };
            }

            // Create an account link for verification
            const accountLink = await stripe.accountLinks.create({
                account: connectAccount.stripeAccountId,
                refresh_url: `${process.env.CLIENT_URL}/trade-professional/profile`,
                return_url: `${process.env.CLIENT_URL}/trade-professional/profile`,
                type: 'account_onboarding',
                collect: 'eventually_due'
            });

            return {
                success: true,
                data: {
                    object: 'account_link',
                    url: accountLink.url
                }
            };
        } catch (error) {
            console.error('Error in reVerifyStripeAccount:', error);
            return { success: false, message: error.message };
        }
    }

    /** Get All Client For Specific Trade Professional */
    async allClient(req) {
        try {
            const clientRoleId = new mongoose.Types.ObjectId(String(constants?.clientRole?.id));
            const createdById = new mongoose.Types.ObjectId(String(req?.user?.id));

            const pipeline = [
                {
                    $match: {
                        isDeleted: false,
                        roles: { $in: [clientRoleId] },
                        createdBy: createdById
                    }
                },
                {
                    $lookup: {
                        from: 'addresses',
                        let: { userId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
                            { $match: { isDefault: true } },
                            { $limit: 1 }
                        ],
                        as: 'addressDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$addressDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users', // assuming createdBy refers to user
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                },
                {
                    $unwind: {
                        path: '$createdBy',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        addressDetails: 1,
                        status: 1,
                        userId: 1,
                        isDeleted: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        createdBy: {
                            _id: '$createdBy._id',
                            name: '$createdBy.name',
                            status: '$createdBy.status'
                        },
                        updatedBy: 1
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ];

            const clients = await User.aggregate(pipeline);
            return clients;

        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch clients',
                statusCode: error?.statusCode || 500
            };
        }
    }


    /** Save A Client */
    async saveClient(req) {
        try {
            const { name, email, phone, status, address } = req.body;
            const lowerCaseEmail = email.trim().toLowerCase();
            const id = req?.params?.id || null;

            let client;
            let isNew = false;

            if (id) {
                // Update existing client
                client = await User.findById(id);
                // console.log(client, 'pehle client');
                if (!client) throw { message: 'Client not found', statusCode: 404 };

                client.name = name ?? client.name;
                client.email = lowerCaseEmail ?? client.email;
                client.phone = phone ?? client.phone;
                client.status = status ?? client.status;
                client.updatedBy = req?.user?.id;
            } else {
                // Create new client
                const token = helpers.randomString(20);
                client = new User({
                    name,
                    email: lowerCaseEmail,
                    phone,
                    token,
                    status: status ?? 1,
                    roles: [new mongoose.Types.ObjectId(String(constants?.clientRole?.id))],
                    createdBy: req?.user?.id,
                    updatedBy: req?.user?.id,
                });
                isNew = true;
            }

            await saveAddressData(client?._id, address);

            await client.save();

            return { client, isNew };

        } catch (error) {

            console.error('Error saving client:', error);
            throw {
                message: error?.message || 'Error occurred while saving client',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Build Quert To Get Clients */
    async buildClientListQuery(req) {
        const query = req.query;
        const conditionArr = [
            { isDeleted: false, roles: { $in: [new mongoose.Types.ObjectId(String(constants?.clientRole?.id))] } }
        ];
        if (query.status !== undefined && query.status !== "") {
            conditionArr.push({ status: Number(query.status) });
        }

        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { email: new RegExp(query.search_string, "i") },
                    { name: new RegExp(query.search_string, "i") },
                    { phone: new RegExp(query.search_string, "i") },
                ],
            });
        }

        // Construct the final query
        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    /** Client List */
    async clientList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
            const pipeline = [
                { $match: query },

                {
                    $lookup: {
                        from: 'addresses',
                        let: { userId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
                            { $match: { isDefault: true } }, // or any filter to select the right one
                            { $limit: 1 }
                        ],
                        as: 'addressDetails'
                    }
                },
                { $unwind: { path: '$addressDetails', preserveNullAndEmptyArrays: true } },

                // Optional sort
                { $sort: sort },

                // Optional projection to only return required fields
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        addressDetails: 1,
                        status: 1,
                        userId: 1,
                        isDeleted: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        createdBy: 1,
                        updatedBy: 1,
                    }
                },
                // Pagination
                { $skip: skip },
                { $limit: limit }
            ];

            // Run aggregation
            const data = await User.aggregate(pipeline);

            // Get total count (for pagination meta)
            const totalCountAgg = await User.aggregate([
                { $match: query },
                { $count: 'total' }
            ]);
            const totalDocs = totalCountAgg[0]?.total || 0;

            // console.log('data', data);

            const result = {
                docs: data,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1
            };

            return result;

        } catch (error) {
            // console.log(error, 'error');
            throw {
                message: error?.message || 'Something went wrong while fetching supplier',
                statusCode: error?.statusCode || 500
            };
        }
    }




    /** Get Trade Professional List */
    async tradeProfessionalList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
            const pipeline = [
                { $match: query },

                // Example $lookup - adjust this according to your schema
                // Country lookup
                // {
                //     $lookup: {
                //         from: 'userbusinesses', // collection name (lowercase plural usually)
                //         localField: '_id',
                //         foreignField: 'createdBy',
                //         as: 'userbusinesses'
                //     }
                // },
                // { $unwind: { path: '$userbusinesses', preserveNullAndEmptyArrays: true } },

                // Optional sort
                { $sort: sort },

                // Optional projection to only return required fields
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        status: 1,
                        userId: 1,
                        isDeleted: 1,
                        lastLoginDate: 1,
                        userImage: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        createdBy: 1,
                        updatedBy: 1,
                        // Include only _id and name from each populated field
                        userbusinesses: 1,
                    }
                },
                // Pagination
                { $skip: skip },
                { $limit: limit }
            ];

            // Run aggregation
            const data = await User.aggregate(pipeline);

            // Get total count (for pagination meta)
            const totalCountAgg = await User.aggregate([
                { $match: query },
                { $count: 'total' }
            ]);
            const totalDocs = totalCountAgg[0]?.total || 0;

            const result = {
                docs: data,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1
            };

            return result;

        } catch (error) {
            // console.log(error, 'error');
            throw {
                message: error?.message || 'Something went wrong while fetching supplier',
                statusCode: error?.statusCode || 500
            };
        }
    }

    mapMimeType(mime) {
        // console.log(mime, 'mimemimemimemime');
        if (mime.includes('image')) return 'image';
        if (mime.includes('video')) return 'video';
        if (mime.includes('pdf')) return 'pdf';
        if (mime.includes('csv')) return 'csv';
        if (mime.includes('spreadsheet')) return 'spreadsheet';
        if (mime.includes('word')) return 'doc';
        if (mime.includes('excel') || mime.includes('vnd.ms-excel')) return 'xls';  // For Excel files (.xls, .xlsx)
        if (mime.includes('csv')) return 'csv';  // For CSV files
        return 'other';  // Default fallback
    }


    // Transaction Wrapper
    runTransaction = async (fn) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const result = await fn(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    };



    // File processing
    extractDocumentEntries = (files = {}, businessId, userId) => {
        const entries = [];

        const handleFiles = (fieldName, docType) => {
            (files?.[fieldName] || []).forEach(file => {
                if (!file.path) {
                    throw new Error(`File path not found for ${fieldName}`);
                }
                entries.push({
                    businessId,
                    type: file.mimetype.split('/')[0],
                    fileName: file.originalname,
                    fileType: this.mapMimeType(file.mimetype),
                    docType,
                    filePath: file.path,  // This will now be properly set
                    fileSize: file.size,
                    status: 2,
                    createdBy: userId,
                    updatedBy: userId,
                });
            });
        };

        handleFiles('business_documents', 'business_documents');
        handleFiles('registration_certificate', 'registration_certificate');
        handleFiles('trade_license', 'trade_license');
        handleFiles('proof_of_business', 'proof_of_business');

        return entries;
    };

    // Update Trade Professional
    updateTradeProfessional = async (req) => {

        return this.runTransaction(async (session) => {
            const userId = req.params.id;
            const {
                name,
                email,
                phone,
                status,
                address,
                business_name,
                business_email,
                business_phone,
                documents_to_remove, // Array of document IDs to remove
            } = req.body;



            // Step 1: Update User
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    name,
                    email,
                    phone,
                    status: status ?? 2,
                    addresses: typeof address === 'string' ? JSON.parse(address) : address,
                    updatedBy: req?.user?.id || null,
                },
                { new: true }
            );


            if (!user) throw { message: 'User not found', statusCode: 404 };

            // Step 2: Update Business
            const business = await userBusinessModel.findOneAndUpdate(
                { createdBy: userId },
                {
                    name: business_name,
                    email: business_email,
                    phone: business_phone,
                    updatedBy: user._id,
                },
                { new: true, session }
            );

            if (!business) throw { message: 'Business not found', statusCode: 404 };

            // Step 3: Remove old documents if specified
            if (documents_to_remove && documents_to_remove.length > 0) {
                // Convert string IDs to ObjectIds
                const documentIds = Array.isArray(documents_to_remove)
                    ? documents_to_remove.map(id => new mongoose.Types.ObjectId(id))
                    : JSON.parse(documents_to_remove).map(id => new mongoose.Types.ObjectId(id));

                // First, get the documents to be removed
                const docsToRemove = await userBusinessDocumentModel.find({
                    _id: { $in: documentIds },
                    businessId: business._id
                }, null, { session });

                // Store file paths for cleanup
                const filesToDelete = docsToRemove.map(doc => doc.filePath);

                // Remove documents from database
                await userBusinessDocumentModel.deleteMany({
                    _id: { $in: documentIds },
                    businessId: business._id
                }, { session });

                // Delete physical files after transaction commits
                session.addListener('afterCommit', async () => {
                    for (const filePath of filesToDelete) {
                        try {
                            await fs.unlink(filePath);
                        } catch (error) {
                            console.error(`Failed to delete file ${filePath}:`, error);
                        }
                    }
                });
            }

            // Step 4: Handle New Document Uploads
            if (req.files && Object.keys(req.files).length > 0) {
                const documentEntries = this.extractDocumentEntries(req.files, business._id, user._id);
                if (documentEntries.length > 0) {
                    await userBusinessDocumentModel.insertMany(documentEntries, { session });
                }
            }

            return user;
        });
    };

    // Main function
    createTradeProfessional = async (req) => {
        return this.runTransaction(async (session) => {
            const {
                name,
                email,
                phone,
                status,
                password,
                accept_term,
                business_name,
                business_email,
                business_phone,
                address
            } = req.body;

            const genSalt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, genSalt); // Hash the password

            const token = helpers.randomString(20);

            // Step 1: Create User
            const [user] = await User.create([{
                name,
                email,
                phone,
                password: hashedPassword,
                token,
                addresses: address,
                accept_term: accept_term ?? 0,
                roles: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))],
                status: status ?? 2,
                createdBy: req?.user?.id || null,
                updatedBy: req?.user?.id || null,
            }], { session });

            if (!user) throw { message: 'Failed to create user', statusCode: 500 };

            // Step 2: Create Business
            const [business] = await userBusinessModel.create([{
                name: business_name,
                email: business_email,
                phone: business_phone,
                status: 2,
                createdBy: user._id,
                updatedBy: user._id,
            }], { session });

            // Step 3: Process Uploaded Files
            const documentEntries = this.extractDocumentEntries(req.files, business._id, user._id);

            if (documentEntries.length > 0) {
                await userBusinessDocumentModel.insertMany(documentEntries, { session });
            }

            return user;
        });
    };


    /** Build Quert To Get Trade Professional */
    async buildTradeProfessionalListQuery(req) {
        const query = req.query;
        const conditionArr = [
            { isDeleted: false, roles: { $in: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))] } }
        ];
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: { $in: [1, 3] } });
            } else if (query.status === "2" || query.status === 2) {
                conditionArr.push({ status: 2 });
            }
        }


        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { email: new RegExp(query.search_string, "i") },
                    { name: new RegExp(query.search_string, "i") },
                    { phone: new RegExp(query.search_string, "i") },
                ],
            });
        }

        // Construct the final query
        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    /** Soft Delete Trade Professional */
    async softDeleteTradeProfessional(userId) {
        try {
            // const isUserAssignToCase = await caseModal.findOne({ case_team: { $in: [userId] } });
            // if (isUserAssignToCase) throw new Error("User is already assigned to another case");
            // Find the user and update the `deleted_at` field

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw {
                    message: 'Invalid supplier ID',
                    statusCode: 400
                };
            }
            const tradeProfessionaler = await User.findById({ _id: userId });
            if (!tradeProfessionaler) throw new Error({ message: 'Trade professional not found', statusCode: 404 });
            tradeProfessionaler.isDeleted = true;
            await tradeProfessionaler.save();
            return true;
        } catch (error) {
            throw { message: error?.message || 'Something went wrong while fetching users', statusCode: error?.statusCode || 500 };
        }
    }

    /** Get Trade Professional By Id with specific columns */
    async getTradeProfessionalById(id) {
        return await User.findOne(
            {
                _id: id,
                roles: { $in: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))] }
            }
        )
            .select('name email phone status addresses createdAt updatedAt userImage') // Select specific columns from User
            .populate({
                path: 'roles',
                select: '_id name' // Select specific columns from Role
            })
            .populate({
                // Get business information
                path: 'business',
                select: 'name email phone status createdAt updatedAt',
                options: { lean: true },
                foreignField: 'createdBy',
                localField: '_id',
                justOne: true,
                model: 'UserBusiness'
            })
            .populate({
                // Get business documents
                path: 'documents',
                select: 'fileName fileType docType filePath status createdAt',
                options: { lean: true },
                foreignField: 'createdBy',
                localField: '_id',
                model: 'UserBusinessDocument'
            })
            .lean(); // Convert to plain JavaScript object for better performance
    }


    async getDashboardData(req) {
        try {
            const userId = req?.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User ID not found' });
            }

            // Fetch user info with userBusinesses populated
            const user = await User.findById(userId).populate('business').select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Aggregate order status counts
            const orderStatusSummary = await Order.aggregate([
                { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: "$orderStatus",
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Map orderStatus number to label
            const statusLabels = { 1: "pending", 2: "processing", 3: "shipped", 4: "delivered", 5: "cancelled" };

            // Initialize all counts as 0
            const formattedSummary = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };

            // Fill in actual counts from aggregation
            orderStatusSummary.forEach(item => {
                const label = statusLabels[item._id];
                if (label) {
                    formattedSummary[label] = item.count;
                }
            });

            return {
                user,
                statusSummary: formattedSummary // fallback in case no orders
            };
        } catch (error) {
            throw { message: error?.message || 'Something went wrong while fetching data', statusCode: error?.statusCode || 500 };
        }
    }



}

module.exports = new TradeProfessional();