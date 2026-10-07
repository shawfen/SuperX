# Release checklist

This checklist separates reproducible checks from manual browser and service checks. A passing mock test suite is not evidence that a particular X account, browser installation, or paid API request works.

## Before the first public release

- [ ] Review the initial Git commit: no credentials, browser profiles, private screenshots, workstation paths, temporary SDKs or unrelated production files. Exclude the independently maintained website and internal store-preparation files.
- [ ] Enable GitHub private vulnerability reporting and confirm the process in `SECURITY.md`.
- [ ] Check the English and Chinese README installation steps, `https://github.com/bwjoke/SuperX/releases` downloads and `https://github.com/bwjoke/SuperX/issues` support. Clearly mark the stable ZIP as unavailable until a stable release exists.
- [ ] Run `npm run check`, `npm run package:check`, and `npm run package` from a fresh checkout.
- [ ] Confirm the ZIP has `manifest.json` at its root, includes both project and Marked license notices, and matches the generated file inventory and SHA256 checksums.
- [ ] Review the release notes, privacy notice, and API billing information.
- [ ] Publish the actual policy at `https://superx.vip/privacy/` through the existing website deployment, with the public Issues link. Confirm it shows the privacy content rather than the homepage, without signing in.
- [ ] Match the Chrome Web Store privacy declarations to the actual website content, post URLs, author labels and API credential handling. No remote executable code is used.
- [ ] Review provider and store data-handling requirements against the final simplified setup; removing the consent UI does not establish store approval or an exemption from provider terms. Provide usable review credentials only through the dashboard's private review fields.

## Clean browser installation

Complete this table in a fresh browser profile, separately from an upgrade of an existing installation. Enter API credentials yourself in the extension settings; never include them in an issue, screenshot, recording, or test fixture.

| Check | Chrome | Edge |
| --- | --- | --- |
| Record browser version and operating system | Pending | Pending |
| Extract the release ZIP and load its root folder in Developer mode | Pending | Pending |
| Open settings before visiting X; interface follows browser language | Pending | Pending |
| Confirm Enable and Remember Key defaults; save and reopen settings | Pending | Pending |
| Fresh install: no API requests without a usable Key; saving a Key allows enabled analysis without a separate consent step | Pending | Pending |
| Remember Key saves ciphertext without a plaintext local API Key, keeps a separate IndexedDB encryption key, and restores automatically after restart without a password | Pending | Pending |
| Session-only Key is unavailable after browser restart and requires re-entry | Pending | Pending |
| Upgrade: encrypt existing plaintext or a usable old session Key before removing old records; unavailable old password-encrypted Key requires one-time API Key re-entry | Pending | Pending |
| Missing/damaged ciphertext or IndexedDB encryption key requests API Key re-entry, never authorizes a paid call | Pending | Pending |
| Clear or replace Key: cancel queued analysis/comments/fact checks and clear obsolete credentials/cache | Pending | Pending |
| Settings opens at the API Key field for missing or migration-needed credentials; no password, lock or unlock controls | Pending | Pending |
| Cache is reused within the browser session and removed on browser exit; legacy local cache is deleted | Pending | Pending |
| Uncheck Remember Key; verify the choice survives browser restart and ciphertext, IndexedDB encryption key and obsolete persistent records are removed | Pending | Pending |
| Clear Key; ciphertext, IndexedDB encryption key, old records, session Key and cache clear while the selected preference remains | Pending | Pending |
| Use the same version for an upgrade; saved prompts/settings remain | Pending | Pending |
| Check popup pause/resume and opening settings | Pending | Pending |
| Open X; interface labels follow X and Auto follows displayed post language | Pending | Pending |
| Switch original/translation; switch a fixed answer language | Pending | Pending |
| Collapse/expand; left navigation and timeline do not resize | Pending | Pending |
| Review Markdown, source links, and model/Token tooltip | Pending | Pending |
| Generate three one-line comment drafts and copy one; no comment is automatically posted | Pending | Pending |
| Browsing history records visible supported posts with no Key, merges repeat views, survives restart and does not trigger paid requests when opened | Pending | Pending |
| History search, individual deletion, clear and recording toggle work independently of the Key and result cache | Pending | Pending |
| Start a request, pause or navigate away; late output does not attach to another post | Pending | Pending |

Use a small, controlled live session to verify the user's configured model and API access. All visible posts can trigger paid requests; background fact-checking can add another request per post. Disable analysis when the check ends. Live API access and charges are controlled by the user's xAI account, not by mock tests.

## Failure and privacy checks

Use isolated fixtures to reproduce a rate limit, interrupted stream, fact-check failure, and invalid Key; do not deliberately exhaust a real account's quota. Confirm explanation preservation, safe diagnostic messages, no automatic paid retry, and cancellation handling. Verify startup pruning removes expired cache entries from session storage, while valid answers remain reusable. Check credential changes cannot restore a Key or cached result from an older asynchronous operation. Confirm obsolete consent fields do not block an upgrade or return through saved settings. Use fabricated credentials to confirm that local extension storage contains no plaintext API Key after a successful remembered save, random AES-GCM encryption uses a separate non-extractable IndexedDB key, and failed encryption or migration does not report success or remove an unmigrated plaintext credential. Verify the privacy notice does not claim full-profile protection, hardware binding or guaranteed forensic erasure.

## Release procedure

Use the shared [release channels](RELEASE_CHANNELS.md) procedure. GitHub hosts previews and stable archives; the store distributes accepted stable versions from the same source and package.

1. Keep `package.json` and `extension/manifest.json` on the same version.
2. Complete local checks, build `npm run package:release`, and review the exact Git diff and both archive inventories. Record the commit and installation ZIP SHA-256.
3. Push the reviewed source and version tag only after publication is authorized.
4. The release workflow validates the numeric tag, reruns tests, and attaches the installation/source ZIPs, inventories and checksums to a draft preview excluded from Latest.
5. Complete public-distribution prerequisites, review the draft, and explicitly publish it as a Pre-release with installation notes and known limitations.
6. Complete browser acceptance for a chosen candidate. Verify its published installation ZIP checksum and upload that exact package to the store. Keep its GitHub status Preview during review.
7. Once the same version is actually available from the store, verify it and promote the existing GitHub release to Stable/Latest without replacing attachments or moving its tag. Update the channel entries and release report together.

- [ ] Record the store item ID, review status, published version and actual listing URL; approval alone is not publication.
- [ ] Confirm the stable `SuperX.zip` alias has the same bytes as the versioned ZIP and is included in its checksums.
- [ ] Check the latest-preview entry separately from GitHub's stable `/releases/latest` entry.
- [ ] Check that store support points to the repository's public Issues and privacy links use the verified public policy URL.
- [ ] Keep manual update and channel-switch instructions accurate; do not promise automatic Key/settings migration across installation IDs.

GitHub repository/release publication, website deployment and browser-store submission are separate steps. Local preparation does not establish their public status.
