'use strict';
import * as fs from 'fs';
import * as path from 'path';

export const LOCAL_SETTINGS: string = 'local-settings.json';

export class LocalSettings {
    private codeSyncExtensionDir: string;

    constructor(codeSyncExtensionDir: string) {
        this.codeSyncExtensionDir = codeSyncExtensionDir;
    }

    import(externalSettingsPath: string, internalSettingsPath: string): void {
        let localSettingsPath: string = path.join(this.codeSyncExtensionDir, LOCAL_SETTINGS);
        let settings: any = JSON.parse(fs.readFileSync(externalSettingsPath, 'utf8'));
        if (fs.existsSync(localSettingsPath)) {
            let localSettings: any = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys: string[] = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                settings[key] = localSettings[key];
            });
        }
        fs.writeFileSync(internalSettingsPath, JSON.stringify(settings, null, 4));
    }

    export(internalSettingsPath: string, externalSettingsPath: string): void {
        let localSettingsPath: string = path.join(this.codeSyncExtensionDir, LOCAL_SETTINGS);
        let settings: any = JSON.parse(fs.readFileSync(internalSettingsPath, 'utf8'));
        if (!fs.existsSync(localSettingsPath)) {
            fs.writeFileSync(localSettingsPath, JSON.stringify({}, null, 4));
        }
        if (fs.existsSync(localSettingsPath)) {
            let localSettings: any = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys: string[] = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                delete settings[key];
            });
        }
        fs.writeFileSync(externalSettingsPath, JSON.stringify(settings, null, 4));
    }
}
