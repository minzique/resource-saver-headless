"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const browser_1 = require("../src/browser");
const commander_1 = require("commander");
const utils_1 = require("../src/utils");
// simple cli for resource saver
async function main() {
    const program = new commander_1.Command();
    program
        .name("ResourceSaverHeadless")
        .description("ResourceSaverHeadless")
        .version("1.0.0");
    program.command("save <url> <outPath>").description("save resources").action(async (url, outPath) => {
        const browser = new browser_1.BrowserHelper();
        await browser.init(url);
        const resources = await browser.getResources();
        const queue = [];
        for (const resource of resources) {
            queue.push((0, utils_1.saveFile)(outPath, resource.path, resource.content));
        }
        await Promise.all(queue);
        console.log("Done saving resources");
        await browser.close();
    });
    program.parse(process.argv);
}
main();
