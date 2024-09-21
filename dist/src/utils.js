"use strict";
// import puppeteer from "puppeteer";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = exports.resolveURLToPath = void 0;
// import {BrowserHelper} from "./browser";
// // import browser from "./browser";
// const browserClient = new BrowserHelper();
// export async function getResourceContent(frameId: string, url: string) {
// }
const fs = __importStar(require("fs/promises"));
const fs_1 = require("fs");
function resolveURLToPath(cUrl, cType, cContent) {
    var filepath, filename, isDataURI;
    var foundIndex = cUrl.search(/\:\/\//);
    // Check the url whether it is a link or a string of text data
    if ((foundIndex === -1) || (foundIndex >= 10)) {
        isDataURI = true;
        // console.log('Data URI Detected!!!!!');
        if (cUrl.indexOf('data:') === 0) {
            var dataURIInfo = cUrl.split(';')[0].split(',')[0].substring(0, 30).replace(/[^A-Za-z0-9]/g, '.');
            // console.log('=====> ',dataURIInfo);
            filename = dataURIInfo + '.' + (Math.random() * 1000000).toFixed(0) + '.txt';
        }
        else {
            filename = 'data.' + (Math.random() * 1000000).toFixed(0) + '.txt';
        }
        filepath = '_DataURI/' + filename;
    }
    else {
        isDataURI = false;
        if (cUrl.split('://')[0].includes('http')) {
            // For http:// https://
            filepath = cUrl.split('://')[1].split('?')[0];
        }
        else {
            // For webpack:// ng:// ftp://
            filepath = cUrl.replace('://', '---').split('?')[0];
        }
        if (filepath.charAt(filepath.length - 1) === '/') {
            filepath = filepath + 'index.html';
        }
        filename = filepath.substring(filepath.lastIndexOf('/') + 1);
    }
    // Get Rid of QueryString after ;
    filename = filename.split(';')[0];
    filepath = filepath.substring(0, filepath.lastIndexOf('/') + 1) + filename;
    // Add default extension to non extension filename
    if (filename.search(/\./) === -1) {
        var haveExtension = null;
        if (cType && cContent) {
            // Special Case for Images with Base64
            if (cType.indexOf('image') !== -1) {
                if (cContent.charAt(0) == '/') {
                    filepath = filepath + '.jpg';
                    haveExtension = 'jpg';
                }
                if (cContent.charAt(0) == 'R') {
                    filepath = filepath + '.gif';
                    haveExtension = 'gif';
                }
                if (cContent.charAt(0) == 'i') {
                    filepath = filepath + '.png';
                    haveExtension = 'png';
                }
            }
            // Stylesheet | CSS
            if (cType.indexOf('stylesheet') !== -1 || cType.indexOf('css') !== -1) {
                filepath = filepath + '.css';
                haveExtension = 'css';
            }
            // JSON
            if (cType.indexOf('json') !== -1) {
                filepath = filepath + '.json';
                haveExtension = 'json';
            }
            // Javascript
            if (cType.indexOf('javascript') !== -1) {
                filepath = filepath + '.js';
                haveExtension = 'js';
            }
            // HTML
            if (cType.indexOf('html') !== -1) {
                filepath = filepath + '.html';
                haveExtension = 'html';
            }
            if (!haveExtension) {
                filepath = filepath + '.html';
                haveExtension = 'html';
            }
        }
        else {
            // Add default html for text document
            filepath = filepath + '.html';
            haveExtension = 'html';
        }
        filename = filename + '.' + haveExtension;
        // console.log('File without extension: ', filename, filepath);
    }
    // Remove path violation case
    filepath = filepath
        .replace(/\\|\=|\*|\.$|\"|\'|\?|\~|\||\<|\>/g, '')
        .replace(/\/\//g, '/')
        .replace(/(\s|\.)\//g, '/')
        .replace(/\/(\s|\.)/g, '/');
    filename = filename
        .replace(/\\|\=|\*|\.$|\"|\'|\?|\~|\||\<|\>/g, '');
    // Decode URI
    if (filepath.indexOf('%') !== -1) {
        try {
            filepath = decodeURIComponent(filepath);
            filename = decodeURIComponent(filename);
        }
        catch (err) {
            console.log(err);
        }
    }
    // Strip double slashes
    while (filepath.includes('//')) {
        filepath = filepath.replace('//', '/');
    }
    // Strip the first slash '/src/...' -> 'src/...'
    if (filepath.charAt(0) === '/') {
        filepath = filepath.slice(1);
    }
    //  console.log('Save to: ', filepath);
    //  console.log('File name: ',filename);
    return {
        path: filepath,
        name: filename,
        dataURI: isDataURI && cUrl
    };
}
exports.resolveURLToPath = resolveURLToPath;
async function saveFile(outFolder, path, data) {
    try {
        (0, fs_1.existsSync)(outFolder) || (0, fs_1.mkdirSync)(outFolder, { recursive: true });
        await fs.mkdir(outFolder + '/' + path.substring(0, path.lastIndexOf('/')), { recursive: true });
        await fs.writeFile(outFolder + '/' + path, data);
    }
    catch (err) {
        console.error('Error writing file', err);
        // throw err;
    }
}
exports.saveFile = saveFile;
// function recursiveMkdir(path) {
//     path.substring(0, path.lastIndexOf('/')).split('/').forEach(folder => {
//         if (!fs.existsSync(folder)) {
//     }
// }
