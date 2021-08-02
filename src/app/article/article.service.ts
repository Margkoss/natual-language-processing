import { BaseService } from '@common/interfaces/service.base';
import { Config } from '../config.class';
import { JSDOM } from 'jsdom';
import { Logger } from '@common/logger/logger.class';

import axios from 'axios';
import { ArticleRepository } from './article.repository';
import { Helpers } from '@common/helpers/helpers.namespace';
import { Article } from './article.model';

export class ArticleService implements BaseService {
    private bbcPage: string;
    private cbsUrl: string;
    private repository: ArticleRepository;

    constructor() {
        this.bbcPage = Config.getInstance().bbcUrl;
        this.cbsUrl = Config.getInstance().cbsUrl;
        this.repository = new ArticleRepository();
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
