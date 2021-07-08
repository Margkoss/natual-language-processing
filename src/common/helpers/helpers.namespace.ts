import { randomInt } from 'crypto';

export namespace Helpers {
    export async function sleep(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }

    export function random(minMax: [number, number]): number {
        return randomInt(minMax[0], minMax[1]);
    }
}
