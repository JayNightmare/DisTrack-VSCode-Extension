<div align=center>
  <img src="./images/New Distrack.jpg"/>

# Change Log

</div>


All notable changes to the "DisTrack" extension will be documented in this file.

## Patch Notes
# v0.9.0
This pull request introduces a major refactor and enhancement to the authentication, API client, and session management in the extension, moving toward a more robust, scalable, and testable architecture. The changes include a new token management system, improved API request handling, a queue for session data with retry logic, and significant updates to how user profile and leaderboard data are loaded and displayed in the panel. Several new dependencies are also added to support these features.

**Authentication and Token Management:**

* Introduced a new `tokenManager` module to handle device ID generation, secure token storage, refresh logic, and authorization header generation, replacing the previous ad-hoc approach. This ensures more reliable authentication and error handling throughout the extension.

**API Client and Endpoint Abstractions:**

* Added a generic API client (`src/api/client.ts`) that centralizes HTTP requests, handles token refresh on 401 errors, and supports request customization. This improves code reuse and error handling for all API interactions.
* Added new modules for managing the API base URL (`src/api/baseUrl.ts`) and the link flow (`src/api/link.ts`), making these concerns modular and easier to maintain. [[1]](diffhunk://#diff-88bad4db43d3e3789c8888efa75d371723cb1d192224e468d3108c34dd14ed89R1-R39) [[2]](diffhunk://#diff-c38fda2523bd6b5c20a503db7e5671163af9049d92bdc0d06672c644f9d12905R1-R62)

**Session Data Management:**

* Implemented a persistent, retryable session queue (`src/sessions/sessionQueue.ts`) that batches and retries session data uploads to the server, improving reliability in case of network issues or API downtime.

**Panel and Profile Data Handling:**

* Refactored the panel (`src/panel.ts`) to use the new user profile API, removing reliance on Discord IDs stored in global state. The panel now loads profile, leaderboard, streak, and language data using the new API modules and displays them more robustly, with improved error handling and clearer logic for user ranking and display. [[1]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL3-R9) [[2]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL79-R122) [[3]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaR136-L116) [[4]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaR151-R164) [[5]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaR173-R179) [[6]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL195) [[7]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL242-R268) [[8]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL302-R343)

**Dependency and Version Updates:**

* Updated `package.json` to add dependencies for `uuid`, its types, and new API modules, and bumped the extension version to `0.9.0`. [[1]](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519L5-R5) [[2]](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519R134) [[3]](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519L151-R153)

---

**Authentication & Token Management**
- Added `src/auth/tokenManager.ts` to securely manage device IDs, access/refresh tokens, and handle token refresh logic, replacing previous global state usage.
- Device IDs are now generated and persisted using UUIDs, ensuring uniqueness per installation.

**API Client & Endpoint Abstractions**
- Created `src/api/client.ts` for centralized, authenticated API requests with automatic token refresh and error handling.
- Added `src/api/baseUrl.ts` to dynamically resolve the API base URL from an asset file, supporting flexible deployments.
- Added `src/api/link.ts` to handle the user linking flow with the backend.

**Session Data Management**
- Implemented `src/sessions/sessionQueue.ts`, a persistent queue for session data with periodic flushing and retry logic, improving resilience against connectivity issues.

**Panel & User Data Refactor**
- Refactored `src/panel.ts` to use the new profile API, loading all user data (profile, leaderboard, streak, languages) via the new modules, and updated the UI logic to reflect these changes. [[1]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL3-R9) [[2]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL79-R122) [[3]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaR136-L116) [[4]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaR151-R164) [[5]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaR173-R179) [[6]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL195) [[7]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL242-R268) [[8]](diffhunk://#diff-191e52f15eee2d8ea14130cbcf628ed5cfc2a43183272727705daa907f21decaL302-R343)

**Dependencies & Version**
- Added `uuid` and `@types/uuid` as dependencies, and bumped the extension version to `0.9.0`. [[1]](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519L5-R5) [[2]](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519R134) [[3]](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519L151-R153)

# v0.8.4 - v0.8.9
Version testing failed, skipped versions due to microsoft secrets leaking. This meant that these versions never became public.

# v0.8.3
* Added full restart logic for Discord Rich Presence when using "Refresh Discord RPC" command.
* Visual feedback: spinner in status bar and progress notification during refresh.
* Prevents concurrent refresh attempts and avoids duplicate RPC listeners.
* Minor internal refactor of RPC lifecycle for stability.

# v0.8.1
* Minor Security Update

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
* Updated Name - Discord VSCode Tracker to DisTrack | Discord VSCode Leaderboard Tracker

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
