'use strict';
import * as path from 'path';
import * as fs from 'fs';
import * as cs from './cs';
import {Logger} from './logger';

export interface Settings {
    $schema: string;
    externalPath: string;
    autoImport: boolean;
    autoExport: boolean;
    importSettings: boolean;
    importKeybindings: boolean;
    importSnippets: boolean;
    importExtensions: boolean;
    showStatusBarIcon: boolean;
    excluded: ExcludedPackages;
    executableName: string;
    settingsPath: string;
}

interface ExcludedPackages {
    installed: string[];
    external: string[];
}

interface ExternalExtensions {
    extensions: string[];
}

export class CodeSyncSettings {
    private logger: Logger;
    private settings: Settings;
    private externalExtensions: ExternalExtensions;
    // points to the settings.json file in the extension dir
    private codeSyncSettingsPath: string;
    // points to the extensions.json file in the CodeSync dir
    private externalExtensionsPath: string;

    constructor(codeSyncSettingsPath: string, externalExtensionsPath: string) {
        this.logger = new Logger('settings');
        this.logger.appendLine(`Creating settings with internal settings.json path and external extensions.json path: ${codeSyncSettingsPath}, ${externalExtensionsPath}.`);
        this.externalExtensions = {extensions: []};
        this.codeSyncSettingsPath = codeSyncSettingsPath;
        this.externalExtensionsPath = externalExtensionsPath;
    }

    get Settings(): Settings {
        this.settings = this.retrieveInternal();
        return this.settings;
    }

    set Settings(settings: Settings) {
        this.settings = settings;
    }

    get ExcludedInstalledPackages(): string[] {
        return this.Settings.excluded.installed;
    }

    set ExcludedInstalledPackages(packages: string[]) {
        this.Settings.excluded.installed = packages;
    }

    get ExcludedExternalPackages(): string[] {
        return this.Settings.excluded.external;
    }

    set ExcludedExternalPackages(packages: string[]) {
        this.Settings.excluded.external = packages;
    }

    get Extensions(): string[] {
        this.externalExtensions = this.retrieveExternalExtensions();
        return this.externalExtensions.extensions;
    }

    set Extensions(packages: string[]) {
        this.externalExtensions.extensions = packages;
    }

    get ExternalExtensionsPath(): string {
        return this.externalExtensionsPath;
    }

    set ExternalExtensionsPath(externalExtensionsPath: string) {
        this.externalExtensionsPath = externalExtensionsPath;
    }

    // TODO: Remove these? They aren't used at all.
    excludeInstalledPackage(p: string) {
        if (this.Settings.excluded.installed.indexOf(p) == -1) {
            this.Settings.excluded.installed.push(p);
        }
    }

    excludeExternalPackage(p: string) {
        if (this.Settings.excluded.external.indexOf(p) == -1) {
            this.Settings.excluded.external.push(p);
        }
    }

    includeInstalledPackage(p: string) {
        let index = this.Settings.excluded.installed.indexOf(p);
        if (index != -1) {
            this.Settings.excluded.installed.splice(index, 1);
        }
    }

    includeExternalPackage(p: string) {
        let index = this.Settings.excluded.external.indexOf(p);
        if (index != -1) {
            this.Settings.excluded.external.splice(index, 1);
        }
    }

    save() {
        this.ExternalExtensionsPath = path.join(this.settings.externalPath, cs.EXTENSIONS);
        fs.writeFileSync(this.codeSyncSettingsPath, JSON.stringify(this.settings, null, 4));
    }

    saveExtensions() {
        fs.writeFileSync(this.externalExtensionsPath, JSON.stringify(this.externalExtensions, null, 4));
    }

    private retrieveInternal(): Settings {
        return JSON.parse(fs.readFileSync(this.codeSyncSettingsPath, 'utf8'));
    }

    private retrieveExternalExtensions(): ExternalExtensions {
        if (fs.existsSync(this.ExternalExtensionsPath)) {
            return JSON.parse(fs.readFileSync(this.ExternalExtensionsPath, 'utf8'));
        }
        else {
            return {extensions: []};
        }
    }
}
