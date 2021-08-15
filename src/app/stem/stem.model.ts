import { Document, model, Schema } from 'mongoose';

export interface IStem extends Document {
    name: string;
}

const StemSchema = new Schema({
    name: String,
});

export const Stem = model<IStem>('Stem', StemSchema);
