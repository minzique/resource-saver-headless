import { BrowserHelper } from "../src/browser";

import { Command, Option } from "commander";
import { saveFile } from "../src/utils";
import { parse } from "path";

// simple cli for resource saver


async function main() {
    const program = new Command();
    program
      .name("ResourceSaverHeadless")
      .description("ResourceSaverHeadless")
      .version("1.0.0")
     

    program.command("save <url> <outPath>").description("save resources").action(async (url , outPath) => {
        const browser = new BrowserHelper()

        await browser.init(url);
        const resources = await browser.getResources();
        const queue = []
        for (const resource of resources) {
          queue.push( saveFile(outPath, resource.path, resource.content))
        }

        await Promise.all(queue)
        console.log("Done saving resources")

        await browser.close();
    })

    program.parse(process.argv)
    
}

main()