# Change Log
All notable changes to the "code-sync" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.7.3] - 2020-10-10
## Added
- Added a CHANGELOG.md
- Added a CONTRIBUTING.md

## Removed
- Removed support for VSCode 1.13 making the minimum required VSCode version 1.14 because the minimum `@types/vscode` version is 1.14. This is a minor version bump because VSCode 1.13 is over 3 years old now so nobody should be using that version.

## Fixed
- Upgraded dependencies

## [2.7.2] - 2020-05-17
## Fixed
- Fix Linux VSCode non Snap package bug

## [2.7.1] - 2020-05-09
## Fixed
- Bug where extension would not load in some cases due to not being able to find `settings.json`
- Bug where extensions would not export correctly

## [2.7.0] - 2020-05-09
## Added
- If you use a non standard install of VSCode you can now set the name of the VSCode executable or the VSCode user settings path that CodeSync will use. The new commands added are `CodeSync: Set VSCode executable name` and `CodeSync: Set VSCode settings path`. See #41. Thanks to @convexshiba for this feature request.

## [2.6.2] - 2020-01-03
## Fixed
- Code not found on path errors when VSCode was installed through Snap on Linux. See https://github.com/golf1052/code-sync/issues/38

## [2.6.1] - 2019-10-13
## Fixed
- CodeSync will not migrate your settings files from a previous version of CodeSync if your current CodeSync version already has settings files. This means that any new settings will not be overwritten by your previous version's settings.
- The status bar will now be correctly reset if CodeSync could not find VSCode's settings file when trying to export settings.
- Added more logging when exporting settings.

## [2.6.0] - 2019-10-12
## Fixed
- Updated chokidar to version 3 which should [provide performance improvements](https://paulmillr.com/posts/chokidar-3-save-32tb-of-traffic/).

## [2.5.3] - 2018-01-03
## Fixed
- Export extensions after import has completed. Rarely, CodeSync would not be able to export extensions before the extension was deactivated so this guarantees the list of installed extensions gets saved at least once.

## [2.5.2] - 2018-01-02
## Fixed
- Only tries to install extensions that are not reported as being installed when importing extensions. Fixes https://github.com/golf1052/code-sync/issues/30. Thanks to @wesmdemos for the report.

## [2.5.0] - 2017-10-08
## Added
- Adds support for the Insiders version of VSCode. See https://github.com/golf1052/code-sync/issues/26. Thanks to @brianary for the report.

## [2.4.0] - 2017-08-10
## Added
- Adds the ability to toggle the status bar icon. See https://github.com/golf1052/code-sync/issues/25. Thanks to @gnowland for suggesting this.
- Also added logging. CodeSync will log what it is doing in an output channel called CodeSync. If you have issues please include your CodeSync log.

## [2.3.2] - 2017-07-26
## Fixed
- Actually fix https://github.com/golf1052/code-sync/issues/23

## [2.3.1] - 2017-07-23
## Fixed
- Fixed https://github.com/golf1052/code-sync/issues/23

## [2.3.0] - 2017-07-22
## Added
- Added support for local settings. Thanks to @drdaeman for the idea: https://github.com/golf1052/code-sync/issues/17

## Fixed
- Mitigated https://github.com/golf1052/code-sync/issues/9. You will now be able to use CodeSync to import or export settings, snippets, or keybindings even if CodeSync thinks `code` is not on your path.
- Provided workaround for https://github.com/golf1052/code-sync/issues/19. See the README on how to uninstall extensions with CodeSync installed.

## [2.2.0] - 2017-02-08
## Changed
- Instead of exporting on extension deactivate, export when files change by using file watcher. This improves the reliability of auto file exporting.

## [2.1.2] - 2017-02-07
## Fixed
- More checks for empty files

## [2.1.1] - 2016-12-03
## Fixed
- When changing external sync path, reset extensions path (see https://github.com/golf1052/code-sync/pull/15)

## [2.1.0] - 2016-09-15
## Added
- New command to re-setup the external sync location

## Fixed
- Don't wipe out settings if settings file is blank

## [2.0.0] - 2016-08-07
- Rewrote extension

## [1.0.2] - 2016-01-01
## Fixed
- CodeSync will now migrate settings to the new version folder when upgrading.

## [1.0.1] - 2015-12-31
## Fixed
- Needed to add version number for code-sync extension folder

## [1.0.0] - 2015-12-31
- Initial release
