# Contributing to Home Anywhere

Thanks for considering a contribution! Home Anywhere is a small open-source
project — every issue, doc fix, and pull request helps.

This guide covers how to set up your environment, the conventions we follow,
and how to submit changes.

## Code of conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
Be kind, be constructive.

## Ways to contribute

- 🐛 **Report a bug** — open an [issue](https://github.com/AmiQT/home-anywhere/issues/new?template=bug_report.md)
- 💡 **Suggest a feature** — open a [feature request](https://github.com/AmiQT/home-anywhere/issues/new?template=feature_request.md)
- 📝 **Improve docs** — typos, clarifications, translations, examples
- 🎨 **Design improvements** — UI polish, accessibility fixes
- 🔧 **Send a pull request** — bug fixes, new features, refactors

For larger changes (new modules, breaking API changes, big UI overhauls),
**please open an issue first** to discuss the approach before you build.

## Development setup

Follow the [Quick start](README.md#quick-start) in the root README to get
both the backend and frontend running locally.

### Run tests before pushing

```bash
# Frontend
cd frontend && npm test && npm run build

# Backend
cd backend && php artisan test
```

## Conventions

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add iCal export to booking confirmation
fix: prevent double booking on race condition
docs: clarify Stripe webhook setup
chore: bump tailwindcss to 4.1.16
```

Common prefixes: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `ci`.

### Code style

- **Frontend**: TypeScript, two-space indent, no `any` unless unavoidable.
  Run `npm run lint` before submitting.
- **Backend**: PSR-12. Run `./vendor/bin/pint` (if installed) before submitting.
- **Database**: tables use **singular** names (`service`, not `services`).
  Money is stored as integer cents.

### Branches

- Branch off `main`: `git checkout -b feat/your-feature`
- Keep PRs focused — one logical change per PR.
- Rebase rather than merge when syncing with `main`.

## Pull request checklist

Before opening a PR, please:

- [ ] Tests pass locally (`npm test` and `php artisan test`)
- [ ] Frontend builds (`npm run build`)
- [ ] No new linter warnings
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains **what** and **why** (the diff shows the how)
- [ ] Screenshots/screen recordings included for UI changes
- [ ] Docs updated if you changed user-facing behaviour

We aim to review PRs within a few days. Be patient if it takes a bit longer —
this is maintained in spare time.

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](LICENSE).
