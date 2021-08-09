import mongoose from 'mongoose';
import { Config } from '@app/config.class';
import { ArticleService } from '@article/article.service';
import { Logger } from '@common/logger/logger.class';
import { QueueManager } from '@queue-manager/queue-manager.class';
import { NlpService } from '@nlp/nlp.service';
import { LemmaService } from '@lemma/lemma.service';

import cron from 'node-cron';
import { Helpers } from '@common/helpers/helpers.namespace';

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
            await this.connectToDb();

            QueueManager.instance.initialize();

            // this.registerCronJobs();

            await this.lemmaService.test_response_time(Helpers.queries);
            process.exit(0);

            Logger.log('Application started, waiting for tasks');
        } catch (e) {
            Logger.error(e.message);
            process.exit(-1);
        }
    }

    private registerCronJobs(): void {
        // Register a cron job for fetching new articles
        cron.schedule('* * * * *', async () => await this.articleService.addArticleJobs());
        Logger.info('Registered cron job for receiving new articles');

        // Register a cron job for POSTagging articles
        cron.schedule('*/15 * * * *', async () => await this.nlpService.addTagJobs());
        Logger.info('Registered cron job for POSTagging Articles in db');

        // Register a cron job for creating manipulating lemmas to create inverted index
        cron.schedule('*/10 * * * *', async () => await this.lemmaService.addLemmaJobs());
        Logger.info('Registered cron job for creating Lemmas in db');

        // Register a cron job for updating the inverted index
        cron.schedule('*/5 * * * *', async () => await this.nlpService.createInvertedIndexJobs());
        Logger.info('Registered cron job for creating Inverted Index in db');
    }

    private async connectToDb(): Promise<void> {
        mongoose.connect(
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
    }

    private handleConnectionError(error: mongoose.CallbackError) {
        if (error) {
            Logger.error(error.message);
        }
    }
}
