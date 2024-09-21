"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserHelper = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const utils_1 = require("./utils");
class BrowserHelper {
    browser;
    page;
    client;
    constructor() {
    }
    async init(url) {
        this.browser = await puppeteer_1.default.launch({ headless: "new" });
        const page = await this.browser.newPage();
        console.log(url)
        await page.goto(url);
        this.client = await page.target().createCDPSession();
        await this.client.send("Page.enable");
        await this.client.send("DOM.enable");
        await this.client.send("Network.enable");
    }
    async close() {
        return this.browser.close();
    }
    async getResources(url) {
        // get the resource tree and iterate over it
        if (url && this.page.url() != url) {
            await this.page.goto(url);
        }
        const tree = await this.client
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
    async getResourceContent(frameId, url) {
        console.log(url)
        const content = await this.client.send("Page.getResourceContent", {
            frameId,
            url,
        }).catch((e) => {
            console.log(e)
        });
        if (content.base64Encoded) {
            content.content = Buffer.from(content.content, "base64").toString("utf-8");
            content.base64Encoded = false;
        }
        let { path, name } = (0, utils_1.resolveURLToPath)(url);
        return {
            ...content,
            name: name,
            path: path
        };
    }
}
exports.BrowserHelper = BrowserHelper;
