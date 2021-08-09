import { EntityRepository } from '@common/database/entity.repository';
import { DocumentModel, IDocument } from './document.model';

export class DocumentRepository extends EntityRepository<IDocument> {
    constructor() {
        super(DocumentModel);
    }
}
