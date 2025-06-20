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
- Runs tests
- Builds the extension
- Uploads build artifacts
- Performs security audits

### 🏷️ Release (`release.yml`)
**Triggers:** Push of version tags (e.g., `v1.0.0`)
**Purpose:** Automated release creation and VSIX packaging

- Builds and tests the extension
- Creates a VSIX package
- Generates a GitHub release with release notes
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
- Runs tests
- Builds the extension
- Comments on PR with status

### 🔒 Dependency Update (`dependency-update.yml`)
**Triggers:** Weekly schedule (Mondays 9 AM UTC), Manual dispatch
**Purpose:** Monitors dependencies for security updates

- Checks for outdated dependencies
- Runs security audits
- Creates issues for high/critical security vulnerabilities
- Helps maintain security posture

## Required Secrets

To use these workflows, you'll need to set up the following secrets in your GitHub repository:

### `VSCE_PAT` (Required for publishing)
- **Purpose:** Personal Access Token for VS Code Marketplace
- **How to get:** 
  1. Go to https://dev.azure.com
  2. Create a Personal Access Token with Marketplace (Publish) permissions
  3. Add it to your repository secrets

### Optional Secrets
- `DISCORD_WEBHOOK_URL`: Discord webhook URL for notifications (if you want Discord integration)

## Usage

### Creating a Release
1. Update version in `package.json`
2. Commit and push changes
3. Create and push a tag: `git tag v1.0.0 && git push origin v1.0.0`
4. The release workflow will automatically:
   - Build the extension
   - Create a GitHub release
   - Package the VSIX file
   - Publish to VS Code Marketplace (if VSCE_PAT is configured)

### Manual Workflow Dispatch
- The Dependency Update workflow can be run manually from the Actions tab
- Useful for checking dependencies outside the weekly schedule

## Workflow Dependencies

```
CI ← PR Check
Release ← Publish
```

The workflows are designed to work together:
- CI runs on every push and PR
- Release creates releases when tags are pushed
- Publish automatically publishes to marketplace when releases are created
- PR Check provides feedback on pull requests
- Dependency Update monitors security

## Troubleshooting

### Common Issues
1. **Build fails**: Check Node.js version compatibility
2. **Publish fails**: Verify VSCE_PAT secret is correctly set
3. **Tests fail**: Ensure all tests pass locally before pushing
4. **Linting fails**: Run `npm run lint` locally to fix issues

### Local Testing
Before pushing, run these commands locally:
```bash
npm ci
npm run lint
npm run compile
npm run test
npm run package
``` 