import chalk from 'chalk';
import { randomInt } from 'crypto';

export namespace Helpers {
    export async function sleep(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }

    export function random(minMax: [number, number]): number {
        return randomInt(minMax[0], minMax[1]);
    }

    export const landingText = `
${chalk.blueBright(`
███╗░░██╗██╗░░░░░██████╗░  ██████╗░██████╗░░█████╗░░░░░░██╗███████╗░█████╗░████████╗
████╗░██║██║░░░░░██╔══██╗  ██╔══██╗██╔══██╗██╔══██╗░░░░░██║██╔════╝██╔══██╗╚══██╔══╝
██╔██╗██║██║░░░░░██████╔╝  ██████╔╝██████╔╝██║░░██║░░░░░██║█████╗░░██║░░╚═╝░░░██║░░░
██║╚████║██║░░░░░██╔═══╝░  ██╔═══╝░██╔══██╗██║░░██║██╗░░██║██╔══╝░░██║░░██╗░░░██║░░░
██║░╚███║███████╗██║░░░░░  ██║░░░░░██║░░██║╚█████╔╝╚█████╔╝███████╗╚█████╔╝░░░██║░░░
╚═╝░░╚══╝╚══════╝╚═╝░░░░░  ╚═╝░░░░░╚═╝░░╚═╝░╚════╝░░╚════╝░╚══════╝░╚════╝░░░░╚═╝░░░
`)}                                


Available commands:
- ${chalk.yellow('query')} <comma seperated lemmas>             ${chalk.bold('-> queries lemmas from inverted index')}
- ${chalk.yellow('test')}                                       ${chalk.bold('-> Tests response time')}
- ${chalk.yellow('clear')}                                      ${chalk.bold('-> Clears console window')}
- ${chalk.yellow('help')}                                       ${chalk.bold(
        '-> Displays help information about commands'
    )}
- ${chalk.yellow('train')} <path to directory>                  ${chalk.bold('-> Trains with the directory given')} 
- ${chalk.yellow('drain')}                                       ${chalk.bold('-> Drains the task queues')}
- ${chalk.yellow('exit')}                                       ${chalk.bold('-> Exits the program')}

                `;

    export const queries = [
        ['read'],
        ['mood'],
        ['beard'],
        ['mobile'],
        ['television'],
        ['range'],
        ['wife'],
        ['butterfly'],
        ['tap'],
        ['bullet'],
        ['craftsman'],
        ['outlook'],
        ['embrace'],
        ['snatch'],
        ['surround'],
        ['breeze'],
        ['seek'],
        ['ignorant'],
        ['flu'],
        ['stain'],
        ['wine'],
        ['watch', 'me'],
        ['you', 'are'],
        ['eat', 'something'],
        ['no', 'more'],
        ['damn', 'daniel'],
        ['not', 'very'],
        ['a', 'warrant'],
        ['my', 'heart'],
        ['the', 'sun'],
        ['dance', 'room'],
        ['shallow', 'ground'],
        ['miracle', 'worker'],
        ['in', 'regard'],
        ['large', 'mosque'],
        ['expose', 'them'],
        ['viral', 'trend'],
        ['afford', 'money'],
        ['spontaneous', 'combustion'],
        ['jelly', 'bean'],
        ['rhythm', 'beat'],
        ['material', 'design'],
        ['orange', 'black', 'netflix'],
        ['radical', 'view', 'broccoli'],
        ['van', 'minivan', 'sedan'],
        ['elegant', 'clothing', 'stand'],
        ['is', 'this', 'love'],
        ['that', 'you', 'are'],
        ['looking', 'for', 'my'],
        ['friend', 'assault', 'biden'],
        ['earth', 'wind', 'fire'],
        ['black', 'lives', 'matter'],
        ['why', 'so', 'serious'],
        ['systematic', 'evacuation', 'domestic'],
        ['a', 'new', 'hope'],
        ['width', 'length', 'weight'],
        ['eat', 'pray', 'love'],
        ['shame', 'on', 'you'],
        ['ice', 'ice', 'baby'],
        ['usain', 'bolt', 'won'],
        ['collapse', 'ash', 'achievement'],
        ['achievement', 'journal', 'color-blind'],
        ['find', 'and', 'replace'],
        ['git', 'commit', 'message'],
        ['battery', 'protection', 'noble'],
        ['jhgb', '55', 'n'],
        ['time', '=', 'money'],
        ['no', 'more', 'tears'],
        [' ', '__', 'is'],
        ['tinominateme', 'nominate', 'academy'],
        ['award', 'stop', 'don'],
        ['god', 'where', 'is'],
        ['noice', 'brooklyn', '99'],
        ['the', 'droids', 'you', 'are'],
        ['looking', 'for', "don't", 'reside'],
        ['here', '.', 'No', 'rest'],
        ['for', 'the', 'wicked', '!'],
        ['Somebody', 'once', 'told', 'me'],
        ['the', 'world', 'is', 'gonna'],
        ['roll', 'me', ',', 'I'],
        ['am', 'not', 'the', 'sharpest'],
        ['tool', 'in', 'the', 'shed'],
        ['She', 'was', 'looking', 'kind'],
        ['of', 'dumb', 'with', 'her'],
        ['finger', 'and ', 'her', 'thumb'],
        ['in', 'the', 'shape', 'of'],
        ['an', 'L', 'on', 'her'],
        ['forehead', '...', 'revoke', 'yhealtho'],
        ['narrow', 'pity', 'elapse', 'refrigerator'],
        ['echo', 'guitar', 'default', 'campaign'],
        ['environment', 'researcher', 'forge', 'temperature'],
        ['occupation', 'waist', 'tie', 'tap'],
        ['fragrant', 'slam', 'abbey', 'elegant'],
        ['tidy', 'install', 'gem', 'novel'],
        ['copy', 'queue', 'communication', 'bond'],
        ['firefighter', 'agency', 'shelter', 'agency'],
        ['tie', 'launch', 'dismiss', '-'],
        ['pound', 'prosper', 'bare', 'pursuit'],
        ['blaassetck', 'asset', 'sleeve', 'policy'],
        ['obstacle', 'threaten', 'to', 'fire'],
        ['peak', 'invite', 'homosexual', 'year'],
        ['commemorate', 'flour', 'cutting', 'yo'],
        ['tis', 'isa', 'party', 'song'],
        ['off', 'with', 'their', 'heads'],
    ];
}
