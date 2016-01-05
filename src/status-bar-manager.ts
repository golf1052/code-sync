"use strict"

import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBar: vscode.StatusBarItem;
    private statusBarText: string;
    private package: string = '$(package)';
    private check: string = '$(check)';
    private alert: string = '$(alert)';
    private sync: string = '$(sync)';
    
    constructor() {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this.show();
    }
    
    show() {
        this.statusBar.show();
    }
    
    hide() {
        this.statusBar.hide();
    }
    
    get StatusBarText(): string {
        return this.statusBarText;
    }
    
    set StatusBarText(text: string) {
        this.statusBarText = text;
    }
}