"use strict"

import * as vscode from 'vscode';

class StatusBarManager {
    private statusBar: vscode.StatusBarItem;
    private statusBarText: string;
    private icons: string[];
    private package: string = '$(package) ';
    private check: string = '$(check) ';
    private alert: string = '$(alert) ';
    private sync: string = '$(sync) ';
    
    constructor() {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this.icons = [];
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
        this.build();
    }
    
    private build() {
        let text = '';
        this.icons.forEach((i) => {
            text += i;
        });
        text += this.statusBarText;
        this.statusBar.text = text;
    }
    
    private resetIcons() {
        this.icons = [this.package];
    }
    
    setCheck() {
        this.resetIcons();
        this.icons.push(this.check);
    }
    
    setAlert() {
        this.resetIcons();
        this.icons.push(this.alert);
    }
    
    setSync() {
        this.resetIcons();
        this.icons.push(this.sync);
    }
}

export = StatusBarManager;