const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const supportTicketModel = require('../models/SupportTicket');
const supportTicketMsgModel = require('../models/SupportTicketMsg');
const { User } = require('../models');
const constants = require('../configs/constant');
const notificationService = require('./notificationService');



class SupportTicket {

    async loadMoreMessages(req, res) {
        try {
            const { id: ticketId } = req?.params;
            let { page = 1, limit = 10 } = req?.query;
            limit = Number(limit);
            page = Number(page);
            const totalCount = await supportTicketMsgModel.countDocuments({ ticket: ticketId });
            //console.log('totalCount', totalCount);
            const skip = (page - 1) * limit;

            const matchStage = { ticket: new mongoose.Types.ObjectId(String(ticketId)), };

            const messages = await supportTicketMsgModel.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sender',
                        foreignField: '_id',
                        as: 'sender_detail'
                    }
                },
                {
                    $unwind: {
                        path: '$sender_detail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: { createdAt: -1 } }, // Ensure newest-to-oldest before pagination
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        ticket: 1,
                        sender: 1,
                        sender_detail: {
                            _id: 1,
                            name: 1,
                        },
                        message: 1,
                        fileName: 1,
                        fileType: 1,
                        filePath: 1,
                        fileSize: 1,
                        createdAt: 1,
                    },
                },
            ]);

            //console.log('what we get in query and params', req?.params, req?.query);
            //console.log('messages', messages);

            // Format the response to match the `getChatByTicket` message structure
            const formattedMessages = messages
                .slice()
                .reverse() // Reverse again to oldest-to-newest
                .map((msg) => ({
                    message: msg.message,
                    time: msg.createdAt,
                    senderId: msg.sender,
                    sender_detail: msg.sender_detail,
                    fileType: msg?.fileType,
                    fileSize: msg?.fileSize,
                    filePath: msg?.filePath,
                    fileName: msg?.fileName,
                    msgStatus: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true,
                    },
                }));
            return {
                chats: formattedMessages,
                hasNextPageMessages: page * limit < totalCount,
                hasPrevPageMessages: page > 1

            };
        } catch (error) {
            throw { message: error?.message || 'Failed to load more tickets', statusCode: error?.statusCode || 500 };
        }
    }


    async loadMoreTickets(req) {
        try {
            let { page = 1, limit = 10, sort = { createdAt: -1 } } = req?.query;
            limit = Number(limit);
            page = Number(page);
            const totalCount = await supportTicketModel.countDocuments({ isDeleted: false, status: { $in: [1, 2, 3, 4, 5, 6, 7] } });
            //console.log('totalCount', totalCount);
            const skip = (page - 1) * limit;
            const matchStage = { isDeleted: false, status: { $in: [1, 2, 3, 4, 5, 6, 7] } };
            const roles = req?.user?.roles?.map((el) => el?.id);

            if (!roles?.includes(constants?.adminRole?.id)) {
                matchStage['sender'] = new mongoose.Types.ObjectId(String(req?.user?.id))
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'supportticketmsgs',
                        let: { ticketId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$ticket', '$$ticketId'] } } },
                            { $sort: { createdAt: -1 } },
                            { $limit: limit }
                        ],
                        as: 'supportticketmsgs_detail'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sender',
                        foreignField: '_id',
                        as: 'sender_detail'
                    }
                },
                {
                    $unwind: {
                        path: '$sender_detail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit }
            ];
            const tickets = await supportTicketModel.aggregate(pipeline);

            const docs = tickets.map(ticket => ({
                id: ticket._id,
                fullName: ticket.subject,
                role: 'Ticket',
                about: ticket.subject,
                avatar: ticket?.supportticketmsgs_detail?.[0]?.filePath || null,
                status: 'online'
            }));

            const chats = tickets.map(ticket => {
                const chatMessages = ticket.supportticketmsgs_detail
                    .slice()
                    .reverse() // To get oldest-to-newest order
                    .map(msg => ({
                        ticket: ticket._id,
                        message: msg.message,
                        time: msg.createdAt,
                        senderId: msg.sender,
                        sender_detail: {
                            _id: msg.sender,
                            name: msg?.sender_detail?.name
                        },
                        msgStatus: {
                            isSent: true,
                            isDelivered: true,
                            isSeen: true
                        }
                    }));

                return {
                    id: ticket._id,
                    userId: ticket._id, // Or replace with appropriate user/ticket reference
                    unseenMsgs: 0, // Add logic to calculate unseen if needed
                    chat: chatMessages

                };
            });

            return {
                contacts: docs, chats: chats, hasNextPage: page * limit < totalCount,
                hasPrevPage: page > 1,
            };
        } catch (error) {
            throw { message: error?.message || 'Failed to load more tickets', statusCode: error?.statusCode || 500 };
        }
    }

    async getChatByTicket(req) {
        try {
            let { page = 1, limit = 20 } = req.query;
            limit = Number(limit);
            page = Number(page);
            const skip = (page - 1) * limit;

            const matchStage = {
                isDeleted: false,
                status: { $in: [1, 2, 3, 4, 5, 6, 7] }
            };
            const matchStageMsg = {
            };



            const roles = req?.user?.roles?.map((el) => el?.id);

            if (!roles?.includes(constants?.adminRole?.id)) {
                matchStage['sender'] = new mongoose.Types.ObjectId(String(req?.user?.id))
            }

            // Get total count of tickets first
            const countResult = await supportTicketModel.aggregate([
                { $match: matchStage },
                { $count: 'total' }
            ]);
            const totalDocs = countResult[0]?.total || 0;

            // Add ticket ID from params if it exists
            if (req.params.id) {
                matchStage['_id'] = new mongoose.Types.ObjectId(req.params.id);
                matchStageMsg['ticket'] = new mongoose.Types.ObjectId(req.params.id);
            }

            const messageCountResult = await supportTicketMsgModel.aggregate([
                { $match: matchStageMsg },
                { $count: 'total' }
            ]);

            delete matchStage?._id;
            const totalMsgDocs = messageCountResult[0]?.total || 0;
            //console.log('totalMsgDocs', totalMsgDocs);
            //console.log('matchStageMsg', matchStageMsg);
            //console.log('matchStage', matchStage);

            const pipeline = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'supportticketmsgs',
                        let: { ticketId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$ticket', '$$ticketId'] } } },
                            { $sort: { createdAt: -1 } },
                            { $limit: limit },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'sender',
                                    foreignField: '_id',
                                    as: 'sender_detail'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$sender_detail',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    filePath: 1,
                                    message: 1,
                                    createdAt: 1,
                                    sender: 1,
                                    sender_detail: {
                                        _id: 1,
                                        name: 1,
                                        email: 1
                                    }
                                }
                            }
                        ],
                        as: 'supportticketmsgs_detail'
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: 'orderDetail'
                    }
                },
                { $unwind: { path: '$orderDetail', preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        _id: 1,
                        subject: 1,
                        sender: 1,
                        supportticketmsgs_detail: 1,
                        orderDetail:1
                    }
                },
                { $skip: skip },
                { $limit: Number(limit) }
            ];

            const tickets = await supportTicketModel.aggregate(pipeline);
            //console.log('tickets',tickets)

            const docs = tickets.map(ticket => ({
                id: ticket._id,
                fullName: ticket.subject,
                role: 'Ticket',
                about: ticket.subject,
                avatar: ticket?.supportticketmsgs_detail?.[0]?.filePath || null,
                orderDetail : ticket?.orderDetail,
                status: 'online'
            }));

            const profileUserData = req.user;
            const profileUser = {
                id: profileUserData?.id,
                avatar: profileUserData?.userImage || null,
                fullName: profileUserData?.name,
                role: profileUserData?.roleNames?.join(', ') || '',
                about:
                    profileUserData?.about ||
                    'Dessert chocolate cake lemon drops jujubes. Biscuit cupcake ice cream bear claw brownie brownie marshmallow.',
                status: 'online',
                settings: {
                    isTwoStepAuthVerificationEnabled:
                        profileUserData.isTwoFactorEnabled || false,
                    isNotificationsOn: profileUserData.isNotificationsOn ?? true
                }
            };

            const chats = tickets.map(ticket => {
                const chatMessages = ticket.supportticketmsgs_detail
                    .slice()
                    .reverse() // To get oldest-to-newest order
                    .map(msg => ({
                        message: msg.message,
                        ticket: ticket._id,
                        time: msg.createdAt,
                        senderId: msg.sender,
                        sender_detail: msg.sender_detail,
                        fileType: msg?.fileType,
                        fileSize: msg?.fileSize,
                        filePath: msg?.filePath,
                        fileName: msg?.fileName,
                        msgStatus: {
                            isSent: true,
                            isDelivered: true,
                            isSeen: true
                        }
                    }));

                return {
                    id: ticket._id,
                    userId: ticket._id,
                    unseenMsgs: 0,
                    chat: chatMessages
                };
            });

            // Calculate pagination values
            const totalPages = Math.ceil(totalDocs / limit);
            const totalMessagePages = Math.ceil(totalMsgDocs / limit);



            return {
                docs,
                profileUser,
                chats: chats,
                totalDocs,
                totalMsgDocs,
                limit,
                page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                hasNextPageMessages: page < totalMessagePages,
                hasPrevPageMessages: page > 1
            };
        } catch (error) {
            console.error('Error in getChatByTicket:', error);
            throw {
                message: error?.message || 'Failed to fetch support tickets',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async getChatByTicketold(req) {
        try {
            let { page = 1, limit = 20 } = req.query;
            limit = Number(limit);
            page = Number(page);
            const skip = (page - 1) * limit;

            const matchStage = {
                //...req.params,
                isDeleted: false,
                status: { $in: [1, 2, 3, 4, 5, 6, 7] }
            };

            const roles = req?.user?.roles?.map((el) => el?.id);

            if (!roles?.includes(constants?.adminRole?.id)) {
                matchStage['sender'] = new mongoose.Types.ObjectId(String(req?.user?.id))
            }



            const pipeline = [
                { $match: matchStage },

                {
                    $lookup: {
                        from: 'supportticketmsgs',
                        let: { ticketId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$ticket', '$$ticketId'] } } },
                            { $sort: { createdAt: -1 } },
                            { $limit: limit }, // Assuming you want the last message only

                            // Populate sender of message
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'sender',
                                    foreignField: '_id',
                                    as: 'sender_detail'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$sender_detail',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    filePath: 1,
                                    message: 1,
                                    createdAt: 1,
                                    sender: 1,
                                    sender_detail: {
                                        _id: 1,
                                        name: 1,
                                        email: 1
                                    }
                                }
                            }
                        ],
                        as: 'supportticketmsgs_detail'
                    }
                },

                { $sort: { createdAt: -1 } },

                {
                    $project: {
                        _id: 1,
                        subject: 1,
                        sender: 1,
                        supportticketmsgs_detail: 1 // includes sender_detail inside it
                    }
                },

                { $skip: skip },
                { $limit: Number(limit) }
            ];


            const tickets = await supportTicketModel.aggregate(pipeline);

            const docs = tickets.map(ticket => ({
                id: ticket._id,
                fullName: ticket.subject,
                role: 'Ticket',
                about: ticket.subject,
                avatar: ticket?.supportticketmsgs_detail?.[0]?.filePath || null,
                status: 'online'
            }));

            // Count total matching documents
            const countResult = await supportTicketModel.aggregate([
                { $match: matchStage },
                { $count: 'total' }
            ]);
            const totalDocs = countResult[0]?.total || 0;

            // count total matching message documents
            const countsupportTicketMsgModel = await supportTicketMsgModel.aggregate([
                { $match: matchStage },
                { $count: 'total' }
            ]);
            const totalMsgDocs = countsupportTicketMsgModel[0]?.total || 0;

            // Profile User
            const profileUserData = req.user;
            const profileUser = {
                id: profileUserData?.id,
                avatar: profileUserData?.userImage || null,
                fullName: profileUserData?.name,
                role: profileUserData?.roleNames?.join(', ') || '',
                about:
                    profileUserData?.about ||
                    'Dessert chocolate cake lemon drops jujubes. Biscuit cupcake ice cream bear claw brownie brownie marshmallow.',
                status: 'online',
                settings: {
                    isTwoStepAuthVerificationEnabled:
                        profileUserData.isTwoFactorEnabled || false,
                    isNotificationsOn: profileUserData.isNotificationsOn ?? true
                }
            };

            const chats = tickets.map(ticket => {
                const chatMessages = ticket.supportticketmsgs_detail
                    .slice()
                    .reverse() // To get oldest-to-newest order
                    .map(msg => ({
                        message: msg.message,
                        ticket: ticket._id,
                        time: msg.createdAt,
                        senderId: msg.sender,
                        sender_detail: msg.sender_detail,
                        msgStatus: {
                            isSent: true,
                            isDelivered: true,
                            isSeen: true
                        }
                    }));

                return {
                    id: ticket._id,
                    userId: ticket._id, // Or replace with appropriate user/ticket reference
                    unseenMsgs: 0, // Add logic to calculate unseen if needed
                    chat: chatMessages
                };
            });

            return {
                docs,
                profileUser,
                chats: chats, // You can fill this if needed
                totalDocs,
                totalMsgDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1,
                hasNextPageMessages: page * limit < totalMsgDocs,
                hasPrevPageMessages: page > 1
            };
        } catch (error) {
            console.error('Error in getChatByTicket:', error);
            throw {
                message: error?.message || 'Failed to fetch support tickets',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async uploadTicketFile(file, ticketId) {
        //console.log('file..............', file);
        const uploadDir = path.join(__dirname, '..', 'uploads', 'support-tickets', ticketId.toString());
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const ext = path.extname(file.originalname).toLowerCase();
        const fileType = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext) ? 'image' : 'docs';

        const timestampedName = `${Date.now()}_${file.originalname}`;
        const fullPath = path.join(uploadDir, timestampedName);

        fs.writeFileSync(fullPath, file.buffer);

        return {
            fileName: file.originalname,
            fileType,
            filePath: `/uploads/support-tickets/${ticketId}/${timestampedName}`,
            fileSize: file.size
        };
    }

    async saveTicket(req) {
        try {
            // //console.log('req.body', req.body);
            let { message, subject, status, order, issue_type } = req?.body;
            status = Number(status);
            issue_type = Number(issue_type);
            const sender = req?.user?.id || req?.user?._id;
            const ticketId = req?.method === 'PUT' ? req?.params?.id : null;

            const files = req?.files?.filter(file => file?.fieldname === 'ticketFile') || [];

            let ticketDoc;

            if (req?.method === 'POST') {

                if (!subject) {
                    const error = new Error('Subject is required for creating a ticket.');
                    error.statusCode = 422;
                    throw error;
                }

                const ticketNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const admin = await User.findOne({ roles: { $in: [String(constants?.adminRole?.id)] } });

                ticketDoc = new supportTicketModel({
                    sender: new mongoose.Types.ObjectId(String(sender)),
                    assignedTo: new mongoose.Types.ObjectId(String(admin?._id)),
                    order: order === 'null' ? null : new mongoose.Types.ObjectId(String(order)),
                    subject,
                    status,
                    issue_type,
                    message,
                    ticketNumber
                });

                await ticketDoc.save();

                const notification = await notificationService.notifyTicketCreation(ticketDoc, {
                    senderId: sender,
                    userId: constants.adminRole.id,
                    additionalUsers: [],
                    additionalRoles: [],
                    excludeUsers: []
                });
            } else if (req?.method === 'PUT') {
                ticketDoc = await supportTicketModel.findById(ticketId);
                if (!ticketDoc) {
                    const error = new Error('Ticket not found.');
                    error.statusCode = 404;
                    throw error;
                }
            }



            let fileData = {
                fileName: null,
                fileType: null,
                filePath: null,
                fileSize: 0
            };

            if (files.length > 0 && files[0]?.buffer) {
                fileData = await this.uploadTicketFile(files[0], ticketDoc._id);
            }

            const ticketMsg = new supportTicketMsgModel({
                ticket: ticketDoc._id,
                sender: new mongoose.Types.ObjectId(String(sender)),
                order: order === "null" ? null :  new mongoose.Types.ObjectId(String(order)),
                message,
                ...fileData
            });

            await ticketMsg.save();
            // await notificationService.notifyTicketCreation(ticketDoc);

            return {
                ticket: ticketDoc,
                message: ticketMsg
            };
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching support tickets',
                statusCode: error?.statusCode || 500
            };
        }
    }


    async buildSupportTicketListQuery(req) {
        const query = req.query;

        const conditionArr = [{ isDeleted: false }];
        const roles = req?.user?.roles?.map((el) => el?.id);

        if (!roles?.includes(constants?.adminRole?.id)) {
            conditionArr.push({ sender: new mongoose.Types.ObjectId(String(req?.user?.id)) })
        }

        // Normalize and validate status
        const status = Number(query.status);
        if (!isNaN(status) && [1, 2, 3, 4, 5, 6, 7].includes(status)) {
            conditionArr.push({ status });
        }

        // Add search condition if 'search_string' is provided and not empty
        if (query.search_string && query.search_string.trim() !== "") {
            const searchRegex = new RegExp(query.search_string.trim(), "i");
            conditionArr.push({
                $or: [
                    { subject: searchRegex },
                    { message: searchRegex },
                    { ticketNumber: searchRegex }
                ]
            });
        }

        // Build the final query
        if (conditionArr.length === 1) {
            return conditionArr[0];
        } else {
            return { $and: conditionArr };
        }
    }

    async supportList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const pipeline = [
                { $match: query },

                {
                    $facet: {
                        metadata: [
                            { $count: "totalDocs" }
                        ],
                        statusCounts: [
                            {
                                $group: {
                                    _id: "$status",
                                    count: { $sum: 1 }
                                }
                            }
                        ],

                        data: [
                            { $sort: sort },
                            { $skip: skip },
                            { $limit: limit },

                            // Lookup messages
                            {
                                $lookup: {
                                    from: 'supportticketmsgs',
                                    localField: '_id',
                                    foreignField: 'ticket',
                                    as: 'allMessages'
                                }
                            },


                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'sender',
                                    foreignField: '_id',
                                    as: 'sender_detail'
                                }
                            },

                            {
                                $unwind: "$sender_detail"
                            },

                            {
                                $lookup: {
                                    from: 'roles',
                                    localField: 'sender_detail.roles',
                                    foreignField: '_id',
                                    as: 'sender_roles'
                                }
                            },

                            // Filter only messages with a non-null filePath
                            {
                                $addFields: {
                                    supportticketmsgs: {
                                        $filter: {
                                            input: "$allMessages",
                                            as: "msg",
                                            cond: { $ne: ["$$msg.filePath", null] }
                                        }
                                    }
                                }
                            },

                            // Set supportticketmsgs to null if filtered array is empty
                            {
                                $addFields: {
                                    supportticketmsgs: {
                                        $cond: [
                                            { $eq: [{ $size: "$supportticketmsgs" }, 0] },
                                            null,
                                            {
                                                $let: {
                                                    vars: {
                                                        firstMsg: { $arrayElemAt: ["$supportticketmsgs", 0] }
                                                    },
                                                    in: {
                                                        _id: "$$firstMsg._id",
                                                        message: "$$firstMsg.message",
                                                        sender: "$$firstMsg.sender",
                                                        fileName: "$$firstMsg.fileName",
                                                        filePath: "$$firstMsg.filePath",
                                                        fileType: "$$firstMsg.fileType",
                                                        fileSize: "$$firstMsg.fileSize",
                                                        createdAt: "$$firstMsg.createdAt"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            },


                            {
                                $project: {
                                    subject: 1,
                                    ticketNumber: 1,
                                    issue_type: 1,
                                    message: 1,
                                    status: 1,
                                    createdAt: 1,
                                    updatedAt: 1,
                                    sender_detail: {
                                        _id: 1,
                                        name: 1
                                    },
                                    assignedTo: 1,
                                    order: 1,
                                    sender_roles: {
                                        _id: 1,
                                        name: 1,
                                    },
                                    supportticketmsgs: 1
                                }
                            }
                        ]
                    }
                },

                {
                    $project: {
                        data: 1,
                        totalDocs: { $ifNull: [{ $arrayElemAt: ["$metadata.totalDocs", 0] }, 0] },
                        statusCounts: 1
                    }
                }
            ];

            const [result] = await supportTicketModel.aggregate(pipeline);

            const statusSummary = result.statusCounts.reduce((acc, item) => {
                const statusMap = {
                    1: 'open',
                    2: 'closed',
                    3: 'pending',
                    4: 'in_progress',
                    5: 'resolved',
                    6: 'rejected',
                    7: 'cancelled'
                };
                const key = statusMap[item._id];
                if (key) acc[key] = item.count;
                return acc;
            }, {
                open: 0,
                closed: 0,
                pending: 0,
                in_progress: 0,
                resolved: 0,
                rejected: 0,
                cancelled: 0
            });

            return {
                docs: result.data,
                totalDocs: result.totalDocs,
                limit,
                page,
                totalPages: Math.ceil(result.totalDocs / limit),
                hasNextPage: page * limit < result.totalDocs,
                hasPrevPage: page > 1,
                nextPage: page * limit < result.totalDocs ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
                statusSummary
            };

        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching support tickets',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async sendChatMessage(req) {
        try {
            const { message } = req.body;
            const sender = req.user?.id || req.user?._id;
            const ticketId = req.params.id;

            // Get the ticket
            const ticket = await supportTicketModel.findOne({ _id: ticketId, isDeleted: false });
            if (!ticket) {
                throw { message: 'Ticket not found', statusCode: 404 };
            }

            // Handle file upload if present
            const files = req.files?.filter(file => file.fieldname === 'ticketFile') || [];
            let fileData = {
                fileName: null,
                fileType: null,
                filePath: null,
                fileSize: 0
            };

            if (files.length > 0 && files[0]?.buffer) {
                fileData = await this.uploadTicketFile(files[0], ticket._id);
            }

            // Create and save the message
            const ticketMsg = new supportTicketMsgModel({
                ticket: ticket._id,
                sender: new mongoose.Types.ObjectId(String(sender)),
                message,
                ...fileData
            });

            await ticketMsg.save();

            // Return formatted message
            return {
                message: ticketMsg.message,
                time: ticketMsg.createdAt,
                senderId: ticketMsg.sender,
                msgStatus: {
                    isSent: true,
                    isDelivered: true,
                    isSeen: true
                },
                ...(fileData.filePath && {
                    attachments: {
                        fileName: fileData.fileName,
                        filePath: fileData.filePath,
                        fileType: fileData.fileType,
                        fileSize: fileData.fileSize
                    }
                })
            };
        } catch (err) {
            throw {
                message: err.message || 'Unable to send chat message',
                statusCode: err.statusCode || 500
            };
        }
    }

}

module.exports = new SupportTicket();