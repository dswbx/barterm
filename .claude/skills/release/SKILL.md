---
name: release
description: Create a new release for Barterm. Increments the version, updates all version references, commits, tags, and publishes a GitHub release. Use when the user asks to release, bump version, or create a new version.
---

# Release

Create a new versioned release for Barterm.

## Steps

### 1. Determine the version bump

Ask the user which bump type they want: **patch** (0.1.0 -> 0.1.1), **minor** (0.1.0 -> 0.2.0), or **major** (0.1.0 -> 1.0.0). If the user already specified the bump type or target version, skip asking.

### 2. Update version in all source files

Replace the old version string with the new one in these files:

- `package.json` - the `"version"` field
- `src-tauri/tauri.conf.json` - the `"version"` field
- `src-tauri/Cargo.toml` - the `version` field in `[package]`
- `about.html` - the `Version X.Y.Z` text

Then run `npm install` to regenerate `package-lock.json` with the new version.

### 3. Build a release summary

Run `git log` from the last tag (or all history if no tags exist) to collect commits since the previous release. Write a concise summary of the changes grouped by type (features, fixes, improvements, etc.). Keep it brief - a few bullet points, not a changelog dump.

### 4. Commit and tag

Run these as separate commands (not chained), since the commit may trigger lint-staged hooks that need to finish before tagging:

```
git add -A
git commit -m "release vX.Y.Z"
```

Then create the tag. Use `-m` to provide an inline message, otherwise git may try to open an editor (which fails in non-interactive terminals):

```
git tag -m "vX.Y.Z" vX.Y.Z
```

### 5. Push and create the GitHub release

```
git push && git push --tags
gh release create vX.Y.Z --title "vX.Y.Z" --notes "<release summary from step 3>"
```

This triggers the `release.yml` workflow which builds macOS binaries and attaches them to the release.
