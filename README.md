<div align=center>
  <img src="images/New Distrack.jpg" width=225 radius=10 />

# DisTrack
## The VSCode Leaderboard Tracker Extension


This Visual Studio Code extension helps you track and analyze your coding sessions by integrating with Discord and logging coding activity to a MongoDB database. It displays your active coding time, language usage, and various achievements through a dedicated Discord bot. 

| Name | Description | Version | Links
| --- | --- | --- | --- |
| VSCode Extension | Discord VSCode Leaderboard Tracker Extension | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-VSCode-Extension?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-VSCode-Extension), [Marketplace](https://marketplace.visualstudio.com/items?itemName=JayNightmare.distrack) |
| Discord Bot | Discord Bot for tracking coding activity | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Discord-Bot?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Discord-Bot), [Invite](https://discord.com/oauth2/authorize?client_id=1305258645906526328) |
| Discord Manager | Discord bot which manages the Discord server | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Discord-Bot-Management?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Discord-Bot-Management)
| Website | Website for DisTrack | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Website?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Website), [Website](https://distrack.nexusgit.info/) |
| Backend Endpoints | API Endpoints for business logic | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Backend-Endpoint-Server?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Backend-Endpoint-Server)
| Frontend Endpoints | Bot Crawler Rich Embed logic | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Frontend-Endpoint-Server?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Frontend-Endpoint-Server)

</div>

## Table of Contents
- [DisTrack](#distrack)
  - [The VSCode Leaderboard Tracker Extension](#the-vscode-leaderboard-tracker-extension)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Commands](#commands)
  - [Release Workflow](#release-workflow)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- **Coding Session Tracking**: Automatically tracks coding sessions when you start VSCode.
- **Language-Specific Time Tracking**: Records the time spent in each programming language.
- **Discord Integration**: Shows a real-time status in Discord, including the file and language.
- **Achievements**: Gain achievements for milestones based on your total coding time.
- **Profile Management**: View coding stats and achievements through a Discord bot.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/JayNightmare/DisTrack-VSCode-Extension
   ```
2. **Install Dependencies**:
   ```bash
   cd DisTrack-VSCode-Extension
   npm install
   ```
3. **Setup MongoDB**:
   - Ensure MongoDB is installed and running.
   - Create a database and note the connection URI.

4. **Extension Package**:
   ```bash
   vsce package
   ```
   - Run to package the extension to use on VSCode.

## Configuration

1. **MongoDB Setup**:
   - Ensure the IP address for your server is whitelisted in MongoDB Atlas or your MongoDB instance.
   
## Usage

1. **Start VSCode**:
   - When you start VSCode, the extension will automatically begin a coding session and track your active language and coding time.
   
2. **Link Discord**:
   - Click on the status bar item "Link to Discord" and enter your Discord ID to enable activity tracking and achievements through the Discord bot.

3. **Stop Coding Session**:
   - When you close VSCode, the session ends, and your session data is saved to the MongoDB database.

## Commands

- **Profile**: Displays your coding profile, including total coding time, language stats, and achievements.
- **Leaderboard**: View the top users based on total coding time
- **Achievements**: Lists the milestones you’ve achieved
- **Compare**: Compares your stats against another user's stats
- **Freeze Streak**: Freezes your streak
- **Help**: Shows all commands and info about the bot
- **Recents**: Shows information from recent session
- **Set Bio**: Sets the bio for the profile command
- **Bug Reports and Suggestions**: Sends your feedback to the developement team so we can improve the extension and bot

## Release Workflow
To automatically create a release, create a tag through the cli:
```bash
git tag vX.X.X
git push origin --tags
```
Once you push the tag, the release workflow should trigger and create a release package for you on GitHub


## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-branch
   ```
3. Commit changes:
   ```bash
   git commit -m "Add a feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-branch
   ```
5. Open a pull request.

## License

This project is licensed under the Creative Commons Legal Code License. See the [LICENSE](LICENSE) file for more details.
