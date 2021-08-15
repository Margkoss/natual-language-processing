import { EntityRepository } from '@common/database/entity.repository';
import { IStem, Stem } from './stem.model';

export class StemRepository extends EntityRepository<IStem> {
    constructor() {
        super(Stem);
    }

    public async insertMany(createEntityData: { name: string }[]): Promise<IStem[]> {
        return await Stem.insertMany(createEntityData);
    }
}
