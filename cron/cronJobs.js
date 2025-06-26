const cron = require('node-cron');
const commonService = require('../services/commonService');


const cronJobs = [
    {
        name: 'Update Order Status: New → Pending (after 24 hours)',
        schedule: '*/5 * * * *', // every 5 minutes
        job: async () => {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const updated = await commonService.updateStatusByQuery(
                'Order',
                {
                    orderStatus: 3,
                    shippedAt: { $lt: twentyFourHoursAgo }
                },
                { orderStatus: 5 }
            );
            console.log(`[CRON] Updated ${updated.modifiedCount} orders from 'New' to 'Pending'`);
        }
    },

    {
        name: 'Expire promotions after endDate',
        schedule: '*/10 * * * *', // every 10 minutes
        job: async () => {
            const now = new Date();
            const result = await commonService.updateStatusByQuery(
                'Promotion',
                {
                    endDate: { $lt: now },
                    status: { $in: ['active', 'scheduled'] },
                    isDeleted: false
                },
                {
                    status: 'expired',
                    updatedAt: now
                }
            );

            console.log(`[CRON] Marked ${result.modifiedCount} promotions as expired`);
        }
    },
];

// Register all cron jobs
cronJobs.forEach(({ name, schedule, job }) => {
    console.log('run crone', name, schedule, job)
    cron.schedule(schedule, async () => {
        try {
            console.log(`[CRON START] ${name}`);
            await job();
            console.log(`[CRON SUCCESS] ${name}`);
        } catch (err) {
            console.error(`[CRON FAILED] ${name}:`, err);
        }
    });
});
