'use strict';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as helpers from './helpers';
import * as settings from './settings';
import { Logger } from './logger';

export interface FileWatcherFiles {
    [path: string]: () => void;
}

export class FileWatcher {
    private watchers: chokidar.FSWatcher[];
    private files: FileWatcherFiles;
    private codeSyncSettings: settings.CodeSyncSettings;
    private logger: Logger;

    constructor(files: FileWatcherFiles, codeSyncSettings: settings.CodeSyncSettings) {
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
            watcher.on('change', (path: string, stats: fs.Stats) => {
                // NOTE: for directories, specifically the snippets directory, 'change' here is fine because when new
                // snippet files are created by VSCode the file gets created by VSCode before it's presented to the user
                // so when the user actually saves their snippets for the first time we will get a change event here,
                // even if the user has "files.autoSave" set to "off".
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

    /**
     * Shuts down the file watcher. Once shutdown a new file watcher must be created. Used for testing.
     */
    shutdown(): void {
        this.watchers.forEach(watcher => {
            watcher.close();
        });
    }
}
