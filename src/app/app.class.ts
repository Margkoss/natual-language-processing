import mongoose from 'mongoose';
import { Config } from './config.class';
import { ArticleService } from '@article/article.service';
import { Logger } from '@common/logger/logger.class';

export class App {
    constructor() {}

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

            Logger.log('Succesfully connected to mongo');

            const asrvc = new ArticleService();

            await asrvc.getArticles();
        } catch (e) {
            Logger.error(e.message);
            process.exit(-1);
        }
    }

    private handleConnectionError(error: mongoose.CallbackError) {
        if (error) {
            Logger.error(error.message);
        }
    }
}
