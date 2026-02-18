---
name: commit
description: Commit all uncommitted changes in the repo. Analyzes the diff, groups unrelated changes into separate logical commits, and performs the commits. Use when the user asks to commit, commit changes, commit everything, or stage and commit files.
---

# Commit

Commit all uncommitted changes, grouping unrelated changes into separate logical commits.

## Steps

### 1. Inspect the changes

Run `git status` and `git diff` to understand what has changed. Also check `git log -5 --oneline` to understand the existing commit style.

### 2. Group changes into logical commits

Analyze the diff and decide how many commits make sense. Guidelines:

- **One commit** if all changes relate to a single feature, fix, or concern
- **Multiple commits** if changes are clearly unrelated (e.g. a new backend feature + unrelated frontend settings change)
- Keep auto-generated or lock files (e.g. `Cargo.lock`, `package-lock.json`, schema files) together with the change that caused them
- Never split a single logical change across multiple commits

### 3. Commit each group

For each logical group, stage only the relevant files and commit:

```
git add <files for this group>
git commit -m "<message>"
```

Follow the existing commit style from `git log`. If the project uses conventional commits (`feat:`, `fix:`, etc.), match that. Otherwise use plain imperative sentences.

### 4. Verify

Run `git log --oneline -5` to confirm the commits look correct.
