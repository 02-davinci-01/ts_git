# 02_git

A Git implementation written in TypeScript from scratch. Supports core Git operations including init, add, commit, log, status, branching, checkout, and three-way merge with conflict detection.

## Install

```bash
npm install -g 02_git
```

## Usage

There are two ways to use 02_git:

### With global install

If you installed globally with `npm install -g 02_git`, you get the `ts-git` command:

```bash
ts-git init
ts-git add .
ts-git commit -m "initial commit"
ts-git log
```

### With npx (no install needed)

All commands also work via npx — just prefix with `npx 02_git`:

```bash
npx 02_git init
npx 02_git add .
npx 02_git commit -m "initial commit"
npx 02_git log
```

## Commands

```
ts-git init                        Initialize a new repository
ts-git add <path>                  Stage a file (use . to stage all)
ts-git commit -m "message"         Commit staged changes
ts-git log                         Show commit history
ts-git status                      Show working tree status
ts-git branch <name>               Create a new branch
ts-git checkout <name>             Switch to a branch
ts-git curr-branch                 Show the current branch
ts-git merge <branch> -m "msg"     Merge a branch into current
ts-git c-merge <branch>            Check for merge conflicts without merging
ts-git help                        Show help message
```

## How it works

02_git stores data in a `.tsgit` directory with the same conceptual structure as Git:

- **Objects** — content-addressed blobs, trees, and commits stored by SHA-1 hash
- **Refs** — branch pointers stored as files under `refs/heads/`
- **HEAD** — symbolic ref pointing to the current branch
- **Index** — staging area mapping file paths to blob hashes

Merges use a three-way merge algorithm that finds the common ancestor and detects conflicts when both branches modify the same file differently.

## License

MIT
