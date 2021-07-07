import { EntityRepository } from '@common/database/entity.repository';
import { Article, IArticle } from './article.model';

export class ArticleRepository extends EntityRepository<IArticle> {
    constructor() {
        super(Article);
    }
}
