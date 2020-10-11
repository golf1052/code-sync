import * as path from 'path';
import * as fs from 'fs';
import * as json from 'comment-json';
import { runTests } from 'vscode-test';
import { TestOptions } from 'vscode-test/out/runTest';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

        // The path to the extension test runner script
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        const testArgs: TestOptions[] = [];

        // Stable test
        testArgs.push({
            extensionDevelopmentPath: extensionDevelopmentPath,
            extensionTestsPath: extensionTestsPath
        });

        if (!process.env.IN_EDITOR) {
            // Insiders test
            testArgs.push({
                extensionDevelopmentPath: extensionDevelopmentPath,
                extensionTestsPath: extensionTestsPath,
                version: 'insiders'
            });
        }

        for (const args of testArgs) {
            setArch(args);

            // Download VS Code, unzip it and run the integration test
            await runTests(args);
        }
    } catch (err) {
        console.error(err);
        console.error('Failed to run tests');
        process.exit(1);
    }
}

function setArch(options: TestOptions) {
    if (process.platform === 'win32' && process.arch === 'x64') {
        options.platform = 'win32-x64-archive';
    }
}

main();
