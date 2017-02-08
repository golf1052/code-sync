'use strict';
import * as watch from 'chokidar';
import * as fs from 'fs';
import * as helpers from './helpers';
import * as settings from './settings';

export class FileWatcher {
    private watcher: watch.FSWatcher;
    private files: any;
    private codeSyncSettings: settings.CodeSyncSettings;

    constructor(files: any, codeSyncSettings: settings.CodeSyncSettings) {
        this.files = files;
        this.codeSyncSettings = codeSyncSettings;
        let paths: string[] = Object.keys(files);
        this.watcher = watch.watch(paths, {
            awaitWriteFinish: true
        });
        this.watcher.on('change', this.change);
    }

    change = (path: string, stats: fs.Stats) => {
        if (this.codeSyncSettings.Settings.autoExport) {
            if (this.files[path]) {
                this.files[path]();
            }
            else if (path.includes(helpers.getSnippetsFolderPath())) {
                this.files[helpers.getSnippetsFolderPath()]();
            }
        }
    }
}
