# Licensing of the Tokscale web app

The web app in this directory (`packages/frontend`) is licensed under the
**GNU Affero General Public License, version 3 only** (`AGPL-3.0-only`).
The full text is in [`LICENSE`](./LICENSE).

## What this covers

- All code in `packages/frontend`, including the submission API and the other server routes.
- It does not cover the Tokscale CLI and core library in [`crates/`](../../crates). They stay under the [MIT License](../../LICENSE).
- Data that Tokscale compiled in [`src/content`](./src/content) has its own license, CC BY 4.0. Third-party data there keeps the terms of its source. See [`src/content/LICENSE.md`](./src/content/LICENSE.md).
- Programs outside this directory, such as a model router, billing, or team features, are separate programs. This license does not cover them.

## Earlier MIT releases

Until the commit that added this file, this directory was published under the MIT License. Versions released before that commit stay available under MIT, and the MIT copyright and permission notice in [`../../LICENSE`](../../LICENSE) is kept for the code that came from them.

## If you run a modified version

The AGPL lets you use, change, and run this web app, including for commercial purposes. If people interact with your modified version over a network, you must offer them its source code under the AGPL (section 13).

## Trademarks

The AGPL gives no rights to the Tokscale name or logo. See [`../../TRADEMARKS.md`](../../TRADEMARKS.md).

## Contributing

Contributions to this directory need a one-time signature of the [Contributor License Agreement](../../CLA.md).
