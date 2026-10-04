- Before modifying `backend/` or `frontend/`, read that directory's `AGENTS.md`. Read both for tasks spanning both areas.
- Keep it short, agent-specific, and linked to human-facing docs instead of duplicating them.
- Prefer helper functions over nested ternarys.
- Use existing folder structure conventions. Do not invent new ones unless it is very obvious that this exact extension of the folder structure is needed.
- Prefer extending, consolidating or reworking code over adding new code. Keep changes focused.
- Optimize for long-term maintainability and readability, not only completion of the current task.
- When requirements change, update implementation, tests and documentation together. Do not write tests to guard against the old implementation behavior.
- Keep READMEs focused on confirmed, durable information. Include implementation limitations ONLY when they materially affect project use and are expected to persist. Avoid progress reports and speculative claims.
- Use the root ESLint and Prettier configuration. Run relevant checks for the changed area; `npm run check` runs the current repository checks.

## Testing

- Favor readability over clever or compact tests. Use names and data that fit the repo's domain.
- Make mock responses and time changes explicit; avoid hidden mutable state and call-order tricks.
- Add short comments above key assertions when the behavior or its significance is not obvious. Explain what is being tested, not the assertion syntax.
