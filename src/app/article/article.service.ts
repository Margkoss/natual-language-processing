import { BaseService } from '@common/interfaces/service.base';
import { ArticleRepository } from './article.repository';
import { Config } from '../config.class';
import { JSDOM } from 'jsdom';
import { Helpers } from '@common/helpers/helpers.namespace';
import { FetchedArticle } from './article.model';
import { Logger } from '@common/logger/logger.class';

import axios from 'axios';

export class ArticleService implements BaseService {
    private repository: ArticleRepository;
    private bbcPage: string;
    private cbsUrl: string;

    constructor() {
        this.repository = new ArticleRepository();
        this.bbcPage = Config.getInstance().bbcUrl;
        this.cbsUrl = Config.getInstance().cbsUrl;
    }

    public async getArticles(): Promise<void> {
        Logger.info('Start fetching articles');
        const [resCBS, resBBC] = await Promise.all([axios.get(this.cbsUrl), axios.get(this.bbcPage)]);

        if (resCBS.status !== 200 || resBBC.status !== 200) throw new Error(`Can't fetch front pages...`);

        await Promise.all([this.getBBC(new JSDOM(resBBC.data)), this.getCBS(new JSDOM(resCBS.data))]);
    }

    private async getCBS(dom: JSDOM): Promise<void> {
        let urls: string[] = [];

        dom.window.document
            .querySelectorAll('.item__anchor')
            .forEach((anchor) => urls.push(anchor.getAttribute('href') as string));

        // Keep only unique urls
        urls = urls.filter((v, i, a) => a.indexOf(v) === i);
        urls = urls.filter((url) => url.split('https://www.cbsnews.com/')[1].startsWith('news'));

        for (let i in urls) {
            if (await this.repository.exists({ url: urls[i] })) {
                Logger.log(`${urls[i]} already exists, skipping`);

                continue;
            }

            // Sleep for 500 miliseconds to escape rate limiting
            await Helpers.sleep(Helpers.random([500, 1000]));

            const res = await axios.get(urls[i]);
            if (res.status !== 200) throw new Error(`Cannot get article ${urls[i]}`);

            Logger.log(`Fetching "${urls[i]}"`);

            const articleDom = new JSDOM(res.data);

            // Extract headline and body
            const article = <FetchedArticle>{
                header: articleDom.window.document.querySelector('.content__title').textContent,
                url: urls[i],
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
                        article.body += p.textContent;
                    }
                });

            await this.repository.create(article);
        }
    }

    private async getBBC(dom: JSDOM): Promise<void> {
        let urls: string[] = [];

        dom.window.document
            .getElementById('index-page')
            .querySelectorAll('a')
            .forEach((el) => urls.push(`https://www.bbc.com${el.getAttribute('href')}`));

        // Keep only unique urls
        urls = urls.filter((v, i, a) => a.indexOf(v) === i);
        urls = urls.filter((url) => url.split(this.bbcPage)[1] && url.split(this.bbcPage)[1].startsWith('-'));

        for (const i in urls) {
            if (await this.repository.exists({ url: urls[i] })) {
                Logger.log(`${urls[i]} already exists, skipping`);

                continue;
            }

            // Throttle requests
            await Helpers.sleep(Helpers.random([500, 1000]));

            const res = await axios.get(urls[i]);
            if (res.status !== 200) throw new Error(`Cannot fetch ${urls[i]}`);

            Logger.log(`Fetching "${urls[i]}"`);

            const dom = new JSDOM(res.data);
            const article = <FetchedArticle>{
                header: dom.window.document.querySelector('h1').textContent,
                url: urls[i],
                body: '',
            };

            dom.window.document
                .querySelector('article')
                .querySelectorAll('p')
                .forEach((p) => {
                    article.body += p.textContent;
                });

            await this.repository.create(article);
        }
    }
}
