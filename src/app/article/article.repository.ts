import { EntityRepository } from '@common/database/entity.repository';
import { FilterQuery, Model } from 'mongoose';
import { Article, IArticle } from './article.model';

export class ArticleRepository extends EntityRepository<IArticle> {
    private readonly article: Model<IArticle>;

    constructor() {
        super(Article);
        this.article = Article;
    }

    public async exists(filterQuery: FilterQuery<IArticle>): Promise<boolean> {
        return await this.article.exists(filterQuery);
    }
}
