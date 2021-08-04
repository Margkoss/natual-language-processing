import { Document, model, Schema } from 'mongoose';

export interface IArticle extends Document {
    url: string;
    header: string;
    body: string;
    pos_tags: POSTag[];
}

export interface FetchedArticle {
    header: string;
    body: string;
    url: string;
}

export interface POSTag {
    token: string;
    tag: string;
    lemma?: string;
}

const ArticlSchema = new Schema({
    url: String,
    header: String,
    body: String,
    pos_tags: [],
});

export const Article = model<IArticle>('Article', ArticlSchema);
