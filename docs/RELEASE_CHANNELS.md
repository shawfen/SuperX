# Release channels

SuperX uses one source tree and one version sequence, with two distribution channels. GitHub is the project home for code, downloads, documentation and support. The Chrome Web Store distributes versions that have completed browser acceptance.

## Choose a channel

| Channel | Who it serves | Installation and updates |
| --- | --- | --- |
| Chrome Web Store — Stable | People who want the tested version | Install from the verified store listing; Chrome manages updates |
| GitHub Releases — Preview | People who want the newest changes and can report problems | Download the attached extension ZIP, load it unpacked and update it manually |
| GitHub Releases — Stable archive | People who need a particular tested release or its source | Download the same installation ZIP used for that store release, plus source and checksums |

Preview is a release status, not a second product or a second source repository. A store version can lag behind newer GitHub previews. For example, Stable may be 0.8.0 while Preview is 0.8.3. The `main` branch and CI artifacts are development outputs, not a promise of an installable public release.

## Versions and downloads

Keep `package.json`, `extension/manifest.json` and the Git tag in agreement: `0.8.3` and `v0.8.3`, for example. Every changed installation candidate gets a new increasing numeric version. Do not put a `-beta` suffix in the Chrome `version` field or move a published tag to different code. GitHub's **Pre-release** flag identifies a preview.

Each release provides:

- `SuperX-<version>.zip`: the installation/upload package, with `manifest.json` at its root.
- `SuperX.zip`: an identical-byte convenience alias for a stable download link.
- `SuperX-<version>-files.json` and `SuperX-<version>-SHA256SUMS.txt`: installation inventory and checksums, including the alias.
- `SuperX-<version>-source.zip`, source inventory and source checksums: the curated public source, including project documentation.

GitHub's automatically generated **Source code** archives are not the installation ZIP. Users loading source must select its `extension/` directory.

Use these destinations on the README, website and store support entry:

| Entry | Destination |
| --- | --- |
| Install stable | The actual Chrome Web Store listing |
| Website | `https://superx.vip/` |
| Source | `https://github.com/bwjoke/SuperX` |
| Get the latest preview | `https://github.com/bwjoke/SuperX/releases`, with explicitly labelled previews and direct installation links in their notes |
| Download the latest stable ZIP | `https://github.com/bwjoke/SuperX/releases/latest/download/SuperX.zip` |
| Browse releases and changelogs | `https://github.com/bwjoke/SuperX/releases` and `CHANGELOG.md` |
| Report a bug, request a feature or ask a usage question | `https://github.com/bwjoke/SuperX/issues` |
| Discuss usage | `https://github.com/bwjoke/SuperX/discussions`, after the maintainer enables Discussions; otherwise Issues |
| Privacy | `https://superx.vip/privacy/`, after verifying its published policy content |

GitHub's `/releases/latest` excludes previews and drafts. Until the first stable release exists, mark the stable download as unavailable rather than pointing it at a preview. Initially the Releases list is the preview entry; a future automatic preview index must select published preview releases rather than reuse `/latest`. Preparing these URLs does not publish the repository, its releases or a store listing.

## Prepare a preview

1. Finish the intended changes on a reviewed commit and update the changelog. Run the checks in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), including the public-distribution prerequisites.
2. Build the complete release bundle with `npm run package:release`. Check the installation ZIP, source ZIP, inventories and checksums. This local command does not publish anything.
3. After authorization to publish, push the reviewed commit and matching `vMAJOR.MINOR.PATCH` tag. The release workflow validates the source and prepares a **draft preview**, explicitly excluded from Latest.
4. Review the release notes and attachments. Publish the draft explicitly as a **Pre-release**, with known limitations and manual installation/update instructions. A successful workflow alone does not publish a release.
5. Collect reports against that version and installation channel. Fixes to packaged code require a new version and tag; leave existing published attachments unchanged.

The workflow refuses to overwrite a published release. CI also produces reviewable build artifacts; they are not the main download entry for users.

## Promote the same candidate to stable

1. Select an existing candidate version, complete clean Chrome/Edge installation and upgrade acceptance, and record the evidence. Test the candidate that will actually be uploaded, including direct Key setup, remembered-Key restoration after restart, session-only expiry, clear/replacement cancellation and language switches.
2. Download its versioned installation ZIP from the release and verify its SHA-256 against the published checksum. Upload that exact ZIP to create the first Chrome Web Store item, or update the existing item on later releases. Do not upload the source ZIP or rebuild a different package under the same tag.
3. Keep the GitHub release labelled Preview while the store reviews it. Record the status as submitted, approved or published; these are different states. The dashboard can defer publication after approval if a coordinated release is wanted.
4. Once the same version is actually available from the store, verify the installed version and listing, then change that GitHub release from Pre-release to Stable and mark it Latest. Preserve its tag, installation files and hashes. This is a deliberate maintainer action, not an automatic result of merging a PR.
5. Update the README's stable/preview entries, release notes and public privacy/support links together. Continue developing newer previews without replacing the stable download.

If a rejected or failed candidate needs packaged changes, create a new version and repeat acceptance. A production hotfix follows the same process with a smaller change. Store updates require increasing versions and review; the store should not receive every development commit.

For each promotion, record this information in its release notes or release report:

| Field | Value to record |
| --- | --- |
| Version and tag | The installed numeric version and its matching tag |
| Source | The full reviewed Git commit SHA |
| Installation package | File name and SHA-256 |
| Acceptance | Browser/OS, fresh install and upgrade results, remaining limitations |
| GitHub | Preview/Stable status and release URL |
| Chrome Web Store | Verified item ID, version, review/publication status and listing URL |
| Policy and support | Verified public privacy and Issues URLs |

## Moving between installations

An unpacked GitHub installation does not become a store installation automatically. In the current preparation there is no store public key in the manifest, so its development ID can differ from the eventual store ID. Settings and remembered Keys belong to the extension's storage and are not automatically migrated between different IDs or browser profiles. Removing an extension clears its local storage.

When switching channels, keep any custom prompt text you need, disable the old installation to avoid duplicate paid analysis, install the desired channel and configure its Key. Do not promise a seamless migration until it has been tested with the real store item. A future explicit settings export should exclude credentials; it is not currently implemented.

## Shared project home and support

Start with the GitHub README as the information/download hub. Issues handle bugs and feature requests; Discussions can handle questions, sharing and release announcements once enabled. Store support links point to this same community, so reports are not split across unrelated trackers. Bug reports include version, browser, installation source and reproduction steps. Security reports follow [SECURITY.md](../SECURITY.md).

Until Discussions is enabled, the **Usage question** issue form provides a support path. Suggested Discussion categories are **Q&A**, **Ideas** and **Announcements**. Keep actionable bug reports in Issues and link to them from relevant discussions.

[superx.vip](https://superx.vip/) provides the product website, with **Install stable**, **Try preview**, **Source**, **Support** and **Privacy** entries as each destination becomes available. Downloads come from GitHub and the Chrome Web Store. Keep [privacy/](https://superx.vip/privacy/) as a permanent public policy path. The website is deployed and maintained separately; its source and deployment configuration are excluded from the extension repository and source release. Do not deploy the extension repository over the existing website.

## Current preparation status

On October 7, 2026, the local extension candidate is 0.7.26. It includes password-free automatic API Key encryption, independent answer/interface languages, streamed Markdown, Token/model details, comment drafts and local 24-hour browsing history that also works without an API Key. English appears immediately after Auto in both language menus. The hosted website exists; the extension repository, public releases and Chrome Web Store listing are being prepared. Final installed Chrome/Edge acceptance, the live privacy page, download/support destinations and repository security settings must be verified before publication. Automated checks and isolated previews do not substitute for those checks.

## 简体中文

一套源码，两条渠道：GitHub 是代码、文档、最新预览下载与 Issues 支持的项目主页；Chrome 商店负责经过安装验收的稳定版。GitHub 同时保留稳定版的原始安装包与源码存档。

所有安装候选都使用递增的数字版本及匹配 tag，预览身份用 GitHub 的 Pre-release 标记表示。新 tag 只生成预览草稿，审核附件后再主动公开；通过验收的同一份 ZIP 原样上传商店，商店实际发布后再将对应 GitHub Release 晋升为 Stable/Latest，保留附件和 SHA-256。GitHub `latest` 不含预览版，最新预览入口必须单独指向 Releases 列表。

GitHub 解压版需要手动更新，商店版由 Chrome 更新。当前不同安装 ID 之间不自动迁移 Key 和设置，切换渠道时先停用旧版，避免重复分析。官网 [superx.vip](https://superx.vip/) 独立维护，源码不纳入扩展开源；隐私路径保持为 `/privacy/`。仓库、下载、Issues 及商店入口以实际公开状态为准，最终安装验收需单独完成。

## Official references

- [GitHub release links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) and [Latest release semantics](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)
- [GitHub CLI release creation](https://cli.github.com/manual/gh_release_create) and [release status editing](https://cli.github.com/manual/gh_release_edit)
- [Chrome Web Store updates and deferred publishing](https://developer.chrome.com/docs/webstore/update)
- [Chrome numeric versions](https://developer.chrome.com/docs/extensions/reference/manifest/version), [development extension IDs](https://developer.chrome.com/docs/extensions/reference/manifest/key) and [extension storage](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Chrome support URLs](https://developer.chrome.com/docs/webstore/support-users)
