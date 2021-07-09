import mongoose from 'mongoose';
import { Config } from './config.class';
import { ArticleService } from '@article/article.service';
import { Logger } from '@common/logger/logger.class';
import cron from 'node-cron';

export class App {
    private readonly articleService: ArticleService;

    constructor() {
        this.articleService = new ArticleService();
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

            this.registerCronJobs();
            Logger.log('Application started, waiting for tasks');
        } catch (e) {
            Logger.error(e.message);
            process.exit(-1);
        }
    }

    private registerCronJobs(): void {
        cron.schedule('0 */5 * * *', this.articleService.getArticles);
        Logger.info('Registered cron job for receiving new articles');
    }

    private handleConnectionError(error: mongoose.CallbackError) {
        if (error) {
            Logger.error(error.message);
        }
    }
}
