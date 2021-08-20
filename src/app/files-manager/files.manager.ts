import { BaseManager } from '@common/interfaces/manager.base';
import { Article, IArticle } from '@article/article.model';
import { Model, QueryCursor } from 'mongoose';
import { DocumentModel, IDocument } from '@app/document/document.model';
import { IStem, Stem } from '@app/stem/stem.model';
import { ILemma, Lemma } from '@lemma/lemma.model';
import { Logger } from '@common/logger/logger.class';
// @ts-ignore
import JSONStream from 'JSONStream';
import fs from 'fs';
import xml from 'xml';

export class FilesManager implements BaseManager {
    private articleModel: Model<IArticle>;
    private documentModel: Model<IDocument>;
    private lemmaModel: Model<ILemma>;
    private stemModel: Model<IStem>;

    private static _instance: FilesManager;

    private constructor() {
        this.articleModel = Article;
        this.documentModel = DocumentModel;
        this.lemmaModel = Lemma;
        this.stemModel = Stem;
    }

    public static get instance(): FilesManager {
        if (!FilesManager._instance) {
            FilesManager._instance = new FilesManager();
        }

        return FilesManager._instance;
    }

    public initialize(): void {}

    public async extractDatabaseFile(type: 'article' | 'stem' | 'lemma' | 'document'): Promise<void> {
        Logger.log(`Creating file`);

        const writeStream = fs.createWriteStream(`./${type}.json`);

        switch (type) {
            case 'article':
                this.articleModel.find({}).lean().cursor().pipe(JSONStream.stringify()).pipe(writeStream);
                break;
            case 'document':
                this.documentModel.find({}).lean().cursor().pipe(JSONStream.stringify()).pipe(writeStream);
                break;
            case 'lemma':
                this.lemmaModel.find({}).lean().cursor().pipe(JSONStream.stringify()).pipe(writeStream);
                break;
            case 'stem':
                this.stemModel.find({}).lean().cursor().pipe(JSONStream.stringify()).pipe(writeStream);
                break;
            default:
                break;
        }

        writeStream.on('finish', () => Logger.log('Created file'));
    }

    public async exportInverseIndex(): Promise<void> {
        const writeStream = fs.createWriteStream('./output.xml');
        const cursor = this.lemmaModel.find().lean().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            // @ts-ignore
            console.log(doc);
        }
    }
}
