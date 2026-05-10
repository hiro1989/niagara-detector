# Niagara Detector

## Project Overview

Full TypeScript project for stock price checker.

### Technical Stack

- Use `pnpm` as the package manager (not `npm` or `npx`).

## Directory Structure

```sh
docs/ # Documentation
docs/indexion/ # Documentation for indexion
src/ # Source code
```

## Language Policy

- Write **responses** (conversational replies to the user) in Japanese
- Write **thinking and tool use** (intermediate reasoning steps) in English

## Writing Style

- **Prefer short, clear bullet points or numbered lists over long prose.**
  - Never use Markdown tables in documents. Tables are allowed only in user-facing responses.
- **Use plain English words instead of ambiguous symbols.**
  - e.g. `A or B` not `A/B`, `use X instead of Y` not `X → Y`.
- **Never hard-wrap prose mid-sentence. One sentence per line.** (Breaks at list items and paragraphs are fine.)
  - Applies to all prose contexts: **JSDoc and other code comments**, `.md` files, PR descriptions, commit message bodies.
  - **This rule overrides the conventional ~80-column JSDoc wrap, even for long sentences.**
  - Bad (mid-sentence break in JSDoc):
    ```
    * Built once per worker on first call, reused for
    * all subsequent calls.
    ```
  - Good (one sentence per line):
    ```
    * Built once per worker on first call, reused for all subsequent calls.
    ```
  - Why: mid-sentence breaks disrupt LLM tokenization and hurt human readability. Modern editors handle soft-wrap.

## Available Scripts

```sh
# Run app
pnpm start

# Lint and format code
pnpm lint

# Run tests
pnpm test
```

## TDD (Test Driven Development)

- TDD is mandatory for all implementation work in this project. Always write tests before implementation code.

## Less is More

- Too much of a good thing is bad. Keep all output short and to the point.

## Other Guidelines

- Use `AskUserQuestion` tool when necessary to clarify requirements or resolve ambiguities.
