import mongoose from 'mongoose';
import { Config } from './config.class';
import { ArticleService } from '@article/article.service';
import { Logger } from '@common/logger/logger.class';
import { QueueManager } from './queue-manager/queue-manager.class';

import cron from 'node-cron';
import { NlpService } from './nlp/nlp.service';

export class App {
    private readonly articleService: ArticleService;
    private readonly nlpService: NlpService;

    constructor() {
        this.articleService = new ArticleService();
        this.nlpService = new NlpService();
    }

    public async bootstrap(): Promise<void> {
        try {
            const conn = await mongoose.connect(
                Config.getInstance().dbURI,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                },
                this.handleConnectionError
            );
            mongoose.Promise = global.Promise;

            // QueueManager.instance.initialize();

            // this.registerCronJobs();
            Logger.log('Application started, waiting for tasks');

            this.nlpService.tagPartOfSpeech();
        } catch (e) {
            Logger.error(e.message);
            process.exit(-1);
        }
    }

    private registerCronJobs(): void {
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
        Logger.info('Registered cron job for receiving new articles');
    }

    private handleConnectionError(error: mongoose.CallbackError) {
        if (error) {
            Logger.error(error.message);
        }
    }
}
