'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as helpers from './helpers';
import {Logger} from './logger';

export const LOCAL_SETTINGS: string = 'local-settings.json';

export class LocalSettings {
    private codeSyncExtensionDir: string;
    private logger: Logger;

    constructor(codeSyncExtensionDir: string) {
        this.logger = new Logger('local-settings');
        this.codeSyncExtensionDir = codeSyncExtensionDir;
    }

    /**
     * Imports external settings to VSCode while adding local setting values.
     * 
     * @param externalSettingsPath Path to external settings.json 
     * @param internalSettingsPath Path to internal settings.json
     */
    import(externalSettingsPath: string, internalSettingsPath: string): void {
        let localSettingsPath: string = path.join(this.codeSyncExtensionDir, LOCAL_SETTINGS);
        let settings: any = helpers.parseJson(fs.readFileSync(externalSettingsPath, 'utf8'));
        if (fs.existsSync(localSettingsPath)) {
            this.logger.appendLine('Modifying settings with local settings.');
            let localSettings: any = helpers.parseJson(fs.readFileSync(localSettingsPath, 'utf8'));
            let localSettingsKeys: string[] = Object.keys(localSettings);
            localSettingsKeys.forEach(key => {
                settings[key] = localSettings[key];
            });
        }
        this.logger.appendLine('Saving imported settings.');
        fs.writeFileSync(internalSettingsPath, helpers.stringifyJson(settings));
    }

    /**
     * Exports internal settings from VSCode while removing local setting values.
     * 
     * @param internalSettingsPath Path to internal settings.json 
     * @param externalSettingsPath Path to external settings.json
     */
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
