# resource-saver-headless

A robust Node.js utility to save webpage resources using Chrome DevTools Protocol via Puppeteer. Extract and download all static assets (HTML, CSS, JavaScript, images, etc.) from any webpage for offline use or analysis.

## Features

- 🌐 **Universal Web Scraping**: Works with any webpage, including SPAs
- 📦 **Comprehensive Resource Extraction**: Downloads HTML, CSS, JS, images, fonts, and more
- 🎯 **Smart File Organization**: Maintains original directory structure
- ⚡ **Concurrent Downloads**: Configurable parallel processing for speed
- 🛡️ **Error Resilience**: Continues processing even if some resources fail
- 🐛 **Debug Mode**: Detailed logging and Chrome DevTools integration
- 📱 **Modern TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
git clone https://github.com/minzique/resource-saver-headless.git
cd resource-saver-headless
pnpm install
pnpm build
```

## CLI Usage

### Basic Usage
```bash
# Save all resources from a webpage
resource-saver save https://example.com ./output

# Or using the compiled version
node ./dist/bin/resource-saver.js save https://example.com ./output
```

### Advanced Options
```bash
# Enable debug mode with custom timeout and parallel downloads
resource-saver save https://example.com ./output \
  --debug \
  --timeout 60000 \
  --parallel 5
```

### CLI Options
- `--timeout <ms>` - Request timeout in milliseconds (default: 30000)
- `--debug` - Enable debug mode with browser DevTools
- `--parallel <count>` - Maximum concurrent downloads (default: 10)

## Programmatic Usage

```typescript
import { BrowserHelper } from 'resource-saver-headless';

async function saveWebpage() {
  const browser = new BrowserHelper({ timeout: 30000 });
  
  try {
    await browser.init('https://example.com');
    const resources = await browser.getResources();
    
    console.log(`Found ${resources.length} resources`);
    
    // Process resources...
    for (const resource of resources) {
      console.log(`${resource.name} -> ${resource.path}`);
      // Save using saveFile utility or custom logic
    }
  } finally {
    await browser.close();
  }
}
```

## API Reference

### BrowserHelper

Main class for webpage resource extraction.

#### Constructor
```typescript
new BrowserHelper(options?: BrowserOptions)
```

**Options:**
- `headless?: boolean | "new"` - Browser mode (default: "new")
- `devtools?: boolean` - Enable DevTools (default: false in production)
- `slowMo?: number` - Slow down operations (ms)
- `timeout?: number` - Default timeout for operations (default: 30000)

#### Methods

**`init(url: string): Promise<void>`**
Initialize browser and navigate to URL.

**`getResources(url?: string): Promise<ResourceContent[]>`**
Extract all resources from the current page.

**`close(): Promise<void>`**
Clean up and close browser.

### Utility Functions

**`saveFile(outFolder: string, filePath: string, data: string): Promise<void>`**
Save file content to disk with proper directory structure.

**`resolveURLToPath(url: string): URLPathInfo`**
Convert URL to local file path structure.

## Examples

### Save Resources with Custom Processing
```typescript
import { BrowserHelper, saveFile } from 'resource-saver-headless';

async function customSave() {
  const browser = new BrowserHelper();
  await browser.init('https://example.com');
  
  const resources = await browser.getResources();
  
  // Filter only CSS files
  const cssResources = resources.filter(r => 
    r.path.endsWith('.css')
  );
  
  // Save with custom processing
  for (const resource of cssResources) {
    const processedContent = resource.content
      .replace(/url\(/g, 'url(./assets/'); // Rewrite URLs
    
    await saveFile('./output', resource.path, processedContent);
  }
  
  await browser.close();
}
```

### Batch Processing Multiple Sites
```typescript
import { BrowserHelper } from 'resource-saver-headless';

async function batchProcess(urls: string[]) {
  const browser = new BrowserHelper();
  
  for (const [index, url] of urls.entries()) {
    try {
      console.log(`Processing ${index + 1}/${urls.length}: ${url}`);
      
      await browser.init(url);
      const resources = await browser.getResources();
      
      // Save to separate directories
      const outputDir = `./output/site-${index + 1}`;
      await Promise.all(
        resources.map(r => saveFile(outputDir, r.path, r.content))
      );
      
    } catch (error) {
      console.error(`Failed to process ${url}:`, error);
    }
  }
  
  await browser.close();
}
```

## Troubleshooting

### Common Issues

**Chrome/Chromium not found**
```bash
# Install Chromium via Puppeteer
npx puppeteer install
```

**Permission errors on file save**
- Ensure output directory is writable
- Check file path length limits on Windows
- Verify disk space availability

**Timeout errors**
- Increase timeout for slow-loading pages
- Check network connectivity
- Some SPAs may need longer load times

**Memory issues**
- Reduce parallel download count
- Process smaller batches of resources
- Monitor system memory usage

### Debug Mode

Enable debug mode to troubleshoot issues:

```bash
# CLI debug mode
resource-saver save https://example.com ./output --debug

# Programmatic debug mode  
import { enableDebug } from 'resource-saver-headless';
enableDebug(true);
```

Debug mode provides:
- Visual browser window
- Chrome DevTools access
- Detailed console logging
- Slow motion execution

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License - see LICENSE file for details