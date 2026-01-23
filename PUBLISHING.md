# Publishing @homelocal/auth

## Prerequisites

1. Access to private npm registry (GitHub Packages, Artifactory, Verdaccio, etc.)
2. Node.js 18+ with npm

## Build

```bash
cd packages/homelocal-auth-react

# Install dependencies
npm install

# Build package
npm run build

# This creates:
#   dist/index.js
#   dist/index.d.ts
#   dist/axios.js
#   dist/axios.d.ts
#   (and other module files)
```

## Publishing Options

### Option A: GitHub Packages (Recommended)

1. **Configure package.json for GitHub Packages:**

   The package.json should already have:
   ```json
   {
     "name": "@homelocal/auth",
     "repository": {
       "type": "git",
       "url": "https://github.com/homelocal/homelocal-auth-react"
     }
   }
   ```

2. **Create .npmrc for publishing:**
   ```bash
   # .npmrc (in package root)
   @homelocal:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

3. **Publish:**
   ```bash
   GITHUB_TOKEN=ghp_your_token npm publish
   ```

4. **Consumer configuration:**
   ```bash
   # In consuming project's .npmrc
   @homelocal:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

   Then:
   ```bash
   npm install @homelocal/auth@0.1.0
   ```

### Option B: Private npm Registry (Verdaccio, Artifactory)

1. **Configure .npmrc:**
   ```bash
   # .npmrc
   registry=https://npm.homelocal.internal/
   //npm.homelocal.internal/:_authToken=${NPM_TOKEN}
   ```

2. **Publish:**
   ```bash
   npm publish --registry https://npm.homelocal.internal/
   ```

3. **Consumer configuration:**
   ```bash
   npm install @homelocal/auth@0.1.0 --registry https://npm.homelocal.internal/
   ```

### Option C: AWS CodeArtifact

1. **Login:**
   ```bash
   aws codeartifact login --tool npm --domain homelocal --repository npm
   ```

2. **Publish:**
   ```bash
   npm publish
   ```

## Versioning

Update version in `package.json`:

```json
{
  "version": "0.1.0"
}
```

Follow semantic versioning:
- **Patch** (0.1.1): Bug fixes, no API changes
- **Minor** (0.2.0): New features, backwards compatible
- **Major** (1.0.0): Breaking API changes

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Publish Package

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'

      - name: Install dependencies
        working-directory: packages/homelocal-auth-react
        run: npm ci

      - name: Build
        working-directory: packages/homelocal-auth-react
        run: npm run build

      - name: Publish
        working-directory: packages/homelocal-auth-react
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Consuming in Railway-deployed Frontend

Add `.npmrc` to frontend-service:

```bash
# frontend-service/.npmrc
@homelocal:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Add to `package.json`:

```json
{
  "dependencies": {
    "@homelocal/auth": "^0.1.0"
  }
}
```

Set `GITHUB_TOKEN` as Railway environment variable.

## Peer Dependencies

Consumers must have these installed:
- `react` >= 18.0.0
- `axios` >= 1.0.0

The package uses peer dependencies to avoid bundling React/axios multiple times.
