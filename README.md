<div align=center>
  <img src="images/New Distrack.jpg" width=225 radius=10 />

# DisTrack (Beta)
## The VSCode Leaderboard Tracker Extension

This Visual Studio Code extension helps you track and analyze your coding sessions by integrating with Discord and logging coding activity to a MongoDB database. It displays your active coding time, language usage, and various achievements through a dedicated Discord bot. 

| Name | Description | Stable Version | Links
| --- | --- | --- | --- |
| VSCode Extension | Discord VSCode Leaderboard Tracker Extension | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-VSCode-Extension?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-VSCode-Extension), [Marketplace](https://marketplace.visualstudio.com/items?itemName=JayNightmare.distrack) |
| Discord Bot | Discord Bot for tracking coding activity | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Discord-Bot?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Discord-Bot), [Invite](https://discord.com/oauth2/authorize?client_id=1305258645906526328) |
| Discord Manager | Discord bot which manages the Discord server | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Discord-Bot-Management?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Discord-Bot-Management)
| Website | Website for DisTrack | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Website?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Website), [Website](https://distrack.nexusgit.info/) |
| Backend Endpoints | API Endpoints for business logic | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Backend-Endpoint-Server?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Backend-Endpoint-Server)
| Frontend Endpoints | Bot Crawler Rich Embed logic | ![Latest Release](https://img.shields.io/github/v/release/JayNightmare/DisTrack-Frontend-Endpoint-Server?label=Latest%20Release) | [GitHub](https://github.com/JayNightmare/DisTrack-Frontend-Endpoint-Server)

</div>

## Table of Contents
- [DisTrack (Beta)](#distrack-beta)
  - [The VSCode Leaderboard Tracker Extension](#the-vscode-leaderboard-tracker-extension)
  - [Table of Contents](#table-of-contents)
  - [What is DisTrack?](#what-is-distrack)
  - [Getting Started](#getting-started)
  - [Features](#features)
  - [Usage](#usage)
  - [Discord Bot Commands](#discord-bot-commands)
  - [License](#license)


## What is DisTrack?
DisTrack is a Visual Studio Code extension designed to help developers monitor and analyze their coding sessions. By integrating with Discord, it provides real-time updates on your coding activity, including the programming languages you use and the time spent coding. The extension also features a dedicated Discord bot that tracks your achievements and displays your coding stats through various commands. All session data is logged to a MongoDB database, allowing for persistent storage and analysis of your coding habits.

In addition to tracking individual coding sessions, DisTrack offers a leaderboard feature that lets you compare your coding time with other users. This gamified approach encourages consistent coding habits and fosters a sense of community among developers.

The [website](https://distrack.nexusgit.info/) also provides a user-friendly interface to view your coding stats, achievements, and leaderboard rankings. Whether you're a solo developer or part of a team, DisTrack is a valuable tool for enhancing productivity and staying motivated in your coding journey.


## Getting Started
1. **Install the Extension**:
   - Open Visual Studio Code.
   - Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
   - Search for "DisTrack" and click "Install" on the DisTrack extension.
   - Alternatively, you can install it directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=JayNightmare.distrack) or the downloads page on the [DisTrack website](https://distrack.nexusgit.info/).
   - After installation, restart VSCode to activate the extension.

2. **Link Your Discord Account**:
   - Once the extension is installed, you will see a status bar item labeled "Link to DisTrack".
   - Click on it and follow the prompt to the DisTrack Linking page.
   - Login using Discord and copy the code provided on the page and enter it in the input box in VSCode.
   - This will link your Discord account to the extension, allowing it to track your coding activity and display it on Discord.

3. **Start Coding**:
   - Open a project or create a new file in VSCode.
   - The extension will automatically start tracking your coding session, including the time spent and the programming languages used.
   - Your Discord status will update in real-time to reflect your current coding activity.
   - The RPC will show:
     - Editing `< file name >` in `< IDE >`
     - Time spent coding
     - Language: `< language >` (`< Current Line > ` of `< Total Lines >`)
   - When you close VSCode, the session will end, and your coding data will be logged to the MongoDB database.

4. **View Your Stats**:
   - Use the DisTrack Discord bot to view your coding stats, achievements, and leaderboard rankings.
   - You can also visit the [DisTrack website](https://distrack.nexusgit.info/) to see a detailed overview of your coding activity and compare your stats with other users.

## Features

- **Coding Session Tracking**: Automatically tracks coding sessions when you start VSCode.
- **Language-Specific Time Tracking**: Records the time spent in each programming language.
- **Discord Integration**: Shows a real-time status in Discord, including the file and language.
- **Achievements**: Gain achievements for milestones based on your total coding time.
- **Profile Management**: View coding stats and achievements through a Discord bot.
- **Leaderboard**: Compare your coding time with other users on a leaderboard.
- **Session Logging**: All session data is logged to a MongoDB database for persistent storage and analysis.
- **Real-time Updates**: Get real-time updates on your coding activity through the website.
  
## Usage

1. **Start VSCode**:
   - When you start VSCode, the extension will automatically begin a coding session and track your active language and coding time.
   
2. **Link Discord**:
   - Click on the status bar item "Link to Discord" and enter your Discord ID to enable activity tracking and achievements through the Discord bot.

3. **Stop Coding Session**:
   - When you close VSCode, the session ends, and your session data is saved to the MongoDB database.

## Discord Bot Commands

- **Profile**: Displays your coding profile, including total coding time, language stats, and achievements.
- **Leaderboard**: View the top users based on total coding time
- **Achievements**: Lists the milestones you’ve achieved
- **Compare**: Compares your stats against another user's stats
- **Freeze Streak**: Freezes your streak
- **Help**: Shows all commands and info about the bot
- **Recents**: Shows information from recent session
- **Set Bio**: Sets the bio for the profile command
- **Bug Reports and Suggestions**: Sends your feedback to the developement team so we can improve the extension and bot

## License

This project is licensed under the Creative Commons Legal Code License. See the [LICENSE](LICENSE) file for more details.
