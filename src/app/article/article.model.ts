import { Document, model, Schema } from 'mongoose';

export interface IArticle extends Document {
    url: string;
    header: string;
    body: string;
    pos_tags: string[];
}

const ArticlSchema = new Schema({
    url: String,
    header: String,
    body: String,
    pos_tags: [],
});

export const Article = model<IArticle>('Article', ArticlSchema);
