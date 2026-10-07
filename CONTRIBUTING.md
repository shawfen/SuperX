# Contributing to SuperX

Thank you for helping improve SuperX. Keep changes focused on a concrete user behavior and include enough evidence for another person to assess them.

## Local development

Requirements: **Node.js 22 or newer**, plus desktop Chrome / Chromium Edge 120 or newer for browser checks. The extension, tests and preview use plain JavaScript and need no dependency installation.

```sh
node tools/validate.mjs
node tools/preview-server.mjs
```

The preview server prints a loopback URL. Its feed, settings and popup demos reuse production code with simulated storage and responses. Do not enter a real API Key into the preview. Test fixtures must use invented credentials; automated tests must not send paid API requests.

Load the `extension/` directory as an unpacked extension to check actual browser integration. Changes to loaded files require reloading the extension and refreshing X. The local preview cannot prove that current X selectors or a real provider response work.

## Structure

| Area | Responsibility |
| --- | --- |
| `extension/background.js` | Credential storage, queues, shared request slots, cancellation and cache |
| `extension/api-provider.js` | Request prompts, xAI Responses streaming, usage and failure handling |
| `extension/feed-core.js` | Post extraction, displayed-language selection and shared normalization |
| `extension/content.js`, `overlay-layout.js` | X integration, right-column layout and result UI |
| `extension/markdown-renderer.js` | Restricted Markdown-to-DOM rendering |
| `extension/options.*`, `popup.*`, `ui-i18n.js` | Configuration and localized extension UI |
| `extension/history-store.js`, `history.*` | Local 24-hour post history, retention and its reading interface |
| `tests/`, `demo/`, `tools/` | Automated checks, previews and release helpers |

The website is maintained separately and is not part of this repository or source releases. Some internal names retain GrokFirst identifiers for migration compatibility. Renaming a storage key, port or cached identity needs compatibility review rather than a broad textual replacement.

## Change requirements

- Preserve X's left navigation, feed position, post height and theme behavior. Check that the right column does not add horizontal overflow.
- Keep API Keys out of content scripts, model inputs, logs, screenshots, public issues and commits. Do not expand host access without a concrete reason.
- Treat post text, custom prompts, tool results and model output as untrusted input. Do not execute model HTML or remotely load its images.
- Avoid accidental extra paid requests: check cache identity, cancellation, translation changes and reanalysis behavior when touching scheduling or prompt code.
- Update UI strings in all supported languages; UI language and answer language are independent.
- Add a regression test when fixing meaningful behavior. Use mocks for provider, browser and storage APIs. For a copy-only change, existing checks and a UI inspection are sufficient.
- Update [Privacy](PRIVACY.md) for new data fields, permissions, telemetry, retention or credential handling. Describe compatibility changes in [Changelog](CHANGELOG.md).

## Browser acceptance before a release

Use a new browser profile so old preferences and cached answers do not hide setup defects. Record the release, browser version, scenario and outcome in [the release checklist](docs/RELEASE_CHECKLIST.md). Chrome and Edge results must be recorded separately; a Chrome preview alone is not Edge acceptance.

1. Install from the packaged extension ZIP. Check the icon, popup, settings, default Enable / Remember Key state, and no-Key state without sending an API request.
2. Check that explicit remember opt-out survives reopening settings and that clearing a Key keeps that preference. Use fabricated credentials only when testing storage paths; never submit them to the provider.
3. With analysis paused, visit supported X feed and post pages. Check sidebar alignment, collapse / expand, light / dark themes, narrow widths and absence of horizontal scrolling. Direct messages and standalone Grok pages should not be analyzed.
4. Use mocked answers for Markdown, source links, Token details, reanalysis, comment copying, cancellation, 429 handling and failed fact-check preservation.
5. If you deliberately run a live provider acceptance check, use your own approved test Key with a small balance and public test posts. Check full-post retrieval, first-token streaming, Auto original / translation switches, fixed language and the chosen search tools. Such checks can cost money; they are never part of CI.
6. Confirm that the release package contains only installation files and license notices, and that versions and SHA-256 checksums match the release notes. Verify a clean upgrade as well as a fresh install.

Do not mark paid API, current X integration or Edge scenarios as passed when only a mock preview was tested. Keep pending checks visible in the release report.

## Pull requests and issue reports

Use [Issues](https://github.com/bwjoke/SuperX/issues) for bugs, suggestions and usage questions, and [pull requests](https://github.com/bwjoke/SuperX/pulls) for code changes. Describe the concrete problem, the resulting behavior and the validation performed. Include a redacted screenshot for visual changes. State any untested browser / provider paths and relevant migration or billing risks. Ordinary bug reports should include browser and extension versions, page type, reproduction steps and safe diagnostics. Security reports follow [SECURITY.md](SECURITY.md).

## Release preparation

After validation, create the installation ZIP and SHA-256 file without installing dependencies:

```sh
npm run package
```

This invokes `tools/package-extension.mjs`, using the matching package / manifest version and an explicit production-file allowlist. It does not include demos, tests, private files or development screenshots in the installation ZIP.

Publish the ZIP and checksum as GitHub Release attachments with installation / upgrade notes, known limitations and acceptance results. CI artifacts are reviewable build outputs; they do not by themselves publish a release.

For the full installation/source bundle, use `npm run package:release`. Follow [release channels](docs/RELEASE_CHANNELS.md): tags prepare draft previews, and an accepted candidate's exact ZIP is reused for the store. Promote its existing GitHub release after store publication; do not rebuild or move the tag. Include the installation source in issue reports so preview and store behavior can be compared.

Before the first public release, enable GitHub private vulnerability reporting and confirm the repository contains no Keys, local browser data, private screenshots or machine-specific credentials.

## Licensing contributions

Contributions of original project code and documentation are accepted under the [MIT License](LICENSE). Confirm you have permission to contribute any third-party material and retain its notices.
