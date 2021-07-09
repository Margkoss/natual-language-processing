import chalk from 'chalk';

export class Logger {
    public static log(message: string): void {
        console.log(
            chalk.yellow(
                `[${new Date().toLocaleDateString('el', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })} - ${new Date().toLocaleTimeString('el', {})}] : `
            ) + ` ${message} `
        );
    }

    public static error(message: string): void {
        console.log(
            chalk.red(
                `[${new Date().toLocaleDateString('el', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })} - ${new Date().toLocaleTimeString('el', {})}] : `
            ) + ` ${message} `
        );
    }
}
