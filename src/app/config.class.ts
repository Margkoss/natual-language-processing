// TODO -> implement reading from environment variables

/**
 *
 *  Singleton Class that holds configuration for app
 *
 */
export class Config {
    private static configInstance: Config;

    private constructor() {}

    public static getInstance(): Config {
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
}
