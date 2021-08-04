import { ArticleRepository } from '@article/article.repository';
import { BaseService } from '@common/interfaces/service.base';
import { Config } from '../config.class';
import { BrillPOSTagger, Lexicon, RuleSet, WordTokenizer } from 'natural';
// @ts-ignore
import lemmatize from 'wink-lemmatizer';

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

    public async tagPartOfSpeech(): Promise<void> {
        // Only fetch articles that have an empty POSTag array
        const articles = await this.articleRepository.find({ pos_tags: { $exists: true, $eq: [] } }, { _id: 1 });

        for (const article of articles) {
            const tokenized = this.tokenizer.tokenize(article.body);

            let taggedWords: { token: string; tag: string; lemma?: string }[] = (this.tagger.tag(tokenized) as any)
                .taggedWords;

            taggedWords = taggedWords
                .filter((word) => !Config.getInstance().pos_tagger.closed_class_categories.includes(word.tag))
                .map((word) => {
                    return { ...word, lemma: this.lemmaFromPOSTag(word.token, word.tag) };
                });

            await this.articleRepository.findOneAndUpdate({ _id: article._id }, { pos_tags: taggedWords });
        }
    }

    public lemmaFromPOSTag(token: string, tag: string) {
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
