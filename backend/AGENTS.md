# Backend
- Keep route handlers focused on HTTP input and output; put reusable business logic in separate functions.
- Validate request input at the boundary. Do not trust TypeScript types for runtime input.
- Use strict TypeScript and avoid `any` unless its use is explained.
- Return consistent JSON errors and appropriate HTTP status codes.