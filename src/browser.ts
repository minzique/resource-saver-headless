import puppeteer, { Browser, Page, CDPSession, Protocol } from "puppeteer";
import { resolveURLToPath, saveFile } from "./utils";

export class BrowserHelper {
  public browser: Browser;
  public page: Page;
  public client: CDPSession;
  public url: string;
  constructor() {}
  async init(url: string) {
    this.browser = await puppeteer.launch({ headless: "new" });
    const page = await this.browser.newPage();
    this.url = await this.navigate(url);
    this.client = await page.target().createCDPSession();
    await this.client.send("Page.enable");
    await this.client.send("DOM.enable");
    await this.client.send("Network.enable");
  }

  async close() {
    return this.browser.close();
  }

  async navigate(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    return this.page.url();
  }
  async getResources(url?: string) {
    // get the resource tree and iterate over it
    if (url && this.page.url() != url) {
      await this.page.goto(url);
    }

    const tree: Protocol.Page.FrameResourceTree = await this.client
      .send("Page.getResourceTree")
      .then((f) => f.frameTree);

    // iterate over the resource tree
    let resourceQueue = [];
    for (const resource of tree.resources) {
      resourceQueue.push(this.getResourceContent(tree.frame.id, resource.url));
    }
    let results = await Promise.all(resourceQueue);
    return results;
  }

  async getResourceContent(frameId: string, url: string) {
    const content: Protocol.Page.GetResourceContentResponse =
      await this.client.send("Page.getResourceContent", {
        frameId,
        url,
      });

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
