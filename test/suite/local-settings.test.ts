import * as assert from 'assert';
import * as fs from 'fs';
import * as local_settings from '../../src/local-settings';
import * as path from 'path';
import * as test_helpers from './test-helpers';

suite('local-settings.ts', function() {
    let testingResources: test_helpers.TestingResources;
    let testDir: string;
    let localSettings: local_settings.LocalSettings;
    let localSettingsFile: string;
    let internalSettingsFile: string;
    let externalSettingsFile: string;
    let localSettingsObject: any;

    suiteSetup(function() {
        testingResources = test_helpers.createTestingResources();
        testDir = testingResources.directories[0];
        localSettings = new local_settings.LocalSettings(testDir);

        localSettingsFile = path.join(testDir, local_settings.LOCAL_SETTINGS);
        fs.writeFileSync(localSettingsFile, Buffer.from(JSON.stringify({})));
        testingResources.files.push(localSettingsFile);

        internalSettingsFile = path.join(testDir, 'internal-settings.json');
        fs.writeFileSync(internalSettingsFile, Buffer.from(JSON.stringify({})));
        testingResources.files.push(internalSettingsFile);

        externalSettingsFile = path.join(testDir, 'external-settings.json');
        fs.writeFileSync(externalSettingsFile, Buffer.from(JSON.stringify({})));
        testingResources.files.push(externalSettingsFile);

        localSettingsObject = {
            test: {
                setting1: true
            }
        };
        localSettingsObject['test.setting2'] = true;
        fs.writeFileSync(localSettingsFile, Buffer.from(JSON.stringify(localSettingsObject)));
    });

    suite('importSettings', function() {
        test('Importing settings includes local settings', function() {
            this.timeout(0);
            localSettings.import(externalSettingsFile, internalSettingsFile);
            let parsedInternalSettings: any = JSON.parse(fs.readFileSync(internalSettingsFile, 'utf-8'));
            assert.deepStrictEqual(parsedInternalSettings, localSettingsObject);
        });
    });

    suite('exportSettings', function() {
        test('Exporting settings excludes local settings', function() {
            this.timeout(0);
            localSettings.export(internalSettingsFile, externalSettingsFile);
            let parsedExternalSettings: any = JSON.parse(fs.readFileSync(externalSettingsFile, 'utf-8'));
            assert.deepStrictEqual(parsedExternalSettings, {});
        });
    });

    suiteTeardown(function() {
        test_helpers.destroyTestingResources(testingResources);
    });
});
