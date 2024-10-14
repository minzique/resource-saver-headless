import puppeteer, { Browser, Page, CDPSession, Protocol } from "puppeteer";
import { resolveURLToPath, saveFile } from "./utils";

let __debug = "DEBUG" in process.env;

/**
 * debug log
 * @param  {...any} args
 */

export function debug(...args: any[]) {
  if (__debug) console.log("[debug]", ...args);
}

/**
 * @param {boolean} value set new value
 * @returns {boolean}
 */
export function enableDebug(value) {
  if (value != null) {
    return (__debug = value);
  }
}

export class BrowserHelper {
  public browser: Browser;
  public page: Page;
  public client: CDPSession;
  public url: string;
  constructor() {}
  async init(url: string) {
    //add debug option
    if (__debug) {
      this.browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        slowMo: 250,
        // args: ["--disable-web-security"],
      });
    } else {
      this.browser = await puppeteer.launch({ headless: "new" });
    }

    this.page = await this.browser.newPage();
    this.url = await this.navigate(url);
    this.client = await this.page.target().createCDPSession();
    await this.client.send("Page.enable");
    await this.client.send("DOM.enable");
    await this.client.send("Network.enable");
  }

  async close() {
    return this.browser.close();
  }

  async navigate(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    // await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    // wait for 2 seconds
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    return this.page.url();
  }
  async getResources(url?: string) {
    // get the resource tree and iterate over it
    if (url && this.page.url() != url) {
      await this.page.goto(url);
    }
    let resourceList = [];
    let fetchedResources = []
    let resourceQueue = [];
    // const tree: Protocol.Page.FrameResourceTree = await this.client
    //   .send("Page.getResourceTree")
    //   .then((f) => f.frameTree);
    // resourceList.push(...tree.resources);


    while (true) {
      let tree = await this.client.send("Page.getResourceTree").then((f) => f.frameTree);
      let matches = false;
      // add new resources to list
      for (const resource of tree.resources) {
        tree = await this.client.send("Page.getResourceTree").then((f) => f.frameTree);
        if (!fetchedResources.includes(resource.url)) {
          matches = true;
          fetchedResources.push(resource.url);
          let promise = this.getResourceContent(tree.frame.id, resource.url);
          resourceQueue.push(promise);
        }
      }
      if (!matches) {
        break;
      }
      
    }

    // iterate over the resource tree
    // let resourceQueue = [];
    // for (const resource of tree.resources) {
    //   let r = this.getResourceContent(tree.frame.id, resource.url);
    //   resourceQueue.push(r);
    // }
    let results = await Promise.all(resourceQueue);
    return results;
  }

  async getResourceContent(frameId: string, url: string) {
    console.log(url);
    let content: Protocol.Page.GetResourceContentResponse;

    content = await this.client.send("Page.getResourceContent", {frameId, url,});


    if (content.base64Encoded) {
      content.content = Buffer.from(content.content, "base64").toString(
        "utf-8"
      );
      content.base64Encoded = false;
    }
    let { path, name } = resolveURLToPath(url);

    return {
      ...content,
      name: name,
      path: path,
    };
  }
}
