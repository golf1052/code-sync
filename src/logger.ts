'use strict';
import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel = null;
    private static lastCalledFilename: string | null = null;

    private filename: string;

    constructor(filename: string) {
        if (Logger.outputChannel == null) {
            Logger.outputChannel = vscode.window.createOutputChannel('CodeSync');
        }
        this.filename = filename;
    }

    public appendLine(value: string): void {
        let output: string = '';
        if (Logger.lastCalledFilename == null) {
            Logger.lastCalledFilename = this.filename;
            output += `${this.filename}.ts\n`;
        }
        
        if (Logger.lastCalledFilename != this.filename) {
            output += `${this.filename}.ts\n`;
            Logger.lastCalledFilename = this.filename;
        }

        output += `\t${new Date().toISOString()} - ${value}`;
        this.log(output);
    }

    private log(line: string): void {
        if (process.env.CODE_SYNC_TESTING) {
            console.log(line);
        }
        Logger.outputChannel.appendLine(line);
    }
}
