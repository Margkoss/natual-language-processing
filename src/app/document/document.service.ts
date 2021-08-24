import { BaseService } from '@common/interfaces/service.base';
import { DocumentRepository } from './document.repository';
import { NlpService } from '@nlp/nlp.service';
import { StemRepository } from '@app/stem/stem.repository';
import { Config } from '@app/config.class';
import { Logger } from '@common/logger/logger.class';

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { TfIdf } from 'natural';
import { QueueManager } from '@queue-manager/queue-manager.class';
import { IDocument } from './document.model';
import { IStem } from '@app/stem/stem.model';

import prettyMilliseconds from 'pretty-ms';
import cliProgress from 'cli-progress';

export class DocumentService implements BaseService {
    private readonly nlpService: NlpService;
    private readonly documentRepository: DocumentRepository;
    private readonly stemRepository: StemRepository;

    constructor() {
        this.documentRepository = new DocumentRepository();
        this.nlpService = new NlpService();
        this.stemRepository = new StemRepository();
    }

    public async train(documentsDirectory: string): Promise<void> {
        try {
            // Delete previous stems and documents
            await this.documentRepository.deleteMany({});
            await this.stemRepository.deleteMany({});

            // Get the categories from directory. ( Each subdirectory is a document category )
            const categories = fs.readdirSync(documentsDirectory);

            // Initialize document and stem variables.
            let saved_stems = new Set<string>();

            let stem_appearances: { [key: string]: number } = {};

            // Parse every document in every category and store it in database.
            for (let i = 0; i < categories.length; i++) {
                const category_name = categories[i];
                const category_path = path.join(documentsDirectory, category_name);

                // Get all documents in category.
                const documents = fs.readdirSync(category_path);

                Logger.info(`Processing category : ${chalk.bold(category_name)}`);

                // Process and store documents.
                for (let j = 0; j < documents.length; j++) {
                    const document_name = documents[j];
                    const document_path = path.join(category_path, document_name);

                    // Get document text and stem every word
                    const document_text = fs.readFileSync(document_path, 'utf8');
                    const stemmed = this.nlpService.stemText(document_text);

                    stemmed.forEach((stem_name) => {
                        if (saved_stems.has(stem_name)) {
                            stem_appearances[stem_name] = stem_appearances[stem_name] + 1;
                        }

                        if (!saved_stems.has(stem_name) && !/^[0-9]*$/.test(stem_name)) {
                            saved_stems.add(stem_name);
                            stem_appearances[stem_name] = 1;
                        }
                    });

                    // Save document to database
                    const document = await this.documentRepository.create({
                        name: document_name,
                        category: category_name,
                        text: document_text,
                        stems: stemmed,
                    });
                }
            }

            // Clear unique stems to save memory
            saved_stems.clear();

            // Get the best performing stems to create sample space S
            const sampleSpace: string[] = [];
            const maxStems = Object.values(stem_appearances).sort((a, b) => b - a);
            maxStems.length =
                Config.instance.maxSampleSpace <= maxStems.length ? Config.instance.maxSampleSpace : maxStems.length;

            // Create the sample space
            for (const key in stem_appearances) {
                if (maxStems.includes(stem_appearances[key])) {
                    sampleSpace.push(key);
                    maxStems.splice(maxStems.indexOf(stem_appearances[key]), 1);
                }
            }

            await this.stemRepository.insertMany(
                sampleSpace.map((stem) => {
                    return { name: stem };
                })
            );

            Logger.log(`Added ${sampleSpace.length} stems to sample space ${chalk.bold('S')}`);

            const documentIds = await this.documentRepository.listOfIds({});

            await QueueManager.instance.addTrainingJobs(documentIds.map((id) => ({ name: id, data: { id } })));
        } catch (error) {
            throw error;
        }
    }

    public async addTfidfVectors(stems: string[], docs: IDocument[], tfidf: TfIdf, articleId: string): Promise<void> {
        const article = await this.documentRepository.findOne({ _id: articleId }, { _id: 1 });

        if (article.tfidf_vector.length) {
            Logger.warn(`Article already has tfidf vector`);
            return;
        }

        Logger.info(
            `Creating TF-IDF vectors for article: ${chalk.yellow(chalk.bold(`${article.category}/${article.name}`))}`
        );

        let articleIndex: number = 0;
        for (let i = 0; i < docs.length; i++) {
            if (docs[i]._id == articleId) {
                articleIndex = i;
                break;
            }
        }

        for (const stem of stems) {
            // @ts-ignore
            const measure: number = tfidf.tfidf(stem, articleIndex);
            article.tfidf_vector.push(measure);
        }

        await article.save();

        Logger.log(
            `Done creating TF-IDF vectors for article: ${chalk.yellow(
                chalk.bold(`${article.category}/${article.name}`)
            )}`
        );
    }

    public async createTfidfFromDocument(documentText: string): Promise<number[]> {
        Logger.info(`Creating TFIDF for document`);

        // Create tfIdf from all documents
        const tfidf = new TfIdf();

        // ../news/20news-bydate-test/alt.atheism/53068
        const cursor = this.documentRepository.model
            .find({}, { text: 0, name: 0, category: 0, _id: 0, __v: 0, tfidf_vector: 0 })
            .lean()
            .cursor();

        let start = Date.now();

        for await (const doc of cursor) {
            tfidf.addDocument(doc.stems);
        }

        const stemmed = this.nlpService.stemText(documentText);
        tfidf.addDocument(stemmed);

        Logger.warn(`Finished creating tfidf in ${prettyMilliseconds(Date.now() - start)}`);

        const sampleSpace = await (await this.stemRepository.find({})).map((stem) => stem.name);

        const tfidfVector: number[] = [];
        const docIndex = await this.documentRepository.model.countDocuments();

        for (const stem of sampleSpace) {
            // @ts-ignore
            tfidfVector.push(tfidf.tfidf(stem, docIndex));
        }

        return tfidfVector;
    }

    public async categorizeDocument(docPath: string): Promise<void> {
        const start = Date.now();
        const docText = fs.readFileSync(path.resolve(docPath), 'utf8');

        const vector = await this.createTfidfFromDocument(docText);

        const cursor = this.documentRepository.model
            .find({}, { text: 0, name: 0, category: 0, __v: 0 })
            .lean()
            .cursor();

        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

        bar.start(await this.documentRepository.model.countDocuments(), 1);

        let maxSimilarity: { _id: string; val: number } = { _id: '', val: 0 };

        let i = 1;
        for await (const doc of cursor) {
            i++;
            bar.update(i);

            const similarity = this.nlpService.getSimilarity(vector, doc.tfidf_vector);
            if (similarity > maxSimilarity.val) {
                maxSimilarity._id = doc._id;
                maxSimilarity.val = similarity;
            }
        }

        const mostSimilarArticle = await this.documentRepository.findOne({ _id: maxSimilarity._id });

        console.table({ mostSimilarArticle: mostSimilarArticle.name, category: mostSimilarArticle.category });

        Logger.log(`Finished in ${prettyMilliseconds(Date.now() - start)}`);
    }
}
