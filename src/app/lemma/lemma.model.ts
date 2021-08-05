import { Document, model, Schema } from 'mongoose';

interface LemmaArticles {
    [key: string]: {
        appearances: number;
        weight: number;
    };
}

export interface ILemma extends Document {
    lemma: string;
    appearances: number;
    articles: LemmaArticles;
}

const LemmaSchema = new Schema({
    lemma: String,
    appearances: Number,
    articles: {},
});

export const Lemma = model<ILemma>('Lemma', LemmaSchema);
