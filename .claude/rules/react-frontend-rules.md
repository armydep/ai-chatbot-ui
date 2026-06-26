# React Frontend Rules

Generic guidelines for JavaScript/TypeScript React projects.

## Naming Conventions

- **Files:** PascalCase for components (`UserProfile.tsx`), camelCase for utilities (`client.ts`)
- **Components:** PascalCase (`UserProfile`, `ChatInput`)
- **Functions:** camelCase (`getUserData`, `loadSessions`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces:** PascalCase with descriptive names (`UserData`, `ApiResponse`)

## TypeScript Guidelines

### Type Safety
- Enable strict mode in `tsconfig.json`
- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use union types for multiple possible values
- Avoid `any` type — use `unknown` when type is truly unknown
- Use nullish coalescing (`??`) over logical OR (`||`) when empty string is a valid value
- No non-null assertions (`!`) — add explicit null checks instead
- Use `type` imports (`import type { ... }`) for type-only imports

### Best Practices
- Use type guards for runtime type checking
- Leverage utility types (`Partial`, `Pick`, `Omit`, etc.)
- Create custom types for domain-specific data
- Use enums for finite sets of values

## Code Quality Standards

### Linting
- Run the project linter before committing
- Enable React-specific rules
- Configure import/export rules for consistent module usage
- Set up accessibility rules for inclusive development

### Testing Standards
- Write unit tests for utilities and business logic
- Use integration tests for component interactions
- Follow AAA pattern (Arrange, Act, Assert)

## Performance Optimization

### Bundle Optimization
- Use code splitting for large applications
- Implement lazy loading for routes and components
- Optimize images and assets
- Use tree shaking to eliminate dead code

### Runtime Performance
- Use `React.memo()` for components rendered in lists to prevent unnecessary re-renders
- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive derived values
- Use `useRef` for mutable refs that persist across renders — never plain `{ current: null }` objects
- Use `useReducer` with init function (3rd arg) for lazy initialization
- Extract heavy logic out of components as standalone functions
- Implement proper error boundaries
- Use virtualization for large lists

## Accessibility

- Add `aria-label` on icon-only buttons and controls without visible text
- Add `aria-expanded` on toggles and expandable sections
- Use `htmlFor`/`id` to associate labels with form inputs
- Use semantic HTML elements (`button`, `nav`, `main`, `form`)

## Security Guidelines

### Dependencies
- Regularly audit dependencies with `npm audit`
- Keep dependencies updated
- Use lock files (`package-lock.json`)
- Avoid dependencies with known vulnerabilities

### Code Security
- Sanitize user inputs before rendering
- Use HTTPS for API calls
- Store sensitive data securely (environment variables, in-memory)
- Never hardcode URLs, secrets, or API keys
- Never commit `.env` files — only `.env.example`

## Development Workflow

### Before Starting
1. Check Node.js version compatibility
2. Install dependencies with `npm install`
3. Copy environment variables from `.env.example`
4. Run type checking

### During Development
1. Use TypeScript for type safety
2. Run linter frequently to catch issues early
3. Write tests for new features
4. Use meaningful commit messages

### Before Committing
1. Run linter
2. Run type checking
3. Verify production build succeeds
