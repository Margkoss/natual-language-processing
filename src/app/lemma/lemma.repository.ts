import { EntityRepository } from '@common/database/entity.repository';
import { FilterQuery, Model } from 'mongoose';
import { Lemma, ILemma } from './lemma.model';

export class LemmaRepository extends EntityRepository<ILemma> {
    private readonly lemma: Model<ILemma>;

    constructor() {
        super(Lemma);
        this.lemma = Lemma;
    }

    public async exists(filterQuery: FilterQuery<ILemma>): Promise<boolean> {
        return await this.lemma.exists(filterQuery);
    }
}
