#!/usr/bin/env node

import { BrowserHelper } from "../src/browser";
import { Command } from "commander";
import { saveFile } from "../src/utils";
import * as path from "path";

interface SaveOptions {
  timeout?: number;
  debug?: boolean;
  parallel?: number;
}

async function main(): Promise<void> {
    const program = new Command();
    
    program
        .name("resource-saver")
        .description("Save webpage resources using Chrome DevTools Protocol")
        .version("1.0.0");

    program
        .command("save")
        .description("Save all resources from a webpage")
        .argument("<url>", "URL to scrape resources from")
        .argument("<outPath>", "Output directory path")
        .option("-t, --timeout <ms>", "Timeout in milliseconds (default: 30000)", "30000")
        .option("-d, --debug", "Enable debug mode", false)
        .option("-p, --parallel <count>", "Maximum parallel downloads (default: 10)", "10")
        .action(async (url: string, outPath: string, options: SaveOptions) => {
            try {
                console.log(`🌐 Starting resource extraction from: ${url}`);
                console.log(`📁 Output directory: ${path.resolve(outPath)}`);
                
                const browser = new BrowserHelper({
                    timeout: parseInt(options.timeout?.toString() || "30000"),
                });

                if (options.debug) {
                    const { enableDebug } = await import("../src/browser");
                    enableDebug(true);
                    console.log("🐛 Debug mode enabled");
                }

                await browser.init(url);
                console.log("✅ Browser initialized successfully");

                console.log("🔍 Discovering resources...");
                const resources = await browser.getResources();
                console.log(`📦 Found ${resources.length} resources`);

                if (resources.length === 0) {
                    console.log("⚠️  No resources found to save");
                    await browser.close();
                    return;
                }

                console.log("💾 Saving resources...");
                const maxParallel = parseInt(options.parallel?.toString() || "10");
                const chunks = chunkArray(resources, maxParallel);
                
                let saved = 0;
                for (const chunk of chunks) {
                    const promises = chunk.map(resource => 
                        saveFile(outPath, resource.path, resource.content)
                            .then(() => {
                                saved++;
                                console.log(`📄 (${saved}/${resources.length}) ${resource.name}`);
                            })
                            .catch(error => {
                                console.error(`❌ Failed to save ${resource.name}:`, error.message);
                            })
                    );
                    
                    await Promise.all(promises);
                }

                console.log(`🎉 Successfully saved ${saved}/${resources.length} resources`);
                await browser.close();
                
            } catch (error) {
                console.error("💥 Error:", error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        });

    program.parse(process.argv);
}

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});