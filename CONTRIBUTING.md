# Contributing


### You may check existing issues.
### You may create your own issues.
### To assign an issue to yourself just comment '/assign' on the issue and github actions will do the rest.
### Please avoid working on an issue without having it assign to you.
### Any questions feel free to contact me.

## Use of AI
- You may use AI to assist you in understanding the project.
- You may use AI to assist you in changing the code.
- You may use AI to assist you in understanding a problem.
- Avoid generating large amounts of AI code, specially without testing.

## Working on the Site vs. the CLI

Moracarta is two things living in one repo: the actual site (`src/scripts`, `src/styles`, `src/views`, `index.html`, etc.) and the CLI that scaffolds and manages it (`src/commands`).

If you're fixing an animation, a style, or anything letter-related, you can mostly ignore the CLI entirely and just edit those files directly.

If you're touching `src/commands`, keep in mind those files run both from inside this repo (while developing) and from inside `node_modules/moracarta` once someone installs the package, so paths matter more than usual, see the Testing section below.

## Setting Up the Project

### 1. Fork the repository

Fork the Moracarta repository to your GitHub account.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/moracarta.git
cd moracarta
```

### 3. Install dependencies

```bash
npm install
```

### 4. Switch to development

```bash
git checkout development
git pull origin development
```

### 5. Create your feature branch

Create a branch for the issue or feature you're working on:

```bash
git checkout -b feature/my-feature
```

### 6. Start the development environment

```bash
npm run dev
```

This works because running Moracarta from inside its own repo is a special case, the CLI just treats the repo itself as the project.

Follow the README for any additional setup instructions.

## Development Workflow

Moracarta uses `development` as its integration branch and `main` as its stable branch.

The general workflow is:

```text
feature branch
      ↓
development
      ↓
main
      ↓
release/tag
```

### For Contributors

Contributors should create a branch from `development` and submit pull requests **to `development`**, not `main`.

The feature branch should be created in the contributor's fork:

```bash
git checkout development
git pull origin development
git checkout -b feature/my-feature
```

Make your changes, commit them, and push your feature branch to your fork:

```bash
git add .
git commit -m "feat: implement my feature #closes 33"
git push origin feature/my-feature
```

Then open a pull request targeting:

```text
development
```

Your contribution will be reviewed and tested before being merged.

### Why `development`?

Keeping contributions out of `main` allows Moracarta to remain stable while new features, fixes, and improvements are being developed and tested.

`main` represents the stable version of Moracarta.

## Project Structure

The repository is organized roughly as follows:

```text
moracarta/
├── src/              # Application source code
├── tests/            # Tests
├── docs/             # Detailed project documentation
├── README.md         # Project overview and usage
├── CONTRIBUTING.md   # Contribution guidelines
├── LICENSE           # Project license
└── package.json      # Project configuration and dependencies
```

For a more detailed explanation of the codebase and architecture, see the documentation in `docs/architecture`.

## When making Changes

* Follow the existing project structure and coding style;
* Keep code simple and readable;
* Avoid unnecessary dependencies;
* Update documentation when necessary;
* Add or update tests when appropriate;
* Make sure existing functionality still works.

## Commit Messages

Use clear commit messages that describe what changed.

Good examples:

```text
feature: implement Google Sheets import support

fix: letters not loading after setup

improve: installation documentation

refactor: validation for document URLs

docs: improve documentation
```

Avoid vague commit messages such as:

```text
fix

changes

update stuff

asdf
```

Keep them clear and descriptive.

## Pull Requests

When opening a pull request:

* Target the `development` branch;
* Explain what you changed;
* Explain why the change was necessary;
* Mention how you tested it;
* Link the relevant issue when applicable.

For example:

```text
Closes #42
```

## Good First Issues

Issues labeled `good first issue` are intended to be approachable for people who are new to the project or open source.

These may include:

* Small bug fixes
* Documentation improvements
* UI improvements
* Tests
* Small features
* Code cleanup

You don't need to write code to make a useful contribution.

## Reporting Bugs

When reporting a bug, please include:

* What you expected to happen
* What actually happened
* Steps to reproduce the problem
* Relevant error messages
* Screenshots or recordings when useful

The more reproducible the problem is, the easier it is to fix.

## Suggesting Features

Feature suggestions are welcome.

Before opening a feature request, check whether a similar issue already exists.

When suggesting a feature, explain at least one of these:

* What problem it solves
* Why it would be useful
* How you imagine it working

You don't need to provide a complete technical implementation.

## Documentation Contributions

Documentation improvements are always welcome.

You can contribute by:

* Fixing typos
* Improving explanations
* Adding examples
* Improving installation instructions
* Adding troubleshooting information
* Documenting commands or features
* Improving developer documentation

## Testing

Before opening a pull request, test your changes locally.

If you're only working on the site itself (styles, scripts, letters, views), running it inside the repo with `npm run dev` is enough.

If you're touching anything in `src/commands`, that's not enough on its own, those files behave differently once actually installed as a package. Test them properly:

```bash
npm pack
```

then, in a separate empty folder:

```bash
npm install /path/to/moracarta-x.x.x.tgz
npx moracarta setup
```

and go through `add`, `remove`, `dev`, `build` and `deploy` from there like a real user would. Some things break there but not inside the repo, and the other way around.

I also recommend having your fork deployed via:

```bash
npx moracarta build
```

then:

```bash
npx moracarta deploy
```

and test by redeploying, since some things might break there but not locally.

## Releases

The `main` branch represents the stable version of Moracarta.

Changes are periodically merged from `development` into `main` when they are ready for a significant release.

Releases are tagged using version numbers such as:

```text
v2.0.0

v2.1.0

v2.1.1
```

## Questions

If you're unsure about something, open an issue or ask in an existing relevant discussion, or email me [wesleyhanauer@gmail.com](mailto:wesleyhanauer@gmail.com)