const tradeProfessionalModel = require('../models/User');
const userBusinessModel = require('../models/UserBusiness');
const userBusinessDocumentModel = require('../models/UserBusinessDocument');
const mongoose = require('mongoose');
const constants = require('../configs/constant');
const helpers = require("../_helpers/common");

class TradeProfessional {

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
            const data = await tradeProfessionalModel.aggregate(pipeline);

            // Get total count (for pagination meta)
            const totalCountAgg = await tradeProfessionalModel.aggregate([
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
            console.log(error, 'error');
            throw {
                message: error?.message || 'Something went wrong while fetching supplier',
                statusCode: error?.statusCode || 500
            };
        }
    }

    mapMimeType(mime) {
        console.log(mime,'mimemimemimemime')
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
            const user = await tradeProfessionalModel.findByIdAndUpdate(
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
            const [user] = await tradeProfessionalModel.create([{
                name,
                email,
                phone,
                password: hashedPassword,
                token,
                addresses:address,
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
                conditionArr.push({ status: { $in: [1, 3] } })
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
            const tradeProfessionaler = await tradeProfessionalModel.findById({ _id: userId });
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
        return await tradeProfessionalModel.findOne(
            {
                _id: id,
                roles: { $in: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))] }
            }
        )
            .select('name email phone status addresses createdAt updatedAt') // Select specific columns from User
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



}

module.exports = new TradeProfessional();