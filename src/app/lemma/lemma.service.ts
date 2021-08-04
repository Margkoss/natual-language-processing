import { ArticleRepository } from '@article/article.repository';
import { BaseService } from '@common/interfaces/service.base';
import { Logger } from '@common/logger/logger.class';
import { LemmaRepository } from './lemma.repository';

export class LemmaService implements BaseService {
    private readonly articleRepository: ArticleRepository;
    private readonly lemmaRepository: LemmaRepository;

    constructor() {
        this.articleRepository = new ArticleRepository();
        this.lemmaRepository = new LemmaRepository();
    }

    public async createLemmas(): Promise<void> {
        // Fetch all articles with POSTags
        const start = Date.now();

        const articles = await this.articleRepository.listOfIds({ pos_tags: { $exists: true, $ne: [] } });

        for (const id of articles) {
            await this.createLemmaFromArticle(id);
        }

        Logger.log(`Finished processing ${articles.length} articles in ${(Date.now() - start) / 1000} seconds`);
    }

    private async createLemmaFromArticle(id: string): Promise<void> {
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
                dbLemma.appearances += numAppearances;

                const newLemma = await dbLemma.save();
            } else {
                // If the lemma doesn't exist create a new one
                const newLemma = await this.lemmaRepository.create({
                    lemma: lemma,
                    appearances: numAppearances,
                    articles: { [id]: numAppearances },
                });
            }
        }

        Logger.info(`Finished processing ${lemmas.length} lemmas`);
    }
}
