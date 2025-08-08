---
applyTo: '**'
---
# Copilot Instructions
## **General Guidelines:**
- Copilot Chat should **always** ask clarifying questions if the request is ambiguous.
- Follow project patterns and avoid introducing new paradigms unless requested.
- If unsure between two approaches, Copilot should explain both.
- Always consider *performance, security, and maintainability*.
- Generate code that is *clean, reviewable, and production-ready*.
- Keep changes scoped and atomic (one concern per PR).
- Do not take the easy way out & just do what I asked
- Provide full codes; step by step
- If I say STOP: pause whatever we are doing & assist me with what I'm stuck at 
- If I say GO: to continue where we left off before I was stuck
- Absolutely no placeholder codes
- Each step should build off of the past steps in the project currently being worked on
- Explain exactly where each piece of code goes (i.e. the folder, the file, the section or line)
- If I submit code: you are to review it & make sure it's accurate for what we are currently working on & tell me where there are errors & how to fix them.


## **Project Structure:**
- Follow folder conventions - folders may be under other folders:
  - `src`: All application logic.
  - `tests`: Unit and integration tests. (should mirror `src` structure)
  - `config`: Configs, schema, and setup files.
  - `types`: Global or shared types/interfaces.
  - `assets`: Static files like images, fonts, etc.
  - `scripts`: Utility scripts or build tools.
  - `docs`: Documentation files.
  - `public`: Publicly accessible.
  - `lib`: Third-party libraries or custom utilities.
  - `styles`: Global styles.
  - `components`: Reusable UI components.
  - `pages`: Application pages.
  - `hooks`: Custom React hooks.
  - `utils`: Utility functions.
  - `services`: API services.
  - `context`: React context providers.
  - `dist`: Compiled output.
  - `build`: Build scripts.
  - `node_modules`: Installed dependencies.
  - `.vscode`: VSCode settings.
  - `.github`: GitHub actions and workflows.
  - `.husky`: Git hooks.
  - `.eslint`: ESLint config.
  - `.prettier`: Prettier config.
  - `backend`: Backend code.
  - `frontend`: Frontend code.
  - `types`: TypeScript types.
  - `packages`: Monorepo packages (if applicable).

## **Code Style:**
- **Always** include *explanatory* comments for complex logic.
- Use descriptive and specific names (e.g., `validateEmail`, not `checkIt`).
- Maintain consistent indentation (2 spaces).
- Code should be ready for production unless it's clearly marked as experimental.
- Never use `any` or `unknown` unless you explain why.
- Always comment *why* something exists, not *what* it does (let the code do that).

## **Dependencies:**
- Always specify the version of dependencies in `package.json`.
- Avoid using deprecated or unmaintained packages.
- **Regularly** update dependencies to their latest stable versions.
- Use `npm` for package management.
- Prefer minimal, well-maintained, and widely-used libraries.
- For front-end:
  - Prefer native Web APIs, then React utilities, then external libraries.
- For back-end:
  - Use standard Node.js modules first, then stable libraries like `axios`, `express`, etc.
- Explain why a dependency is needed in your comment or suggestion.

## ** Commands: **
- `npm audit`: check for vulnerabilities in dependencies.
- `npm ci`: consistent installs in CI environments.
- `npm run lint`: check code style and quality.
- `npm run test`: run unit tests before committing changes.
- `npm run build`: compile the project before deployment.
- `npm run start`: run the project in development mode.
- `npm run deploy`: deploy the project to production.
- `npm run watch`: automatically rebuild the project on file changes.
- `npm run clean`: remove build artifacts and temporary files.
- `npm run format`: format the codebase according to the project's style guide.
- `npm run docs`: generate documentation from comments in the code.
- `npm run serve`: start a local server for development.

## ** Documentation: **
- Add CLI examples where relevant.
- Prefer environment variables via `.env` or `process.env`.
- Include test coverage and doc updates with any new feature.
- Follow conventional commit messages when applicable (e.g., `feat:`, `fix:`, `chore:`).
- If your suggestion modifies CLI behavior, APIs, config files, or setup steps:
  - Update `README.md`, `CHANGELOG.md`, `docs/`, or relevant `.md` files in detail.
- Ensure usage examples are correct and runnable.
- Prefer inline docs for modules with complex inputs/outputs.
