import { Logger } from '@common/logger/logger.class';
import { BulkJobOptions, Queue, QueueEvents } from 'bullmq';

interface JobData {
    name: string;
    data: Record<string, string>;
    options?: BulkJobOptions;
}

export class QueueManager {
    public articleQueue: Queue;
    private articleEvents: QueueEvents;

    private static _queue_instance: QueueManager;

    private constructor() {}

    public static get instance(): QueueManager {
        if (!this._queue_instance) {
            this._queue_instance = new QueueManager();
        }

        return this._queue_instance;
    }

    public initializeQueues(): void {
        Logger.info('Initializing Article Queue');
        this.articleQueue = new Queue('Articles', {
            connection: {
                host: 'localhost',
            },
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });

        this.articleEvents = new QueueEvents('Articles', { connection: { host: 'localhost' } });

        this.subscribeToEvents();
    }

    public subscribeToEvents(): void {
        Logger.info('Subscribing to Article Queue events');
        this.articleEvents.on('drained', () => Logger.log('Articles Queue is empty'));
    }

    public async addArticleJobs(jobData: JobData[]): Promise<void> {
        await this.articleQueue.addBulk(jobData);
    }
}
