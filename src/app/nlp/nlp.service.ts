import { ArticleRepository } from '@article/article.repository';
import { BaseService } from '@common/interfaces/service.base';
import { Config } from '../config.class';
import { BrillPOSTagger, Lexicon, RuleSet, WordTokenizer } from 'natural';

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
        const articles = await this.articleRepository.find({}, { _id: 1 });

        for (const article of articles) {
            const tokenized = this.tokenizer.tokenize(article.body);

            const { taggedWords } = this.tagger.tag(tokenized) as any;

            console.log(
                taggedWords.filter(
                    (word: { token: string; tag: string }) =>
                        !Config.getInstance().pos_tagger.closed_class_categories.includes(word.tag)
                ).length
            );
        }
    }
}
