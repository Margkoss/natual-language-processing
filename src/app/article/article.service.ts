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
        let dom = new JSDOM((await axios.get(this.cbsUrl)).data);

        const fetchedArticles: FetchedArticle[] = [];

        fetchedArticles.push(...(await this.getCBS(dom)));
        for (const article of fetchedArticles) {
            Helpers.sleep(2000);
            console.log(article);
        }
    }

    private async getCBS(dom: JSDOM): Promise<FetchedArticle[]> {
        let urls: string[] = [];

        dom.window.document
            .querySelectorAll('.item__anchor')
            .forEach((anchor) => urls.push(anchor.getAttribute('href') as string));

        // Keep only unique urls
        urls = urls.filter((v, i, a) => a.indexOf(v) === i);

        const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar1.start(urls.length, 0);
        const articles: FetchedArticle[] = [];

        for (let i in urls) {
            bar1.update(Number(i));
            const article = <FetchedArticle>{};

            // Sleep for 500 miliseconds to escape rate limiting
            await Helpers.sleep(Helpers.random([1000, 1500]));

            const res = await axios.get(urls[i]);
            const articleDom = new JSDOM(res.data);

            // Extract headline and body
            article['header'] = articleDom.window.document.querySelector('.content__title').textContent;

            let body = '';
            articleDom.window.document
                .querySelector('.content__body')
                .querySelectorAll('p')
                .forEach((p) => {
                    if (
                        !p.parentElement.classList.contains('content__footer') &&
                        !p.classList.contains('content__copyright')
                    ) {
                        body += p.textContent;
                    }
                });
            article['body'] = body;
            articles.push(article);
        }
        bar1.stop();
        return articles;
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
