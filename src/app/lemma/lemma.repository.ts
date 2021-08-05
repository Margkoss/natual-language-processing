import { EntityRepository } from '@common/database/entity.repository';
import { FilterQuery, Model, QueryOptions } from 'mongoose';
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

    public async listOfIds(
        filterQuery: FilterQuery<ILemma>,
        projection?: Record<string, unknown>,
        options?: QueryOptions
    ): Promise<string[]> {
        return await this.lemma.find(filterQuery, { _id: 0, __v: 0, ...projection }, options).distinct('_id');
    }
}
