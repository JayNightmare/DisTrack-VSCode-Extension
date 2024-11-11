# VSCode Coding Tracker Extension

This Visual Studio Code extension helps you track and analyze your coding sessions by integrating with Discord and logging coding activity to a MongoDB database. It displays your active coding time, language usage, and various achievements through a dedicated Discord bot.

## Table of Contents
- [VSCode Coding Tracker Extension](#vscode-coding-tracker-extension)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Commands](#commands)
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
   git clone https://github.com/yourusername/vscode-coding-tracker.git
   ```
2. **Install Dependencies**:
   ```bash
   cd vscode-coding-tracker
   npm install
   ```
3. **Setup MongoDB**:
   - Ensure MongoDB is installed and running.
   - Create a database named `vscode-tracker` and note the connection URI.

## Configuration

1. **Set Environment Variables**:
   - Create a `.env` file in the root directory with the following variables:
     ```plaintext
     MONGODB_URI=your_mongodb_connection_uri
     DISCORD_CLIENT_ID=your_discord_application_client_id
     ```
2. **MongoDB Setup**:
   - Ensure the IP address for your server is whitelisted in MongoDB Atlas or your MongoDB instance.
   
## Usage

1. **Start VSCode**:
   - When you start VSCode, the extension will automatically begin a coding session and track your active language and coding time.
   
2. **Link Discord**:
   - Click on the status bar item "Link to Discord" and enter your Discord ID to enable activity tracking and achievements through the Discord bot.

3. **Stop Coding Session**:
   - When you close VSCode, the session ends, and your session data is saved.

## Commands

- **Profile**: Displays your coding profile, including total coding time, language stats, and achievements.
- **Leaderboard**: View the top users based on total coding time.
- **Achievements**: Lists the milestones you’ve achieved.

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

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.