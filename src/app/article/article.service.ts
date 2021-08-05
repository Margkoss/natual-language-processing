import { BaseService } from '@common/interfaces/service.base';
import { Config } from '@app/config.class';
import { JSDOM } from 'jsdom';
import { Logger } from '@common/logger/logger.class';

import axios from 'axios';
import { ArticleRepository } from './article.repository';
import { Helpers } from '@common/helpers/helpers.namespace';
import { Article } from '@article/article.model';
import { QueueManager } from '@queue-manager/queue-manager.class';

export class ArticleService implements BaseService {
    private bbcPage: string;
    private cbsUrl: string;
    private repository: ArticleRepository;

    constructor() {
        this.bbcPage = Config.getInstance().bbcUrl;
        this.cbsUrl = Config.getInstance().cbsUrl;
        this.repository = new ArticleRepository();
    }

    public async addArticleJobs(): Promise<void> {
        // Create an article limit
        const articleCount = await this.repository.count();

        if (articleCount >= 10) {
            Logger.warn(`Reached article goal, not adding others`);
            return;
        }

        const urls = await this.getArticles();
        // "Cut" array to fit max size
        urls.length = urls.length < 10 - articleCount ? urls.length : 10 - articleCount;

        await QueueManager.instance.addArticleJobs(
            urls.map((url, index) => {
                return {
                    name: `job ${index}`,
                    data: url,
                };
            })
        );

        Logger.log(`Added ${urls.length} article jobs`);
    }

    public async getArticles(): Promise<Record<string, string>[]> {
        Logger.info('Start fetching articles urls');
        const [resCBS, resBBC] = await Promise.all([axios.get(this.cbsUrl), axios.get(this.bbcPage)]);

        if (resCBS.status !== 200 || resBBC.status !== 200) throw new Error(`Can't fetch front pages...`);

        const [cbsUrls, bbcUrls] = await Promise.all([
            this.getBBC(new JSDOM(resBBC.data)),
            this.getCBS(new JSDOM(resCBS.data)),
        ]);

        Logger.info('Finished fetching article urls');

        return [...cbsUrls, ...bbcUrls];
    }

    private async getCBS(dom: JSDOM): Promise<{ cbs: string }[]> {
        let urls: string[] = [];

        dom.window.document
            .querySelectorAll('.item__anchor')
            .forEach((anchor) => urls.push(anchor.getAttribute('href') as string));

        // Keep only unique urls
        urls = urls.filter((v, i, a) => a.indexOf(v) === i);
        urls = urls.filter((url) => url.split('https://www.cbsnews.com/')[1].startsWith('news'));

        return urls.map((url) => {
            return { cbs: url };
        });
    }

    private async getBBC(dom: JSDOM): Promise<{ bbc: string }[]> {
        let urls: string[] = [];

        dom.window.document
            .getElementById('index-page')
            .querySelectorAll('a')
            .forEach((el) => urls.push(`https://www.bbc.com${el.getAttribute('href')}`));

        // Keep only unique urls
        urls = urls.filter((v, i, a) => a.indexOf(v) === i);
        urls = urls.filter((url) => url.split(this.bbcPage)[1] && url.split(this.bbcPage)[1].startsWith('-'));

        return urls.map((url) => {
            return { bbc: url };
        });
    }
}
