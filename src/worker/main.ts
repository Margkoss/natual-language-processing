import 'module-alias/register';
import { Logger } from '@common/logger/logger.class';
import { Config } from '../app/config.class';
import { Job, Worker } from 'bullmq';
import mongoose from 'mongoose';
import { ArticleRepository } from '@article/article.repository';
import { Helpers } from '@common/helpers/helpers.namespace';
import axios from 'axios';
import { FetchedArticle } from '@article/article.model';
import { JSDOM } from 'jsdom';

class WorkerManager {
    private repository: ArticleRepository;
    private articleWorker: Worker;

    constructor() {
        this.repository = new ArticleRepository();
    }

    public initialize(): void {
        mongoose.connect(Config.getInstance().dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        mongoose.Promise = global.Promise;

        this.registerWorkers();
    }

    private registerWorkers(): void {
        this.articleWorker = new Worker('Articles', this.handleArticleJobs.bind(this));
        Logger.log('Registered Articles Worker');
    }

    private async handleArticleJobs(job: Job): Promise<void> {
        const { data } = job;

        if (data.bbc) {
            Logger.log(`Handling bbc job -> ${job.name} on queue ${job.queueName}`);

            const url = data.bbc;

            if (await this.repository.exists({ url: url })) {
                Logger.warn(`${url} already exists, skipping`);

                return;
            }

            // Throttle requests
            await Helpers.sleep(Helpers.random([500, 1000]));

            const res = await axios.get(url);
            if (res.status !== 200) throw new Error(`Cannot fetch ${url}`);

            Logger.log(`Fetching "${url}"`);

            const dom = new JSDOM(res.data);
            const article = <FetchedArticle>{
                header: dom.window.document.querySelector('h1').textContent,
                url: url,
                body: '',
            };

            dom.window.document
                .querySelector('article')
                .querySelectorAll('p')
                .forEach((p) => {
                    article.body += '\n' + p.textContent;
                });

            await this.repository.create(article);
        } else if (data.cbs) {
            Logger.log(`Handling cbs job -> ${job.name} on queue ${job.queueName}`);

            const url = data.cbs;

            if (await this.repository.exists({ url: url })) {
                Logger.warn(`${url} already exists, skipping`);

                return;
            }

            // Sleep for 500 miliseconds to escape rate limiting
            await Helpers.sleep(Helpers.random([500, 1000]));

            const res = await axios.get(url);
            if (res.status !== 200) throw new Error(`Cannot get article ${url}`);

            Logger.log(`Fetching "${url}"`);

            const articleDom = new JSDOM(res.data);

            // Extract headline and body
            const article = <FetchedArticle>{
                header: articleDom.window.document.querySelector('.content__title').textContent,
                url: url,
                body: '',
            };

            articleDom.window.document
                .querySelector('.content__body')
                .querySelectorAll('p')
                .forEach((p) => {
                    if (
                        !p.parentElement.classList.contains('content__footer') &&
                        !p.classList.contains('content__copyright')
                    ) {
                        article.body += '\n' + p.textContent;
                    }
                });

            await this.repository.create(article);
        }
    }
}

const worker = new WorkerManager();
worker.initialize();
