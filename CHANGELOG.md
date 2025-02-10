# Change Log

All notable changes to the "DisTrack" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Patch Notes
### v0.6.3
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
