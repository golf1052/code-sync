"use strict"

import * as vscode from 'vscode';

class StatusBarManager {
    private statusBar: vscode.StatusBarItem;
    private statusBarText: string;
    private icons: string[];
    private package: string = '$(package) ';
    private check: string = '$(check) ';
    private alert: string = '$(alert) ';
    private stop: string = '$(stop) ';
    private sync: string = '$(sync) ';
    
    constructor() {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this.icons = [];
        this.statusBarText = '';
        this.setCheck();
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
        if (this.statusBarText.toLowerCase().indexOf('restart') != -1) {
            this.setTimer(() => {
                this.statusBarText = text;
            }, 5000);
        }
        else {
            this.statusBarText = text;
            this.build();
        }
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
    
    setTimer(preFn: () => void, time: number, postFn?: () => void) {
        let oldText = this.StatusBarText;
        let oldIcons = this.icons;
        preFn();
        let self = this;
        setTimeout((function () {
            if (postFn) {
                postFn();
            }
            else {
                self.icons = oldIcons;
                self.StatusBarText = oldText;
            }
        }), time);
    }
    
    setGoodStatus() {
        this.StatusBarText = 'CodeSync';
        this.setCheck();
    }
}

export = StatusBarManager;