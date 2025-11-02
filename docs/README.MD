# Developer Documentation

Welcome to the developer documentation for our project! This guide provides an overview of the project's architecture, setup instructions, coding standards, and contribution guidelines.#

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