# resource-saver-headless

Save every resource a webpage needs for offline use — HTML, CSS, JavaScript, images, fonts, and more — powered by Puppeteer and the Chrome DevTools Protocol.

## Key Features

- Works with any website, including single-page applications (SPAs)
- Preserves the original directory structure
- Concurrent, resumable downloads with robust error handling
- Optional headless/DevTools debug mode
- Modern, strictly-typed TypeScript codebase

## Installation

```bash
git clone https://github.com/minzique/resource-saver-headless.git
cd resource-saver-headless
pnpm install
pnpm build
```

## CLI Usage

```bash
# Save all resources from a webpage to ./output
resource-saver save https://example.com ./output
```

### Options

| Flag               | Description                     | Default |
| ------------------ | ------------------------------- | ------- |
| `--timeout <ms>`   | Request timeout in milliseconds | 30000   |
| `--parallel <num>` | Maximum concurrent downloads    | 10      |
| `--debug`          | Launch Chrome window + DevTools | false   |

## Programmatic Usage

```typescript
import { BrowserHelper } from 'resource-saver-headless';

async function save() {
  const browser = new BrowserHelper({ timeout: 30000 });
  await browser.init('https://example.com');

  const resources = await browser.getResources();

  for (const { path, content } of resources) {
    // Persist to disk or process as needed
  }

  await browser.close();
}
```

## TODO

- [x] Core resource extraction engine
- [x] CLI interface
- [x] Concurrent downloads & robust error handling
- [x] Debug / DevTools mode
- [x] Strict TypeScript setup
- [ ] Enhanced SPA support
- [ ] Source-map extraction for original source files

## License

ISC License — see the `LICENSE` file for details.