import { DocumentService } from '@app/document/document.service';
import { FilesManager } from '@app/files-manager/files.manager';
import { Helpers } from '@common/helpers/helpers.namespace';
import { BaseManager } from '@common/interfaces/manager.base';
import { Logger } from '@common/logger/logger.class';
import { LemmaService } from '@lemma/lemma.service';
import { QueueManager } from '@queue-manager/queue-manager.class';
import path from 'path';
import xml from 'xml';

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
            const command = data.toString().trim();

            if (command.startsWith('query')) {
                const lemmas = command.split('query')[1].trim().split(' ');

                await this.lemmaService.queryLemmas(true, ...lemmas);
                return;
            } else if (command.startsWith('test')) {
                await this.lemmaService.testResponseTime(Helpers.queries);
                return;
            } else if (command.startsWith('clear')) {
                console.clear();
            } else if (command.startsWith('help')) {
                console.log(Helpers.landingText);
            } else if (command.startsWith('train')) {
                const documentsDirectory = command.split(' ')[1].trim();

                // this.documentService.train(path.resolve(documentsDirectory));

                await this.documentService.categorizeDocument(documentsDirectory);
            } else if (command.startsWith('exit')) {
                process.exit(0);
            } else if (command.startsWith('drain')) {
                await QueueManager.instance.drainQueues();
            } else if (command.startsWith('export')) {
                let args = command.split(' ');
                args.splice(0, 1);

                if (!args.length) {
                    Logger.error(`Provide arguement to export`);
                    return;
                }

                if (args.includes('xml')) {
                    await FilesManager.instance.exportInverseIndex();
                    return;
                }

                await FilesManager.instance.extractDatabaseFile(args[0] as 'article' | 'lemma' | 'stem' | 'document');
            } else {
                Logger.error(`Command "${command}" not recognized`);
            }
        });

        Logger.info(`Registered stdin commands`);
    }
}
