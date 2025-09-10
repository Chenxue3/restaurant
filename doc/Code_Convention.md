## Web

Components that are only used within a specific page and not reused by other pages should be placed in the `components` folder under the same directory as that page’s `page.tsx`.

For example, if `web/src/app/posts/page.tsx` uses the `NavigationTabs` component, you should place `NavigationTabs` directly in `web/src/app/posts/components`.

## API

- Use ES6 syntax.

## Development Branches

- Use `feat/feature-name` for new features.
- Use `fix/bug-scope` for bug fixes.
