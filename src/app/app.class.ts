import mongoose from 'mongoose';
import { Config } from './config.class';
import { ArticleService } from '@article/article.service';

export class App {
    constructor() {}

    public async bootstrap(): Promise<void> {
        try {
            // const conn = mongoose.connect(
            //     Config.getInstance().dbURI,
            //     {
            //         useNewUrlParser: true,
            //         useUnifiedTopology: true,
            //     },
            //     this.handleConnectionError
            // );

            // mongoose.Promise = global.Promise;

            // console.log('Succesfully connected to mongo');

            const asrvc = new ArticleService();

            await asrvc.getArticles();
        } catch (e) {
            process.exit(-1);
        }
    }

    private handleConnectionError(error: mongoose.CallbackError) {
        if (error) {
            console.log(error);
        }
    }
}
