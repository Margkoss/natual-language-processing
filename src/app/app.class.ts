import mongoose from 'mongoose';
import { Config } from './config.class';
import { ArticleService } from '@article/article.service';
import { Logger } from '@common/logger/logger.class';
import { QueueManager } from './queue-manager/queue-manager.class';
import { NlpService } from './nlp/nlp.service';
import { LemmaService } from './lemma/lemma.service';

import cron from 'node-cron';

export class App {
    private readonly articleService: ArticleService;
    private readonly nlpService: NlpService;
    private readonly lemmaService: LemmaService;

    constructor() {
        this.articleService = new ArticleService();
        this.nlpService = new NlpService();
        this.lemmaService = new LemmaService();
    }

    public async bootstrap(): Promise<void> {
        try {
            await mongoose.connect(
                Config.getInstance().dbURI,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    useFindAndModify: false,
                },
                this.handleConnectionError
            );
            mongoose.Promise = global.Promise;

            await new Promise<void>((res, rej) => {
                mongoose.connection.on('connected', function () {
                    Logger.log('MongoDB connection established successfully');
                    res();
                });
            });

            // QueueManager.instance.initialize();

            // this.registerCronJobs();

            Logger.log('Application started, waiting for tasks');
            await this.lemmaService.createLemmas();
        } catch (e) {
            Logger.error(e.message);
            process.exit(-1);
        }
    }

    private registerCronJobs(): void {
        // Register a cron job for fetching new articles
        cron.schedule('*/30 * * * *', async () => {
            const urls = await this.articleService.getArticles();
            QueueManager.instance.addArticleJobs(
                urls.map((url, index) => {
                    return {
                        name: `job ${index}`,
                        data: url,
                    };
                })
            );

            Logger.log(`Added ${urls.length} article jobs`);
        });

        // Register a cron job for POSTagging articles

        // Register a cron job for creating manipulating lemmas to create inverted index
        Logger.info('Registered cron job for receiving new articles');
    }

    private handleConnectionError(error: mongoose.CallbackError) {
        if (error) {
            Logger.error(error.message);
        }
    }
}
