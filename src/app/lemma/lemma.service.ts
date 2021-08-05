import { ArticleRepository } from '@article/article.repository';
import { BaseService } from '@common/interfaces/service.base';
import { Logger } from '@common/logger/logger.class';
import { QueueManager } from '@queue-manager/queue-manager.class';
import { Job } from 'bullmq';
import { ILemma } from './lemma.model';
import { LemmaRepository } from './lemma.repository';

export class LemmaService implements BaseService {
    private readonly articleRepository: ArticleRepository;
    private readonly lemmaRepository: LemmaRepository;

    constructor() {
        this.articleRepository = new ArticleRepository();
        this.lemmaRepository = new LemmaRepository();
    }

    public async addLemmaJobs(): Promise<void> {
        // Fetch all articles with POSTags
        const articles = await this.articleRepository.listOfIds({ pos_tags: { $exists: true, $ne: [] } });

        await QueueManager.instance.addLemmaJobs(
            articles.map((article) => {
                return {
                    name: `job ${article}`,
                    data: { id: article },
                    options: {},
                };
            })
        );

        Logger.log(`Added ${articles.length} lemma jobs`);
    }

    public async createLemmaFromArticle(id: string): Promise<void> {
        const article = await this.articleRepository.findOne({ _id: id }, { _id: 1 });

        if (!article.pos_tags.length) return;

        const lemmas = article.pos_tags.map((posTag) => posTag.lemma);
        const uniqueLemmas = lemmas.filter((v, i, a) => a.indexOf(v) === i);

        for (const lemma of uniqueLemmas) {
            const dbLemma = await this.lemmaRepository.findOne({ lemma }, { _id: 1 });

            // Count how many times this lemma appears in the article
            const numAppearances = lemmas.filter((el) => el === lemma).length;

            if (dbLemma) {
                // If the lemma in the db has the article in its hash map, the article has already been processed
                if (id in dbLemma.articles) break;

                // Set the total number of appearances and appearances in the article
                dbLemma.set(`articles.${id}.appearances`, numAppearances);

                const newLemma = await dbLemma.save();
            } else {
                // If the lemma doesn't exist create a new one

                /**
                 * Avoid adding complete number of apperances here as
                 * opossed to asynchrounsly because it will create
                 * race conditions when many lemmas are counted in parallel
                 */

                const newLemma = await this.lemmaRepository.create({
                    lemma: lemma,
                    appearances: 0,
                    articles: { [id]: { appearances: numAppearances } },
                });
            }
        }

        Logger.info(`Finished processing ${lemmas.length} lemmas`);
    }

    public async updateAppearances(lemma: ILemma): Promise<ILemma> {
        let sum = 0;
        for (const article in lemma.articles) {
            sum += lemma.articles[article].appearances;
        }

        if (sum !== lemma.appearances) {
            lemma.appearances = sum;
            lemma = await lemma.save();
        }

        return lemma;
    }

    public async query_lemmas(...lemmas: string[]) {
        try {
            // Prepare database queries
            let query = {
                $or: lemmas.map((lemma) => {
                    return { name: new RegExp(lemma) };
                }),
            };

            // Get lemmas
            const search_results = await this.lemmaRepository.find(query, {
                lemma: 1,
                articles: 1,
                _id: 0,
            });

            const result = search_results.map((r) => {
                return {
                    lemma: r.lemma,
                    documents: Object.entries(r.articles)
                        .sort((a, b) => {
                            return b[1].weight - a[1].weight;
                        })
                        .map((entry) => {
                            return { id: entry[0], weight: entry[1].weight };
                        }),
                };
            });

            if (result.length !== 0) {
                console.log(`Found the following ${result.length} lemmas`);
            } else {
                console.log('No lemmas found');
            }

            result.forEach((entry) => {
                console.log('Lemma:', entry.lemma);
                console.table(entry.documents);
            });
        } catch (error) {
            throw error;
        }
    }
}
