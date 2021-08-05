import { BaseManager } from '@common/interfaces/manager.base';
import { Logger } from '@common/logger/logger.class';
import { Config } from '@app/config.class';
import { BulkJobOptions, Queue, QueueEvents } from 'bullmq';

interface JobData {
    name: string;
    data: Record<string, string>;
    options?: BulkJobOptions;
}

export class QueueManager implements BaseManager {
    public articleQueue: Queue;
    private articleEvents: QueueEvents;

    public tagQueue: Queue;
    private tagEvents: QueueEvents;

    public lemmaQueue: Queue;
    private lemmaEvents: QueueEvents;

    public indexQueue: Queue;
    private indexEvents: QueueEvents;

    private host: string = Config.getInstance().cacheHost;

    private static _queue_instance: QueueManager;

    private constructor() {}

    public static get instance(): QueueManager {
        if (!this._queue_instance) {
            this._queue_instance = new QueueManager();
        }

        return this._queue_instance;
    }

    public initialize(): void {
        Logger.info('Initializing Article Queue');
        this.articleQueue = new Queue('Articles', {
            connection: {
                host: this.host,
            },
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });

        this.articleEvents = new QueueEvents('Articles', { connection: { host: this.host } });

        Logger.info('Initializing Tagging Queue');
        this.tagQueue = new Queue('Tags', {
            connection: {
                host: this.host,
            },
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });

        this.tagEvents = new QueueEvents('Tags', { connection: { host: this.host } });

        Logger.info('Initializing Lemma Queue');
        this.lemmaQueue = new Queue('Lemmas', {
            connection: {
                host: this.host,
            },
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });

        this.lemmaEvents = new QueueEvents('Lemmas', { connection: { host: this.host } });

        Logger.info('Initializing Inverse Index Queue');
        this.indexQueue = new Queue('Inverse Index', {
            connection: {
                host: this.host,
            },
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });

        this.indexEvents = new QueueEvents('Invers Index', { connection: { host: this.host } });

        this.subscribeToEvents();
    }

    public subscribeToEvents(): void {
        Logger.info('Subscribing to Article Queue events');
        this.articleEvents.on('drained', () => Logger.log('Articles Queue is empty'));
        Logger.info('Subscribing to Tag Queue events');
        this.tagEvents.on('drained', () => Logger.log('Tags Queue is empty'));
        Logger.info('Subscribing to Lemma Queue events');
        this.lemmaEvents.on('drained', () => Logger.log('Lemmas Queue is empty'));
        Logger.info('Subscribing to Inverse Index Queue events');
        this.indexQueue.on('drained', () => Logger.log('Lemmas Queue is empty'));
    }

    public async addArticleJobs(jobData: JobData[]): Promise<void> {
        await this.articleQueue.addBulk(jobData);
    }

    public async addTaggingJobs(jobData: JobData[]): Promise<void> {
        await this.tagQueue.addBulk(jobData);
    }

    public async addLemmaJobs(jobData: JobData[]): Promise<void> {
        await this.lemmaQueue.addBulk(jobData);
    }

    public async addInverseIndexJobs(jobData: JobData[]): Promise<void> {
        await this.indexQueue.addBulk(jobData);
    }
}
