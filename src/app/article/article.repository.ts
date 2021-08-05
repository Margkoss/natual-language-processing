import { EntityRepository } from '@common/database/entity.repository';
import { FilterQuery, Model, QueryOptions } from 'mongoose';
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

    public async listOfIds(
        filterQuery: FilterQuery<IArticle>,
        projection?: Record<string, unknown>,
        options?: QueryOptions
    ): Promise<string[]> {
        return await this.article.find(filterQuery, { _id: 0, __v: 0, ...projection }, options).distinct('_id');
    }

    public async count(): Promise<number> {
        return await this.article.countDocuments();
    }
}
