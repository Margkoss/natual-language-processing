import 'module-alias/register';
import { Logger } from '@common/logger/logger.class';
import { Config } from '@app/config.class';
import { Job, Worker } from 'bullmq';
import mongoose from 'mongoose';
import { ArticleRepository } from '@article/article.repository';
import { Helpers } from '@common/helpers/helpers.namespace';
import axios from 'axios';
import { FetchedArticle } from '@article/article.model';
import { JSDOM } from 'jsdom';
import { BaseManager } from '@common/interfaces/manager.base';
import { NlpService } from '@nlp/nlp.service';
import { LemmaService } from '@lemma/lemma.service';
import { DocumentService } from '@app/document/document.service';
import { TfIdf } from 'natural';
import { DocumentRepository } from '@app/document/document.repository';
import chalk from 'chalk';
import { IDocument } from '@app/document/document.model';
import { StemRepository } from '@app/stem/stem.repository';

class WorkerManager implements BaseManager {
    private repository: ArticleRepository;
    private documentRepository: DocumentRepository;
    private stemRepository: StemRepository;
    private nlpService: NlpService;
    private lemmaService: LemmaService;
    private documentService: DocumentService;

    private tfidf: TfIdf;

    private articleWorker: Worker;
    private trainWorker: Worker;
    private tagWorker: Worker;
    private lemmaWorker: Worker;
    private inverseIndexWorker: Worker;

    private docs: IDocument[];
    private stems: string[];

    constructor() {
        this.repository = new ArticleRepository();
        this.documentRepository = new DocumentRepository();
        this.stemRepository = new StemRepository();

        this.nlpService = new NlpService();
        this.lemmaService = new LemmaService();
        this.documentService = new DocumentService();

        this.tfidf = new TfIdf();
    }

    public async initialize(): Promise<void> {
        mongoose.connect(Config.instance.dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        mongoose.Promise = global.Promise;

        Logger.log(`Starting...`);

        const start = Date.now();
        await this.createTfidf();
        Logger.log(`Created tfidf in ${chalk.yellow((Date.now() - start) / 1000)} seconds`);

        this.registerWorkers();
    }

    private async createTfidf(): Promise<void> {
        this.docs = await this.documentRepository.find({}, { name: 0, text: 0, category: 0, tfidf_vector: 0 });
        const res = await this.stemRepository.find({});
        this.stems = res.map((stem) => stem.name);
        this.stems.sort();

        this.docs.forEach((doc) => this.tfidf.addDocument(doc.stems));
    }

    private registerWorkers(): void {
        this.articleWorker = new Worker('Articles', this.handleArticleJobs.bind(this), {
            connection: { host: Config.instance.cacheHost },
        });
        Logger.log('Registered Articles Worker');
        this.tagWorker = new Worker('Tags', this.handleTagJobs.bind(this), {
            connection: { host: Config.instance.cacheHost },
        });
        Logger.log('Registered Tags Worker');
        this.lemmaWorker = new Worker('Lemmas', this.handleLemmaJobs.bind(this), {
            connection: { host: Config.instance.cacheHost },
        });
        Logger.log('Registered Lemmas Worker');
        this.inverseIndexWorker = new Worker('Inverse Index', this.handleInverseIndexJobs.bind(this), {
            connection: { host: Config.instance.cacheHost },
        });
        Logger.log('Registered Inverse Index Worker');

        this.trainWorker = new Worker('Training', this.handleTrainingJobs.bind(this), {
            connection: { host: Config.instance.cacheHost },
        });
        Logger.log('Registered Training Worker');
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
                    article.body += `\n${p.textContent}`;
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
                        article.body += `\n${p.textContent}`;
                    }
                });

            await this.repository.create(article);
        }
    }

    private async handleTagJobs(job: Job): Promise<void> {
        const { data } = job;

        Logger.log(`Handling POSTagging job -> ${job.name} on queue ${job.queueName}`);

        await this.nlpService.tagArticle(data.id);
    }

    private async handleLemmaJobs(job: Job): Promise<void> {
        const { id } = job.data;

        Logger.log(`Handling Lemma job -> ${job.name} on queue ${job.queueName}`);

        await this.lemmaService.createLemmaFromArticle(id);
    }

    private async handleInverseIndexJobs(job: Job): Promise<void> {
        const { id } = job.data;

        Logger.log(`Handling Inverse Index job -> ${job.name} on queue ${job.queueName}`);

        await this.nlpService.TFIDFeachLemma(id);
    }

    private async handleTrainingJobs(job: Job): Promise<void> {
        const { id } = job.data;

        await this.documentService.addTfidfVectors(this.stems, this.docs, this.tfidf, id);
    }
}

const worker = new WorkerManager();
worker.initialize();
