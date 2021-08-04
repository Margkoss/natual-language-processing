import { ArticleRepository } from '@article/article.repository';
import { BaseService } from '@common/interfaces/service.base';
import { Config } from '../config.class';
import { BrillPOSTagger, Lexicon, RuleSet, WordTokenizer } from 'natural';
// @ts-ignore
import lemmatize from 'wink-lemmatizer';
import { IArticle, POSTag } from '@article/article.model';
import { QueueManager } from '@queue-manager/queue-manager.class';
import { Logger } from '@common/logger/logger.class';

export class NlpService implements BaseService {
    private articleRepository: ArticleRepository;
    private tokenizer: WordTokenizer;
    private lexicon: Lexicon;
    private tagger: BrillPOSTagger;
    private ruleSet: RuleSet;

    constructor() {
        this.articleRepository = new ArticleRepository();
        this.tokenizer = new WordTokenizer();
        this.lexicon = new Lexicon(
            Config.getInstance().pos_tagger.language,
            Config.getInstance().pos_tagger.default_category
        );
        this.ruleSet = new RuleSet(Config.getInstance().pos_tagger.language);
        this.tagger = new BrillPOSTagger(this.lexicon, this.ruleSet);
    }

    public async addTagJobs(): Promise<void> {
        // Only fetch articles that have an empty POSTag array
        const articles = await this.articleRepository.listOfIds({ pos_tags: { $exists: true, $eq: [] } });

        await QueueManager.instance.addTaggingJobs(
            articles.map((article) => {
                return { name: `job ${article}`, data: { id: article }, options: {} };
            })
        );

        Logger.log(`Added ${articles.length} tagging jobs`);
    }

    public async tagArticle(id: string): Promise<void> {
        const article = await this.articleRepository.findOne({ _id: id });

        const tokenized = this.tokenizer.tokenize(article.body);

        let taggedWords: POSTag[] = (this.tagger.tag(tokenized) as any).taggedWords;

        taggedWords = taggedWords
            .filter((word) => !Config.getInstance().pos_tagger.closed_class_categories.includes(word.tag))
            .map((word) => {
                return { ...word, lemma: this.lemmaFromPOSTag(word.token, word.tag) };
            });

        await this.articleRepository.findOneAndUpdate({ _id: id }, { pos_tags: taggedWords });
    }

    private lemmaFromPOSTag(token: string, tag: string) {
        // Convert to lower case
        token = token.toLowerCase();

        // If token is a verb
        if (Config.getInstance().pos_tagger.open_class_categories.verbs.includes(tag)) return lemmatize.verb(token);
        // If it's an adjective or adverb
        else if (Config.getInstance().pos_tagger.open_class_categories.adjectives.includes(tag))
            return lemmatize.adjective(token);
        // If it's a noun or foreign token
        else return lemmatize.noun(token);
    }
}
