import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as settings from '../../src/settings';
import * as test_helpers from './test-helpers';

suite('settings.ts', () => {
    let testingResources: test_helpers.TestingResources;
    let testDir: string;
    let settingsFile: string;
    let externalExtensionsFile: string;
    let codeSyncSettings: settings.CodeSyncSettings;

    suiteSetup(function() {
        // create directory for test, will clean up after test is complete
        testingResources = test_helpers.createTestingResources();
        testDir = testingResources.directories[0];
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir);
        }

        settingsFile = path.join(testDir, 'settings.json');
        testingResources.files.push(settingsFile);
        if (!fs.existsSync(settingsFile)) {
            let initialSettings: settings.Settings = {
                $schema: './schema/settings.schema.json',
                externalPath: testDir,
                autoImport: true,
                autoExport: true,
                importSettings: true,
                importKeybindings: true,
                importSnippets: true,
                importExtensions: true,
                showStatusBarIcon: true,
                excluded: {
                    installed: [],
                    external: []
                },
                executableName: '',
                settingsPath: ''
            };
            fs.writeFileSync(settingsFile, Buffer.from(JSON.stringify(initialSettings)));
        }
        externalExtensionsFile = path.join(testDir, 'extensions.json');
        if (!fs.existsSync(externalExtensionsFile)) {
            let initialExtensionsFile = {
                extensions: []
            };
            fs.writeFileSync(externalExtensionsFile, Buffer.from(JSON.stringify(initialExtensionsFile)));
        }
        testingResources.files.push(externalExtensionsFile);
        codeSyncSettings = new settings.CodeSyncSettings(settingsFile, externalExtensionsFile);
    });

    suite('save', function() {
        test('Saving modified settings should be persisted', function() {
            let internalSettings = codeSyncSettings.Settings;
            internalSettings.showStatusBarIcon = false;
            codeSyncSettings.Settings = internalSettings;
            codeSyncSettings.save();
            let newInternalSettings = codeSyncSettings.Settings;
            assert.equal(newInternalSettings.showStatusBarIcon, false);
        });
    });

    suite('saveExtensions', function() {
        test('Saving modified extensions list should be persisted', function() {
            let extensions = codeSyncSettings.Extensions;
            extensions.push('test.test');
            codeSyncSettings.Extensions = extensions;
            codeSyncSettings.saveExtensions();
            let newExtensions = codeSyncSettings.Extensions;
            assert.deepEqual(newExtensions, ['test.test']);
            codeSyncSettings.Extensions = [];
            codeSyncSettings.saveExtensions();
        });
    });

    suite('Settings', function() {
        test('get Settings', function() {
            let internalSettings = codeSyncSettings.Settings;
            assert.equal(internalSettings.autoImport, true);
        });

        test('set Settings', function() {
            let internalSettings = codeSyncSettings.Settings;
            internalSettings.executableName = 'code';
            codeSyncSettings.Settings = internalSettings;
            codeSyncSettings.save();
            let newInternalSettings = codeSyncSettings.Settings;
            assert.equal(newInternalSettings.executableName, 'code');
        });
    });

    suite('ExcludedInstalledPackages', function() {
        test('get ExcludedInstalledPackages', function() {
            // need to use deepEqual to check if arrays are equal
            assert.deepEqual(codeSyncSettings.ExcludedInstalledPackages, []);
        });

        test('set ExcludedInstalledPackages', function() {
            let packages = ['test.test'];
            codeSyncSettings.ExcludedInstalledPackages = packages;
            codeSyncSettings.save();
            assert.deepEqual(codeSyncSettings.ExcludedInstalledPackages, packages);
        });
    });

    suite('ExcludeExternalPackages', function() {
        test('get ExcludedExternalPackages', function() {
            assert.deepEqual(codeSyncSettings.ExcludedExternalPackages, []);
        });

        test('set ExcludedExternalPackages', function() {
            let packages = ['test.test'];
            codeSyncSettings.ExcludedExternalPackages = packages;
            codeSyncSettings.save();
            assert.deepEqual(codeSyncSettings.ExcludedExternalPackages, packages);
        });
    });

    suite('Extensions', function() {
        test('get Extensions', function() {
            assert.deepEqual(codeSyncSettings.Extensions, []);
        });

        test('set Extensions', function() {
            let packages = ['test.test'];
            codeSyncSettings.Extensions = packages;
            codeSyncSettings.saveExtensions();
            assert.deepEqual(codeSyncSettings.Extensions, packages);
        });
    });

    suite('ExternalExtensionsPath', function() {
        test('get ExternalExtensionsPath', function() {
            assert.equal(codeSyncSettings.ExternalExtensionsPath, path.join(testDir, 'extensions.json'));
        });

        test('set ExternalExtensionsPath', function() {
            codeSyncSettings.ExternalExtensionsPath = '';
            assert.equal(codeSyncSettings.ExternalExtensionsPath, '');
            codeSyncSettings.ExternalExtensionsPath = path.join(testDir, 'extensions.json');
        });
    });

    suiteTeardown(function() {
        test_helpers.destroyTestingResources(testingResources);
    });
});
