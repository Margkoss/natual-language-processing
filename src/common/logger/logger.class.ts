import chalk from 'chalk';

export class Logger {
    public static log(message: string): void {
        console.log(
            chalk.greenBright(
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

    public static info(message: string): void {
        console.log(
            chalk.blueBright(
                `[${new Date().toLocaleDateString('el', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })} - ${new Date().toLocaleTimeString('el', {})}] : `
            ) + ` ${message} `
        );
    }

    public static warn(message: string): void {
        console.log(
            chalk.yellowBright(
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
