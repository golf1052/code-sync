import * as child_process from 'child_process';
import * as path from 'path';
import * as vscode_test from 'vscode-test';
import { TestOptions } from 'vscode-test/out/runTest';

function main() {
    process.exit(1);
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
            args.extensionTestsEnv = {
                'CODE_SYNC_TESTING': 'true'
            };
            setArch(args);

            vscode_test.downloadAndUnzipVSCode(args.version, args.platform)
            .then((vscodeExecutablePath: string) => {
                // const vscodeExecutablePath = await vscode_test.downloadAndUnzipVSCode(args.version, args.platform);
                args.vscodeExecutablePath = vscodeExecutablePath;
                args.extensionTestsEnv.CODE_SYNC_EXEC_PATH = vscodeExecutablePath;
                child_process.spawnSync(vscode_test.resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath), ['--install-extension', 'golf1052.base16-generator'], {
                    encoding: 'utf8',
                    stdio: 'inherit'
                });
                // Download VS Code, unzip it and run the integration test
                return vscode_test.runTests(args)
            })
            .catch(err => {
                throw err;
            });
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
