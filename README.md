# CodeSync
A VSCode extension that syncs extensions, settings, snippets, and keybindings using your favorite file synchronization service (OneDrive, Dropbox, Google Drive, etc.)

Available on
- [Visual Studio Code extension marketplace](https://marketplace.visualstudio.com/items?itemName=golf1052.code-sync)
- [Open VSX Registry](https://open-vsx.org/extension/golf1052/code-sync)

## Toggle Status Bar Icon
With 2.4.0 you can now toggle the CodeSync status bar icon. After upgrading to this version if you do not see the status bar icon open the Command Palette and run **CodeSync: Toggle status bar icon** and it will appear again.

## Local Settings
With 2.3.0 CodeSync brings support for local settings. Need a specific setting to be different between your computers? This feature is for you. Here's how to use it:

1. Browse to where VSCode installs extensions and open CodeSync's director, this is located at ~/.vscode/extensions/golf1052.code-sync-2.3.0
2. Open up `local-settings.json`. If the file doesn't exist try running **CodeSync: Export settings** in VSCode first.
3. Now add settings you want local to the computer you are currently using. The format should look just like VSCode's settings file.
4. Now when CodeSync exports settings it will not export the settings you have in your local settings file. When settings are imported from your sync directory CodeSync will make sure to apply your local settings again.

## Usage
1. Install CodeSync
2. Relaunch VSCode
3. VSCode will now prompt for the folder to where you want sync extensions. This should be a folder that syncs to your other computers.
4. VSCode will now import settings, keybindings, snippets, and extensions from your external folder.
5. Code!
6. When you quit VSCode, CodeSync will export your settings, keybindings, snippets, and extensions to your external folder.

## Commands
(All extensions are prefixed with "CodeSync: ")
- Import all: Import settings, keybindings, snippets, and extensions.
- Export all: Export settings, keybindings, snippets, and extensions.
- Import settings: Import settings.
- Export settings: Export settings.
- Import keybindings: Import keybindings.
- Export keybindings: Export keybindings.
- Import snippets: Import snippets.
- Export snippets: Export snippets.
- Import extensions: Import extensions.
- Export extensions: Export extensions.
- Exclude an installed extension: Exclude an installed extension from syncing to your external folder.
- Exclude an external extension: Exclude an external extension from syncing from your local installation.
- List excluded installed extensions: List excluded extensions that are installed locally.
- List excluded external extensions: List excluded extensions that are in your external folder.
- Remove an exclusion - Installed: Remove an exclusion from your local installation.
- Remove an exclusion - External: Remove an exclusion from your external folder.
- Toggle auto import: Toggle auto import upon VSCode launch.
- Toggle auto export: Toggle auto export upon VSCode launch.
- Toggle import/export settings: Toggle auto importing/exporting of settings.
- Toggle import/export keybindings: Toggle auto importing/exporting of keybindings.
- Toggle import/export snippets: Toggle auto importing/exporting of snippets.
- Toggle import/export extensions: Toggle auto importing/exporting of extensions.
- Set external sync path: Set the external sync path.
- Toggle status bar icon: Toggle the CodeSync status bar icon.

## Uninstalling Extensions

### For 1.31 and above
If you're on VSCode 1.31 or above this is now fixed due to the [extension list update on add, remove, enable, or disable of extensions](https://code.visualstudio.com/updates/v1_31#_extensions-change-event).

### For 1.30 and below
Currently there is no way for CodeSync to know when you have uninstalled an extension. When you uninstall an extension in VSCode it still registers the extension as installed until VSCode is restarted. Because of this when you exit VSCode, CodeSync will export the incorrect list of extensions. When you launch VSCode again CodeSync will reinstall the extension you installed. [There is an open issue in the VSCode repo about this](https://github.com/Microsoft/vscode/issues/14444). In the meantime here's a workaround:

1. Exclude the extension you want to uninstall with the command: **CodeSync: Exclude an installed extension**
2. Now uninstall the extension you just excluded.

When you relaunch VSCode the extension will not be reinstalled by CodeSync anymore.

## Contributing/Bugs
I've done a little testing between two Windows 10 machines and an OS X laptop. If you have any issues please report them using Issues. Thanks!
