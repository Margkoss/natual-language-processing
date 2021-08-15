// TODO -> implement reading from environment variables

/**
 *
 *  Singleton Class that holds configuration for app
 *
 */
export class Config {
    private static configInstance: Config;

    private constructor() {}

    public static get instance(): Config {
        if (!Config.configInstance) {
            Config.configInstance = new Config();
        }

        return Config.configInstance;
    }

    public get dbURI(): string {
        return `mongodb://localhost:27017/nlp`;
    }

    public get bbcUrl(): string {
        return 'https://www.bbc.com/news/world';
    }

    public get cbsUrl(): string {
        return 'https://www.cbsnews.com/world/';
    }

    public get pos_tagger() {
        return {
            language: 'EN',
            default_category: 'N',
            default_category_capitalized: 'NNP',
            closed_class_categories: [
                'CD',
                'CC',
                'DT',
                'EX',
                'IN',
                'LS',
                'MD',
                'PDT',
                'POS',
                'PRP',
                'PRP$',
                'RP',
                'TO',
                'UH',
                'WDT',
                'WP',
                'WP$',
                'WRB',
            ],
            open_class_categories: {
                adjectives: ['JJ', 'JJR', 'JJS', 'RB', 'RBR', 'RBS'],
                nouns: ['NN', 'NNS', 'NNP', 'NNPS'],
                verbs: ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'],
                foreign: ['FW'],
            },
        };
    }

    public get maxSampleSpace(): number {
        return 8000;
    }

    public get cacheHost(): string {
        return 'localhost';
    }
}
