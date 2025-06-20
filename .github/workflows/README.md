# GitHub Workflows

This directory contains GitHub Actions workflows for the DisTrack VS Code Extension project.

## Workflows

### 🔄 CI (`ci.yml`)
**Triggers:** Push to `master`/`develop` branches, Pull Requests to `master`
**Purpose:** Continuous Integration pipeline that ensures code quality

- Runs on Node.js 18.x and 20.x
- Installs dependencies with `npm ci`
- Runs ESLint for code quality
- Compiles TypeScript code
- Builds the extension
- Uploads build artifacts
- Performs security audits (high level only)

### 🏷️ Release (`release.yml`)
**Triggers:** Push of version tags (e.g., `v1.0.0`)
**Purpose:** Automated release creation and VSIX packaging

- Builds and tests the extension
- Creates a VSIX package
- Generates comprehensive release notes including:
  - Full changelog from CHANGELOG.md
  - Detailed usage instructions
  - Troubleshooting guide for common errors
- Creates a draft GitHub release with release notes
- Uploads VSIX file as release asset
- Stores build artifacts

### 📦 Publish (`publish.yml`)
**Triggers:** When a release is published
**Purpose:** Publishes the extension to VS Code Marketplace

- Builds the extension
- Creates VSIX package
- Publishes to VS Code Marketplace using VSCE
- Requires `VSCE_PAT` secret for marketplace authentication

### ✅ PR Check (`pr-check.yml`)
**Triggers:** Pull Requests to `master`/`develop`
**Purpose:** Code quality checks for pull requests

- Checks code formatting with Prettier
- Runs ESLint
- Performs TypeScript type checking
- Builds the extension
- Comments on PR with status

### 🔒 Dependency Update (`dependency-update.yml`)
**Triggers:** Weekly schedule (Mondays 9 AM UTC), Manual dispatch
**Purpose:** Monitors dependencies for security updates

- Checks for outdated dependencies
- Creates issues for high/critical security vulnerabilities
- Helps maintain security posture

## Required Secrets

To use these workflows, you'll need to set up the following secrets in your GitHub repository:

### `TOKEN` (Required for releases)
- **Purpose:** GitHub Personal Access Token for creating releases
- **How to get:** 
  1. Go to GitHub Settings > Developer settings > Personal access tokens
  2. Create a token with `repo` permissions
  3. Add it to your repository secrets as `TOKEN`

### `VSCE_PAT` (Required for publishing)
- **Purpose:** Personal Access Token for VS Code Marketplace
- **How to get:** 
  1. Go to https://dev.azure.com
  2. Create a Personal Access Token with Marketplace (Publish) permissions
  3. Add it to your repository secrets

## Usage

### Creating a Release
1. Update version in `package.json`
2. Commit and push changes
3. Create and push a tag: `git tag v1.0.0 && git push origin v1.0.0`
4. The release workflow will automatically:
   - Build the extension
   - Create a draft GitHub release with comprehensive notes
   - Package the VSIX file
   - Include detailed usage instructions and troubleshooting guide
   - Publish to VS Code Marketplace (if VSCE_PAT is configured)

### Manual Workflow Dispatch
- The Dependency Update workflow can be run manually from the Actions tab
- Useful for checking dependencies outside the weekly schedule

## Release Notes Features

The release workflow now generates comprehensive release notes that include:

- **Full Changelog**: Links to the complete CHANGELOG.md
- **Patch Notes**: Extracted from CHANGELOG.md for the specific version
- **Usage Instructions**: Step-by-step guide for setting up and using the extension
- **Troubleshooting**: Common error messages and their solutions
- **Installation Guide**: Complete process from unzipping to running the extension

## Workflow Dependencies

```
CI ← PR Check
Release ← Publish
```

The workflows are designed to work together:
- CI runs on every push and PR
- Release creates draft releases when tags are pushed
- Publish automatically publishes to marketplace when releases are created
- PR Check provides feedback on pull requests
- Dependency Update monitors security

## Troubleshooting

### Common Issues
1. **Build fails**: Check Node.js version compatibility
2. **Publish fails**: Verify VSCE_PAT secret is correctly set
3. **Release fails**: Verify TOKEN secret is correctly set
4. **Linting fails**: Run `npm run lint` locally to fix issues

### Local Testing
Before pushing, run these commands locally:
```bash
npm ci
npm run lint
npm run compile
npm run package
``` 