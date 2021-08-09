import { Document, model, Schema } from 'mongoose';

export interface IDocument extends Document {
    name: string;
    category: string;
    text: string;
    stems: string[];
    tfidf_vector: number[];
}

const DocumentSchema = new Schema({
    name: String,
    category: String,
    text: String,
    stems: [],
    tfidf_vector: [],
});

export const DocumentModel = model<IDocument>('Document', DocumentSchema);
