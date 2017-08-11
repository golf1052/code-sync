'use strict';
import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBar: vscode.StatusBarItem;
    private statusBarText: string;
    private icons: string[];
    private visible: boolean;

    private package: string = '$(package)';
    private check: string = '$(check)';
    private alert: string = '$(alert)';
    private stop: string = '$(stop)';
    private sync: string = '$(sync)';

    constructor() {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this.statusBarText = '';
        this.icons = [];
        this.setCheck();
        this.visible = false;
    }

    get StatusBarText(): string {
        return this.statusBarText;
    }

    set StatusBarText(text: string) {
        this.statusBarText = text;
        this.build();
    }

    show() {
        this.statusBar.show();
        this.visible = true;
    }

    hide() {
        this.statusBar.hide();
        this.visible = false;
    }

    toggle(): boolean {
        if (this.visible) {
            this.hide();
        }
        else {
            this.show();
        }
        return this.visible;
    }

    reset() {
        this.StatusBarText = '';
        this.setCheck();
    }

    setCheck() {
        this.resetIcons();
        this.icons.push(this.check);
        this.build();
    }
    
    setAlert() {
        this.resetIcons();
        this.icons.push(this.alert);
        this.build();
    }
    
    setStop() {
        this.resetIcons();
        this.icons.push(this.stop);
        this.build();
    }
    
    setSync() {
        this.resetIcons();
        this.icons.push(this.sync);
        this.build();
    }

    private build() {
        let text = '';
        this.icons.forEach(i => {
            text += i + ' ';
        });
        text += 'CodeSync';
        if (this.statusBarText != '') {
            text += ': ' + this.statusBarText;
        }
        this.statusBar.text = text;
    }

    private resetIcons() {
        this.icons = [this.package];
    }
}
