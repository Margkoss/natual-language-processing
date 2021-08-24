import { BaseManager } from '@common/interfaces/manager.base';
import { Logger } from '@common/logger/logger.class';
import { Config } from '@app/config.class';
import { BulkJobOptions, Job, Queue, QueueEvents } from 'bullmq';
import chalk from 'chalk';

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

    public trainQueue: Queue;
    private trainEvents: QueueEvents;

    private host: string = Config.instance.cacheHost;

    private static _queue_instance: QueueManager;

    private constructor() {}

    public static get instance(): QueueManager {
        if (!this._queue_instance) {
            this._queue_instance = new QueueManager();
        }

        return this._queue_instance;
    }

    public async initialize(): Promise<void> {
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
        await this.articleQueue.drain();

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
        await this.tagQueue.drain();

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
        await this.lemmaQueue.drain();
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

        await this.indexQueue.drain();

        this.indexEvents = new QueueEvents('Invers Index', { connection: { host: this.host } });

        Logger.info('Initializing Training Queue');
        this.trainQueue = new Queue('Training', {
            connection: {
                host: this.host,
            },
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: true,
            },
        });
        await this.trainQueue.drain();
        this.trainEvents = new QueueEvents('Training', { connection: { host: this.host } });

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
        this.indexEvents.on('drained', () => Logger.log('Training Queue is empty'));
        Logger.info('Subscribing to Training Queue events');
        this.trainEvents.on('drained', () => Logger.log('Training is empty'));
        this.trainEvents.on('completed', (job: any) => Logger.log(`Finished documents job: ${chalk.bold(job.jobId)}`));
    }

    public async drainQueues(): Promise<void> {
        await this.articleQueue.drain();
        await this.tagQueue.drain();
        await this.trainQueue.drain();
        await this.indexQueue.drain();
        await this.lemmaQueue.drain();
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

    public async addTrainingJobs(jobData: JobData[]): Promise<void> {
        await this.trainQueue.addBulk(jobData);
    }
}
