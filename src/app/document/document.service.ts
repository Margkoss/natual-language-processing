import { BaseService } from '@common/interfaces/service.base';
import { DocumentRepository } from './document.repository';
import { NlpService } from '@nlp/nlp.service';
import { StemRepository } from '@app/stem/stem.repository';
import { Config } from '@app/config.class';
import { Logger } from '@common/logger/logger.class';

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

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

                // Process and store documents.
                for (let j = 0; j < documents.length; j++) {
                    const document_name = documents[j];
                    const document_path = path.join(category_path, document_name);

                    console.log(`Processing document ${category_name}/${document_name}`);

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
        } catch (error) {
            throw error;
        }
    }
}
