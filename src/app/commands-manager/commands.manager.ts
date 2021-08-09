import { DocumentService } from '@app/document/document.service';
import { Helpers } from '@common/helpers/helpers.namespace';
import { BaseManager } from '@common/interfaces/manager.base';
import { Logger } from '@common/logger/logger.class';
import { LemmaService } from '@lemma/lemma.service';
import path from 'path';

export class CommandsManager implements BaseManager {
    private static _instance: CommandsManager;

    private readonly lemmaService: LemmaService;
    private readonly documentService: DocumentService;

    private constructor() {
        this.lemmaService = new LemmaService();
        this.documentService = new DocumentService();
    }

    public static get instance(): CommandsManager {
        if (!CommandsManager._instance) {
            CommandsManager._instance = new CommandsManager();
        }

        return CommandsManager._instance;
    }

    public initialize(): void {
        this.registerCommands();
    }

    public registerCommands(): void {
        process.stdin.on('data', async (data) => {
            const command = data.toString();

            if (command.startsWith('query')) {
                const lemmas = command.split('query')[1].trim().split(' ');

                await this.lemmaService.queryLemmas(true, ...lemmas);
                return;
            }

            if (command.startsWith('test')) {
                await this.lemmaService.testResponseTime(Helpers.queries);
                return;
            }

            if (command.startsWith('clear')) {
                console.clear();
            }

            if (command.startsWith('help')) {
                console.log(Helpers.landingText);
            }

            if (command.startsWith('train')) {
                const documentsDirectory = command.split(' ')[1].trim();

                this.documentService.train(path.resolve(documentsDirectory));
            }

            if (command.startsWith('exit')) {
                process.exit(0);
            }
        });

        Logger.info(`Registered stdin commands`);
    }
}
