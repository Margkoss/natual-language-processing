import { BaseService } from '@common/interfaces/service.base';
import { DocumentRepository } from './document.repository';
import { TfIdf } from 'natural';
import { IDocument } from './document.model';
import { NlpService } from '@nlp/nlp.service';

import path from 'path';
import fs from 'fs-extra';

export class DocumentService implements BaseService {
    private readonly nlpService: NlpService;
    private readonly documentRepository: DocumentRepository;

    constructor() {
        this.documentRepository = new DocumentRepository();
        this.nlpService = new NlpService();
    }

    public async train(documentsDirectory: string): Promise<void> {
        try {
            // Delete previous stems and documents
            await this.documentRepository.deleteMany({});

            // Initialize TF-IDF calculator
            const tfidf = new TfIdf();

            // Get the categories from directory. ( Each subdirectory is a document category )
            const categories = fs.readdirSync(documentsDirectory);

            // Initialize document and stem variables.
            let saved_stems = new Set();
            let saved_documents: IDocument[] = [];

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
                        if (!saved_stems.has(stem_name)) {
                            if (!/^[0-9]*$/.test(stem_name)) saved_stems.add(stem_name);
                        }
                    });

                    // Save document to database
                    const document = await this.documentRepository.create({
                        name: document_name,
                        category: category_name,
                        text: document_text,
                        stems: stemmed,
                    });

                    saved_documents.push(document);

                    // Add document to TF-IDF calculator for later use.
                    tfidf.addDocument(stemmed);
                }
            }

            // Get all saved stems in alphabetical order
            const stem_array = Array.from(saved_stems) as string[];
            stem_array.sort();

            // Clear set to free memory
            saved_stems.clear();

            console.log(`Extracted ${stem_array.length} stems from ${saved_documents.length} documents`);

            // Stem count variable to optimize performance.
            const stem_count = stem_array.length;

            stem_array.forEach((stem, i) => {
                console.log(`Updating TF-IDF vectors for stem ${i + 1} of ${stem_count}: ${stem}`);
                tfidf.tfidfs(stem, function (index, measure) {
                    saved_documents[index].tfidf_vector.push(measure);
                });
            });

            // Save documents to database
            console.log('Saving documents to database...');
            for (let i = 0; i < saved_documents.length; i++) {
                const document = saved_documents[i];
                await document.save();
            }

            return;
        } catch (error) {
            throw error;
        }
    }
}
