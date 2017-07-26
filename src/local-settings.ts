'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as helpers from './helpers';

export const LOCAL_SETTINGS: string = 'local-settings.json';

export class LocalSettings {
    private codeSyncExtensionDir: string;

    constructor(codeSyncExtensionDir: string) {
        this.codeSyncExtensionDir = codeSyncExtensionDir;
    }

    import(externalSettingsPath: string, internalSettingsPath: string): void {
        let localSettingsPath: string = path.join(this.codeSyncExtensionDir, LOCAL_SETTINGS);
        let settings: any = helpers.parseJson(fs.readFileSync(externalSettingsPath, 'utf8'));
        if (fs.existsSync(localSettingsPath)) {
            let localSettings: any = helpers.parseJson(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys: string[] = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                settings[key] = localSettings[key];
            });
        }
        fs.writeFileSync(internalSettingsPath, helpers.stringifyJson(settings));
    }

    export(internalSettingsPath: string, externalSettingsPath: string): void {
        let localSettingsPath: string = path.join(this.codeSyncExtensionDir, LOCAL_SETTINGS);
        let settings: any = helpers.parseJson(fs.readFileSync(internalSettingsPath, 'utf8'));
        if (!fs.existsSync(localSettingsPath)) {
            fs.writeFileSync(localSettingsPath, helpers.stringifyJson({}));
        }
        if (fs.existsSync(localSettingsPath)) {
            let localSettings: any = helpers.parseJson(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys: string[] = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                delete settings[key];
            });
        }
        fs.writeFileSync(externalSettingsPath, helpers.stringifyJson(settings));
    }
}
