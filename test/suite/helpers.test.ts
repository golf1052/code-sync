import * as assert from 'assert';
import * as helpers from '../../src/helpers';
import * as os from 'os';
import * as path from 'path';
import * as settings from '../../src/settings';
import * as test_helpers from './test-helpers';
import * as vscode from 'vscode';

suite('helper.ts', () => {
    suite('isInsiders', function() {
        if (test_helpers.isInsiders()) {
            test('VSCode Insiders should be true', function() {
                assert.ok(helpers.isInsiders());
            });
        } else {
            test('VSCode Insiders should be false', function() {
                assert.ok(!helpers.isInsiders());
            });
        }
    });

    suite.skip('getInstalledExtensions', function() {
        test('1 extension should be installed', function() {
            assert.equal(helpers.getInstalledExtensions().length, 1);
        });
    });

    suite('getExtensionDir', function() {
        if (test_helpers.isInsiders()) {
            const expectedExtensionsPath = path.join(os.homedir(), '.vscode-insiders/extensions');
            test(`VSCode Insiders extensions directory should be ${expectedExtensionsPath}`, function() {
                assert.equal(helpers.getExtensionDir().toLowerCase(), expectedExtensionsPath.toLowerCase());
            });
        } else {
            const expectedExtensionsPath = path.join(os.homedir(), '.vscode/extensions');
            test(`VSCode extensions directory should be ${expectedExtensionsPath}`, function() {
                assert.equal(helpers.getExtensionDir().toLowerCase(), expectedExtensionsPath.toLowerCase());
            });
        }
    });

    suite('getDefaultCodeSettingsFolderPath', function() {
        let expectedSettingsPath: string = '';
        let testTitle: string = '';
        if (test_helpers.isInsiders()) {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code - Insiders/User/');
                testTitle = `VSCode Insiders Windows settings directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code - Insiders/User/');
                testTitle = `VSCode Insiders macOS settings directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code - Insiders/User/');
                testTitle = `VSCode Insiders Linux settings directory should be ${expectedSettingsPath}`;
            } else {
                testTitle = `VSCode Insiders on unknown platform settings directory should be ${expectedSettingsPath}`;
            }
        } else {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code/User/');
                testTitle = `VSCode Windows settings directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code/User/');
                testTitle = `VSCode macOS settings directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code/User/');
                testTitle = `VSCode Linux settings directory should be ${expectedSettingsPath}`;
            } else {
                testTitle = `VSCode on unknown platform settings directory should be ${expectedSettingsPath}`;
            }
        }

        test(testTitle, function() {
            assert.equal(helpers.getDefaultCodeSettingsFolderPath(), expectedSettingsPath);
        });
    });

    suite('getUserSettingsFilePath', function() {
        let expectedSettingsPath: string = '';
        let testTitle: string = '';
        if (test_helpers.isInsiders()) {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code - Insiders/User/', 'settings.json');
                testTitle = `VSCode Insiders Windows settings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code - Insiders/User/', 'settings.json');
                testTitle = `VSCode Insiders macOS settings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code - Insiders/User/', 'settings.json');
                testTitle = `VSCode Insiders Linux settings file should be ${expectedSettingsPath}`;
            } else {
                expectedSettingsPath = 'settings.json';
                testTitle = `VSCode Insiders on unknown platform settings file should be ${expectedSettingsPath}`;
            }
        } else {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code/User/', 'settings.json');
                testTitle = `VSCode Windows settings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code/User/', 'settings.json');
                testTitle = `VSCode macOS settings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code/User/', 'settings.json');
                testTitle = `VSCode Linux settings file should be ${expectedSettingsPath}`;
            } else {
                expectedSettingsPath = 'settings.json';
                testTitle = `VSCode on unknown platform settings file should be ${expectedSettingsPath}`;
            }
        }

        test(testTitle, function() {
            assert.equal(helpers.getUserSettingsFilePath(test_helpers.getDefaultSettings()), expectedSettingsPath);
        });
    });

    suite('getKeybindingsFilePath', function() {
        let expectedSettingsPath: string = '';
        let testTitle: string = '';
        if (test_helpers.isInsiders()) {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code - Insiders/User/', 'keybindings.json');
                testTitle = `VSCode Insiders Windows keybindings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code - Insiders/User/', 'keybindings.json');
                testTitle = `VSCode Insiders macOS keybindings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code - Insiders/User/', 'keybindings.json');
                testTitle = `VSCode Insiders Linux keybindings file should be ${expectedSettingsPath}`;
            } else {
                expectedSettingsPath = 'keybindings.json';
                testTitle = `VSCode Insiders on unknown platform keybindings file should be ${expectedSettingsPath}`;
            }
        } else {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code/User/', 'keybindings.json');
                testTitle = `VSCode Windows keybindings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code/User/', 'keybindings.json');
                testTitle = `VSCode macOS keybindings file should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code/User/', 'keybindings.json');
                testTitle = `VSCode Linux keybindings file should be ${expectedSettingsPath}`;
            } else {
                expectedSettingsPath = 'keybindings.json';
                testTitle = `VSCode on unknown platform keybindings file should be ${expectedSettingsPath}`;
            }
        }

        test(testTitle, function() {
            assert.equal(helpers.getKeybindingsFilePath(test_helpers.getDefaultSettings()), expectedSettingsPath);
        });
    });

    suite('getSnippetsFolderPath', function() {
        let expectedSettingsPath: string = '';
        let testTitle: string = '';
        if (test_helpers.isInsiders()) {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code - Insiders/User/', 'snippets/');
                testTitle = `VSCode Insiders Windows snippets directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code - Insiders/User/', 'snippets/');
                testTitle = `VSCode Insiders macOS snippets directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code - Insiders/User/', 'snippets/');
                testTitle = `VSCode Insiders Linux snippets directory should be ${expectedSettingsPath}`;
            } else {
                expectedSettingsPath = 'snippets/';
                testTitle = `VSCode Insiders on unknown platform snippets directory should be ${expectedSettingsPath}`;
            }
        } else {
            if (process.platform === 'win32') {
                expectedSettingsPath = path.join(process.env.APPDATA, 'Code/User/', 'snippets/');
                testTitle = `VSCode Windows snippets directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'darwin') {
                expectedSettingsPath = path.join(os.homedir(), 'Library/Application Support/Code/User/', 'snippets/');
                testTitle = `VSCode macOS snippets directory should be ${expectedSettingsPath}`;
            } else if (process.platform === 'linux') {
                expectedSettingsPath = path.join(os.homedir(), '.config/Code/User/', 'snippets/');
                testTitle = `VSCode Linux snippets directory should be ${expectedSettingsPath}`;
            } else {
                expectedSettingsPath = 'snippets/';
                testTitle = `VSCode on unknown platform snippets directory should be ${expectedSettingsPath}`;
            }
        }

        test(testTitle, function() {
            assert.equal(helpers.getSnippetsFolderPath(test_helpers.getDefaultSettings()), expectedSettingsPath);
        });
    });

    suite('installExtension', function() {
        setup(function() {
            helpers.uninstallExtension('golf1052.test-extension', test_helpers.getDefaultSettings());
        });
        test('Installing test-extension should return true', function() {
            assert.ok(helpers.installExtension('golf1052.test-extension', test_helpers.getDefaultSettings()));
        });
        teardown(function() {
            helpers.uninstallExtension('golf1052.test-extension', test_helpers.getDefaultSettings());
        });
    });

    suite('isCodeOnPath', function() {
        test('code should be on path', function() {
            assert.ok(helpers.isCodeOnPath(test_helpers.getDefaultSettings()));
        });
    });

    suite('isCodeASnapPackage', function() {
        const expectedReturnValue = {
            value: false,
            path: null
        };
        if (process.platform === 'linux' && process.env.SNAP) {
            expectedReturnValue.value = true;
            let codeString = 'code';
            if (test_helpers.isInsiders()) {
                codeString = 'code-insiders';
            }
            expectedReturnValue.path = path.join(process.env.SNAP, 'usr/share/code/bin', codeString);
        }
        const actualValue = helpers.isCodeASnapPackage(test_helpers.getDefaultSettings());
        assert.equal(actualValue.value, expectedReturnValue.value);
        assert.equal(actualValue.path, expectedReturnValue.path);
    });

    suite('getFolderExtensionInfo', function() {
        test('golf1052.test-extension-0.0.1 has an id of golf1052.test-extension and a version of 0.0.1', function() {
            const info = helpers.getFolderExtensionInfo('golf1052.test-extension-0.0.1');
            assert.equal(info.id, 'golf1052.test-extension');
            assert.equal(info.version, '0.0.1');
        });
        test('golf1052.test-extension has an id of golf1052.test-extension and no version', function() {
            const info = helpers.getFolderExtensionInfo('golf1052.test-extension');
            assert.equal(info.id, 'golf1052.test-extension');
            assert.equal(info.version, '');
        });
        test('(empty string) has no id and no version', function() {
            const info = helpers.getFolderExtensionInfo('');
            assert.equal(info.id, '');
            assert.equal(info.version, '');
        });
    });

    suite('isVersionGreaterThan', function() {
        test('null should be equal to null', () => {
            assert.equal(helpers.isVersionGreaterThan(null, null), 0);
        });
        test('null should be less than empty string', () => {
            assert.equal(helpers.isVersionGreaterThan(null, ''), -1);
        });
        test('empty string should be greater than null', () => {
            assert.equal(helpers.isVersionGreaterThan('', null), 1);
        });
        test('0.0.0 should be equal to 0.0.0', () => {
            assert.equal(helpers.isVersionGreaterThan('0.0.0', '0.0.0'), 0);
        });
        test('1 should be equal to 1.0', () => {
            assert.equal(helpers.isVersionGreaterThan('1', '1.0'), 0);
        });
        test('1.0.1 should be greater than 1.0', () => {
            assert.equal(helpers.isVersionGreaterThan('1.0.1', '1.0'), 1);
        });
        test('1.0.1 should be less than 1.0.2', () => {
            assert.equal(helpers.isVersionGreaterThan('1.0.1', '1.0.2'), -1);
        });
        test('2.0.1 should be greater than 1.0.2', () => {
            assert.equal(helpers.isVersionGreaterThan('2.0.1', '1.0.2'), 1);
        });
        test('0.0.1 should be less than 0.0.2', () => {
            assert.equal(helpers.isVersionGreaterThan('0.0.1', '0.0.2'), -1);
        });
        test('0.0.0.2 should be less than 0.0.1', () => {
            assert.equal(helpers.isVersionGreaterThan('0.0.0.2', '0.0.1'), -1);
        });
    });
});
