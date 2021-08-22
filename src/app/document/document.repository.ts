import { EntityRepository } from '@common/database/entity.repository';
import { FilterQuery, Model, QueryOptions } from 'mongoose';
import { DocumentModel, IDocument } from './document.model';

export class DocumentRepository extends EntityRepository<IDocument> {
    private readonly document: Model<IDocument>;

    constructor() {
        super(DocumentModel);
        this.document = DocumentModel;
    }

    public get model(): Model<IDocument> {
        return this.document;
    }

    public async listOfIds(
        filterQuery: FilterQuery<IDocument>,
        projection?: Record<string, unknown>,
        options?: QueryOptions
    ): Promise<string[]> {
        return await this.document.find(filterQuery, { _id: 0, __v: 0, ...projection }, options).distinct('_id');
    }
}
