import { BaseService } from '@common/interfaces/service.base';
import { ArticleRepository } from './article.repository';
import { Config } from '../config.class';

import axios from 'axios';
import { JSDOM } from 'jsdom';

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
        let dom = new JSDOM(res.data);

        const cbsArticles = this.getCBS(dom);

        res = await axios.get(this.bbcPage);
        dom = new JSDOM(res.data);

        const bbcArticles = this.getBBC(dom);
    }

    private getCBS(dom: JSDOM): string[] {
        const urls: string[] = [];

        dom.window.document
            .querySelectorAll('.item__anchor')
            .forEach((anchor) => urls.push(anchor.getAttribute('href') as string));

        return urls;
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
