# ts-git

A Git implementation written in TypeScript from scratch. Supports core Git operations including init, add, commit, log, status, branching, checkout, and three-way merge with conflict detection.

## Install

```bash
npm install -g ts-git
```

## Usage

```bash
# Initialize a repository
ts-git init

# Stage files
ts-git add <file>
ts-git add .

# Commit
ts-git commit -m "your message"

# View history
ts-git log

# Check status
ts-git status

# Branching
ts-git branch <name>
ts-git checkout <name>
ts-git curr-branch

# Merge
ts-git merge <branch> -m "merge message"

# Check merge conflicts without merging
ts-git c-merge <branch>
```

## How it works

ts-git stores data in a `.tsgit` directory with the same conceptual structure as Git:

- **Objects** — content-addressed blobs, trees, and commits stored by SHA-1 hash
- **Refs** — branch pointers stored as files under `refs/heads/`
- **HEAD** — symbolic ref pointing to the current branch
- **Index** — staging area mapping file paths to blob hashes

Merges use a three-way merge algorithm that finds the common ancestor and detects conflicts when both branches modify the same file differently.

## License

MIT
