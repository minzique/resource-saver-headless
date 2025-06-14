import puppeteer, { Browser, Page, CDPSession } from "puppeteer";
import { resolveURLToPath } from "./utils";

let __debug = "DEBUG" in process.env;

/**
 * Debug logging utility
 */
export function debug(...args: unknown[]): void {
  if (__debug) console.log("[debug]", ...args);
}

/**
 * Enable or disable debug mode
 */
export function enableDebug(value: boolean): boolean {
  return (__debug = value);
}

export interface ResourceContent {
  content: string;
  base64Encoded: boolean;
  name: string;
  path: string;
  url: string;
}

export interface BrowserOptions {
  headless?: boolean | "new";
  devtools?: boolean;
  slowMo?: number;
  timeout?: number;
}

export class BrowserHelper {
  public browser?: Browser;
  public page?: Page;
  public client?: CDPSession;
  public url?: string;

  constructor(private options: BrowserOptions = {}) {}

  async init(url: string): Promise<void> {
    try {
      const launchOptions = __debug
        ? {
            headless: false,
            devtools: true,
            slowMo: 250,
          }
        : { headless: "new" as const };

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();
      
      // Set a reasonable timeout
      this.page.setDefaultTimeout(this.options.timeout || 30000);
      
      this.url = await this.navigate(url);
      this.client = await this.page.target().createCDPSession();
      
      await Promise.all([
        this.client.send("Page.enable"),
        this.client.send("DOM.enable"),
        this.client.send("Network.enable")
      ]);
    } catch (error) {
      console.error("Failed to initialize browser:", error);
      await this.cleanup();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.cleanup();
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.client) {
        await this.client.detach();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  async navigate(url: string): Promise<string> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }
    
    try {
      await this.page.goto(url, { 
        waitUntil: "domcontentloaded",
        timeout: this.options.timeout || 30000
      });
      
      // Wait for dynamic content to load
      await this.page.waitForTimeout(2000);
      
      return this.page.url();
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      throw error;
    }
  }

  async getResources(url?: string): Promise<ResourceContent[]> {
    if (!this.client || !this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    if (url && this.page.url() !== url) {
      await this.navigate(url);
    }

    try {
      const fetchedUrls = new Set<string>();
      const resourcePromises: Promise<ResourceContent | null>[] = [];
      let attempts = 0;
      const maxAttempts = 10;

      // Initial resource discovery
      while (attempts < maxAttempts) {
        const tree = await this.client.send("Page.getResourceTree");
        let newResourcesFound = false;

        for (const resource of tree.frameTree.resources) {
          if (!fetchedUrls.has(resource.url)) {
            fetchedUrls.add(resource.url);
            newResourcesFound = true;
            
            const promise = this.getResourceContent(
              tree.frameTree.frame.id, 
              resource.url
            ).catch((error) => {
              console.warn(`Failed to fetch resource ${resource.url}:`, error);
              return null;
            });
            
            resourcePromises.push(promise);
          }
        }

        if (!newResourcesFound) {
          break;
        }
        
        attempts++;
        await this.page.waitForTimeout(100); // Small delay between attempts
      }

      const results = await Promise.all(resourcePromises);
      return results.filter((result): result is ResourceContent => result !== null);
    } catch (error) {
      console.error("Failed to get resources:", error);
      throw error;
    }
  }

  async getResourceContent(frameId: string, url: string): Promise<ResourceContent> {
    if (!this.client) {
      throw new Error("CDP client not initialized");
    }

    debug(`Fetching resource: ${url}`);

    try {
      const content = await this.client.send("Page.getResourceContent", {
        frameId,
        url,
      });

      let decodedContent = content.content;
      if (content.base64Encoded) {
        decodedContent = Buffer.from(content.content, "base64").toString("utf-8");
      }

      const { path, name } = resolveURLToPath(url);

      return {
        content: decodedContent,
        base64Encoded: false,
        name,
        path,
        url,
      };
    } catch (error) {
      console.error(`Failed to get content for ${url}:`, error);
      throw error;
    }
  }
}
