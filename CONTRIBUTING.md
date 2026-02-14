# Contributing to Barterm

Thank you for your interest in contributing to Barterm! This document provides guidelines and information for contributors.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/barterm.git
   cd barterm
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary (start with lowercase)

2. **Test your changes**
   - Run the app: `npm run tauri:dev`
   - Test all affected functionality
   - Check for console errors
   - Verify on both light and dark themes

3. **Update documentation**
   - Update relevant docs in `docs/` folder
   - Add examples if introducing new features
   - Update CHANGELOG.md

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

## Commit Message Guidelines

Use conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add theme customization setting
fix: resolve notification permission issue
docs: update keyboard shortcuts guide
refactor: simplify settings context logic
```

## Code Style

### TypeScript/React
- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript types, avoid `any`
- Use descriptive variable names
- Keep functions small and focused

### Rust
- Follow Rust standard style (use `rustfmt`)
- Handle errors appropriately
- Use descriptive function names
- Add doc comments for public functions

### Comments
- Start with lowercase letter (per project rules)
- Explain "why" not "what"
- Keep concise and relevant

## Pull Request Process

1. **Ensure your code works**
   - No console errors
   - All features work as expected
   - Tested on macOS

2. **Update documentation**
   - README.md if needed
   - Relevant docs in `docs/` folder
   - CHANGELOG.md with your changes

3. **Create pull request**
   - Clear title describing the change
   - Detailed description of what and why
   - Reference any related issues
   - Include screenshots for UI changes

4. **Review process**
   - Address review feedback
   - Keep PR focused (one feature/fix per PR)
   - Be patient and respectful

## Areas for Contribution

### Good First Issues
- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Additional keyboard shortcuts
- Settings additions

### Feature Ideas
- Custom themes
- Tab reordering
- Split panes
- Command history
- Search functionality
- Profile management
- Export/import settings

### Testing
- Manual testing on different macOS versions
- Edge case testing
- Performance testing
- Accessibility testing

## Development Tips

### Adding a New Setting
See [docs/SETTINGS.md](docs/SETTINGS.md) for complete guide.

Quick steps:
1. Add to `AppSettings` interface
2. Set default value
3. Use `useSettings()` hook in component

### Adding a Tray Menu Item
See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#adding-a-new-menu-item)

### Debugging
- Frontend: Browser DevTools
- Backend: Terminal output from `npm run tauri:dev`
- Settings: Check `~/Library/Application Support/com.barterm.app/settings.json`

## Questions?

- Check [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Open a discussion on GitHub
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md (if significant contribution)
- Release notes
- GitHub contributors page

Thank you for contributing to Barterm! 🎉
