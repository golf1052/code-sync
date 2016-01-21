"use strict"

import * as fs from 'q-io/fs';
import * as os from 'os';

export function isVersionGreaterThan(a: string, b: string): number {
    if (a === b) {
        return 0;
    }
    else if ((typeof a !== 'undefined' && typeof b === 'undefined') ||
    (a !== null && b === null)) {
        return 1;
    }
    else if ((typeof a === 'undefined' && typeof b !== 'undefined') ||
    (a === null && b !== null)) {
        return -1;
    }
    else {
        let aSplit: string[] = a.split('.');
        let bSplit: string[] = b.split('.');
        if (aSplit.length >= bSplit.length) {
            for (let i: number = 0; i < aSplit.length; i++) {
                let aNum: number = parseInt(aSplit[i]);
                if (bSplit[i]) {
                    let bNum: number = parseInt(bSplit[i]);
                    if (aNum > bNum) {
                        return 1;
                    }
                    else if (aNum < bNum) {
                        return -1;
                    }
                }
                else {
                    if (aNum > 0) {
                        return 1;
                    }
                }
            }
        }
        else {
            for (let i: number = 0; i < bSplit.length; i++) {
                let bNum: number = parseInt(bSplit[i]);
                if (aSplit[i]) {
                    let aNum: number = parseInt(aSplit[i]);
                    if (bNum > aNum) {
                        return -1;
                    }
                    else if (bNum < aNum) {
                        return 1;
                    }
                }
                else {
                    if (bNum > 0) {
                        return -1;
                    }
                }
            }
        }
        return 0;
    }
}

export async function makeSureDirectoryExists(path: string) {
    if (await fs.exists(path) == false) {
        await fs.makeDirectory(path);
    }
}

export async function getSettings(path: string): Promise<any> {
    return JSON.parse(await fs.read(path + '/settings.json'));
}

export async function saveSettings(path: string, settings: any) {
    await fs.write(path + '/settings.json', JSON.stringify(settings, null, 4));
}

export async function deleteDirectory(path: string) {
    if (await fs.exists(path) == true) {
        await fs.removeTree(path);
    }
}

export function getHomeDirectory(): string {
    return os.homedir();
}
