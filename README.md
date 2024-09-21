# resource-saver-headless

A Node.js utility to save webpage resources using experimental chrome dev tool APIs.

## Usage

```bash
git clone https://github.com/minzique/resource-saver-headless.git
cd resource-saver-headless
pnpm install
pnpm build

node ./dist/bin/resource-saver.js <url> <outPath>
```