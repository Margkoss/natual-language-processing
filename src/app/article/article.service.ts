import { BaseService } from '@common/interfaces/service.base';
import { ArticleRepository } from './article.repository';
import { Config } from '../config.class';
import { JSDOM } from 'jsdom';
import { Helpers } from '@common/helpers/helpers.namespace';

import axios from 'axios';
import cliProgress from 'cli-progress';
import { FetchedArticle } from './article.model';

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
        let res = await axios.get(this.cbsUrl);

        if (res.status !== 200) throw new Error(`Can't fetch CBS front page...`);

        await this.getCBS(new JSDOM(res.data));
    }

    private async getCBS(dom: JSDOM): Promise<void> {
        let urls: string[] = [];

        dom.window.document
            .querySelectorAll('.item__anchor')
            .forEach((anchor) => urls.push(anchor.getAttribute('href') as string));

        // Keep only unique urls
        urls = urls.filter((v, i, a) => a.indexOf(v) === i);
        urls = urls.filter((url) => url.split('https://www.cbsnews.com/')[1].startsWith('news'));

        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        progressBar.start(urls.length, 1);

        for (let i in urls) {
            progressBar.update(Number(i) + 1);

            if (await this.repository.exists({ url: urls[i] })) continue;

            const article = <FetchedArticle>{};

            // Sleep for 500 miliseconds to escape rate limiting
            await Helpers.sleep(Helpers.random([500, 1000]));

            const res = await axios.get(urls[i]);

            if (res.status !== 200) throw new Error(`Cannot get article ${urls[i]}`);

            const articleDom = new JSDOM(res.data);

            // Extract headline and body
            article.header = articleDom.window.document.querySelector('.content__title').textContent;
            article.url = urls[i];

            article.body = '';
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

        progressBar.stop();
    }

    private getBBC(dom: JSDOM): string[] {
        let urls: string[] = [];

        dom.window.document
            .getElementById('index-page')
            .querySelectorAll('a')
            .forEach((el) => urls.push(`https://www.bbc.com${el.getAttribute('href')}`));

        return urls;
    }
}
