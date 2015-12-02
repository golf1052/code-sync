// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var request = require('request');
var os = require('os');
var fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-sync" is now active!');
		
	var vsCodeExtensionsDir: string = os.homedir() + '/.vscode/extensions';
	var codeSyncDir: string = os.homedir() + '/OneDrive/Apps/code-sync';
	var validExtensions = [];
	for (var i = 0; i < vscode.extensions.all.length; i++) {
		var ext = vscode.extensions.all[i];
		if (ext.extensionPath.startsWith(process.env.USERPROFILE)) {
			validExtensions.push(ext);
		}
	}
	console.log(validExtensions);
	// fs.access(vsCodeExtensionsDir, fs.R_OK, function (err) {
	// 	console.log(err ? 'no access' : 'can read');
	// });
	
	// fs.access(codeSyncDir, fs.R_OK | fs.W_OK, function (err) {
	// 	if (err) {
	// 		fs.mkdirSync(codeSyncDir);
	// 	}
	// });
	// ncp(vsCodeExtensionsDir, codeSyncDir, function (err) {
	// 	if (err) {
	// 		console.log(err);
	// 	}
	// 	else {
	// 		console.log('copy completed successfully');
	// 	}
	// });
	
	// request('', function (error, response, body) {
	// 	if (!error && response.statusCode == 200) {
	// 		console.log(body);
	// 	}
	// });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	var exportExtensionsDisposable = vscode.commands.registerCommand('extension.exportExtensions', () => {
		// Display a message box to the user
		vscode.window.showInformationMessage('Extensions Exported!');
	});
	
	context.subscriptions.push(exportExtensionsDisposable);
}