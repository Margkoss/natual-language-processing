import { Document, model, Schema } from 'mongoose';

export interface ILemma extends Document {
    lemma: string;
    appearances: number;
    articles: Record<string, number>;
}

const LemmaSchema = new Schema({
    lemma: String,
    appearances: Number,
    articles: {},
});

export const Lemma = model<ILemma>('Lemma', LemmaSchema);
