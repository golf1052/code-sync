# CodeSync
A VS Code extension that syncs extensions using your favorite file synchronization service (OneDrive, Dropbox, Google Drive, etc.)

## Note that CodeSync currently only automatically imports themes. CodeSync will give a list of other extensions that are missing. You must then install these manually.

## Usage
1. Install CodeSync
2. Relaunch VS Code
3. VS Code will now prompt for the folder to where you want sync extensions. This should be a folder that syncs to your other computers.
4. VS Code will now import any themes in your external folder and will tell you what extensions are missing from your local installation.
5. Code (and install extensions)!
6. When you quit VS Code CodeSync will export your installed extensions to your external folder.

## Commands
(All extensions are prefixed with "CodeSync: ")
- Import extensions: Import extensions from your external folder to your local installation. CodeSync automatically imports extensions upon VS Code's launch.
- Export extensions: Export extensions from your local installation to your external folder. CodeSync automatically exports extensions when VS Code is exiting.
- List missing installed extensions: Lists external extensions not reflected in your local installation.
## At the moment CodeSync only automatically imports themes. Use this command to get a list of extensions you need to install manually.
- List missing external extensions: Lists installed extensions not reflected in your external folder.
- Exclude an installed extension: Exclude an installed extension from syncing to your external folder.
- Exclude an external extension: Exclude an external extension from syncing from your local installation.
- List excluded installed extensions: List excluded extensions that are installed locally.
- List excluded external extensions: List excluded extensions that are in your external folder.
- Remove an exclusion - Installed: Remove an exclusion from your local installation.
- Remove an exclusion - External: Remove an exclusion from your external folder.

## Contributing/Bugs
I've only tested this on Windows 10 with OneDrive. If you have any issues please report them using Issues. Thanks!