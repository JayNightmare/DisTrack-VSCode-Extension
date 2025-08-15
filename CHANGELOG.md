# Change Log

All notable changes to the "DisTrack" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Patch Notes
# v0.8.0
* Major Fix:
  * Updated login process
  * Created new endpoints
  * Created Public endpoints which the public can fetch from to display the leaderboard from other websites
  * Fixed memory leak with session timer and vscode extension
  * Fixed bug with username not being set when using the vscode extension
  * Leaderboard update


* Minor Fix:
  * Improved the security of the backend
  * Added endpoint to cloudflare
  * Added auth to validate endpoint data
  * Updated the website
  * Database variable updates
  * Improved language support
  * Added root server endpoint easter egg
  * Improved overall performance


# v0.7.11
* Updated the VSCode Engine Versionand VCSE Type to 1.96.2 so it can run on other VSCode IDE versions

# v0.7.1-beta
* Added comprehensive GitHub workflows for CI/CD automation
* Implemented automated release management with detailed release notes
* Added VS Code Marketplace publishing automation
* Enhanced pull request quality checks and feedback
* Added dependency security monitoring
* Improved release notes generation with usage instructions and troubleshooting
* Added automated VSIX packaging and artifact management
* Implemented draft release creation for better release management
* Added comprehensive documentation for GitHub workflows

# v0.6.9
* Fixed Auth bot token issue
* Added Profile tab
* Added new styling to leaderboard
* New API endpoint for fetching data
* Extension reformatting
* Panel.ts reformatting
* Using .txt file to grab bot token and endpoint url.

# v0.6.8
* Fixed extension load issue.
  * I was dumb and did `npm run compile` instead of `npm run package`. stfu

## v0.6.7
* Added the endpoint and bot token back in. *totally didn't forget to put it in hehehehe*

## v0.6.6
* Removed watch and watch-test from build start-up

### v0.6.5
* **MAYOR:** Added side panel so you can view the leaderboard!
* Fixed issue where session timer wouldn't appear on some instances.
* Fixed issue where times wouldn't be tracked correctly.
* Removed tasks from .vscode folder.
* Added more detailed error messages for debugging purposes.
* Updated api.ts file with new endpoint url waypoint.
  * Before: `https://example.com:5050/code-session`
  * After: `https://example.com:5050`
* Updated Dependancies to latest versions.
* Updated package.json file with new view options.

### v0.6.4
* **MAJOR:** Fixed compile error which prevented the extension to load. This was due to a task which looked for errors when the extension was loading, but was not properly configured to handle the new version of the extension, causing it to get stuck and prevent the extension from completely loading.

### v0.6.2
* Updated Name - Discord VSCode Tracker to Dis.Track | Discord VSCode Leaderboard Tracker

### v0.6.1
* **MAJOR:** Fixed bug where extension would not appear on the status bar.
* Fixed bug where the extension would not work properly if the user had multiple instances of the same track.


### v0.6.0
* Fixed issue where extension would not check the username, returning "null" when the leaderboard was requested.
* **Minor:** Added Discord API to check if user ID given was a valid user.

### v0.5.9
* Improved error handling for invalid user ID.
* Refactored code to make it more readable and maintainable.
  * Added comments for better documentation
