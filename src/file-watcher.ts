'use strict';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as helpers from './helpers';
import * as settings from './settings';
import { Logger } from './logger';

export class FileWatcher {
    private watchers: chokidar.FSWatcher[];
    private files: any;
    private codeSyncSettings: settings.CodeSyncSettings;
    private logger: Logger;

    constructor(files: any, codeSyncSettings: settings.CodeSyncSettings) {
        this.logger = new Logger('file-watcher');
        this.watchers = [];
        this.files = files;
        this.codeSyncSettings = codeSyncSettings;
        let paths: string[] = Object.keys(files);
        paths.forEach(path => {
            let watcher: chokidar.FSWatcher = chokidar.watch(path,
            {
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100
                }
            });
            watcher.on('change', (path, stats) => {
                this.change(path, stats);
            });
            this.watchers.push(watcher);
        });
    }

    change = (path: string, stats: fs.Stats) => {
        if (this.codeSyncSettings.Settings.autoExport) {
            this.logger.appendLine(`Detected file change at ${path}, syncing...`);
            if (this.files[path]) {
                this.files[path]();
            }
            else if (path.includes(helpers.getSnippetsFolderPath(this.codeSyncSettings.Settings))) {
                this.files[helpers.getSnippetsFolderPath(this.codeSyncSettings.Settings)]();
            }
        }
    }
}
