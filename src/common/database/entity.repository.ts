import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class EntityRepository<T extends Document> {
    constructor(protected readonly entityModel: Model<T>) {}

    public async findOne(entityFilterQuery: FilterQuery<T>, projection?: Record<string, unknown>): Promise<T | null> {
        return await this.entityModel.findOne(entityFilterQuery, { _id: 0, __v: 0, ...projection }).exec();
    }

    public async find(entityFilterQuery: FilterQuery<T>, projection?: Record<string, unknown>): Promise<T[] | null> {
        return await this.entityModel.find(entityFilterQuery, { _id: 0, __v: 0, ...projection }).exec();
    }

    public async create(createEntityData: unknown): Promise<T> {
        const entity = new this.entityModel(createEntityData);
        return await entity.save();
    }

    public async findOneAndUpdate(
        entityFilterQuery: FilterQuery<T>,
        updateEntityData: UpdateQuery<unknown>
    ): Promise<T | null> {
        return await this.entityModel.findOneAndUpdate(entityFilterQuery, updateEntityData, { new: true });
    }

    public async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
        const res = await this.entityModel.deleteMany(entityFilterQuery);

        return !!res.deletedCount;
    }
}
