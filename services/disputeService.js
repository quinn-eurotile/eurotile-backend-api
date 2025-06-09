const Dispute = require('../models/Dispute');
const ChatThread = require('../models/ChatThread');
const mongoose = require('mongoose');
const constants = require('../configs/constant');

class DisputeService {
    async saveDispute(req) {
        try {
            const { order, issueType, description, attachments } = req.body;
            
            // Create a new chat thread for the dispute
            const chatThread = new ChatThread({
                participants: [req.user.id],
                type: 'DISPUTE',
                createdBy: req.user.id
            });
            await chatThread.save();

            // Create the dispute
            const dispute = new Dispute({
                order,
                tradeProfessional: req.user.id,
                issueType,
                description,
                attachments: attachments || [],
                chatThread: chatThread._id,
                createdBy: req.user.id
            });

            await dispute.save();

            return dispute;
        } catch (error) {
            throw {
                message: error?.message || 'Error creating dispute',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async buildDisputeListQuery(req) {
        const query = req.query;
        const conditionArr = [
            {
                tradeProfessional: new mongoose.Types.ObjectId(String(req.user.id)),
                isDeleted: false,
            },
        ];

        if (query.status !== undefined) {
            conditionArr.push({ status: Number(query.status) });
        }

        if (query.issueType !== undefined) {
            conditionArr.push({ issueType: query.issueType });
        }

        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { description: new RegExp(query.search_string, "i") },
                ],
            });
        }

        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    async disputeList(query, options) {
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
                            {
                                $lookup: {
                                    from: 'orders',
                                    localField: 'order',
                                    foreignField: '_id',
                                    as: 'orderDetails'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'chatthreads',
                                    localField: 'chatThread',
                                    foreignField: '_id',
                                    as: 'chatThreadDetails'
                                }
                            },
                            {
                                $project: {
                                    order: 1,
                                    issueType: 1,
                                    description: 1,
                                    attachments: 1,
                                    status: 1,
                                    createdAt: 1,
                                    orderDetails: { $arrayElemAt: ['$orderDetails', 0] },
                                    chatThreadDetails: { $arrayElemAt: ['$chatThreadDetails', 0] }
                                }
                            }
                        ]
                    }
                }
            ];

            const [result] = await Dispute.aggregate(pipeline);

            const statusSummary = result.statusCounts.reduce((acc, item) => {
                const statusMap = { 0: 'pending', 1: 'in_progress', 2: 'resolved', 3: 'closed' };
                const key = statusMap[item._id];
                if (key) acc[key] = item.count;
                return acc;
            }, { pending: 0, in_progress: 0, resolved: 0, closed: 0 });

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
                message: error?.message || 'Error fetching disputes',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async getDisputeById(id) {
        try {
            const dispute = await Dispute.findById(id)
                .populate('order')
                .populate('tradeProfessional', 'name email')
                .populate('assignedTo', 'name email')
                .populate('chatThread');

            if (!dispute) {
                throw {
                    message: 'Dispute not found',
                    statusCode: 404
                };
            }

            return dispute;
        } catch (error) {
            throw {
                message: error?.message || 'Error fetching dispute',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async updateDisputeStatus(req) {
        try {
            const { id } = req.params;
            const { status, resolution } = req.body;

            const dispute = await Dispute.findByIdAndUpdate(
                id,
                { 
                    status,
                    resolution,
                    updatedBy: req.user.id
                },
                { new: true }
            );

            if (!dispute) {
                throw {
                    message: 'Dispute not found',
                    statusCode: 404
                };
            }

            return dispute;
        } catch (error) {
            throw {
                message: error?.message || 'Error updating dispute status',
                statusCode: error?.statusCode || 500
            };
        }
    }
}

module.exports = new DisputeService(); 