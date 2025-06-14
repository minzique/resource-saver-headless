// import puppeteer from "puppeteer";

// import {BrowserHelper} from "./browser";
// // import browser from "./browser";

// const browserClient = new BrowserHelper();

// export async function getResourceContent(frameId: string, url: string) {

// }
import * as fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import * as path from "path";

export interface URLPathInfo {
  path: string;
  name: string;
  dataURI?: string;
}

/**
 * Resolves a URL to a local file path structure
 * @param cUrl - The URL to resolve
 * @param cType - Optional content type
 * @param cContent - Optional content for type detection
 * @returns Path information for saving the resource
 */
export function resolveURLToPath(cUrl: string, cType?: string, cContent?: string): URLPathInfo {
    let filepath: string;
    let filename: string;
    let isDataURI: boolean;
    
    const foundIndex = cUrl.search(/\:\/\//);
    
    // Check if the URL is a data URI or regular URL
    if ((foundIndex === -1) || (foundIndex >= 10)) {
        isDataURI = true;

        if (cUrl.indexOf('data:') === 0) {
            const dataURIInfo = cUrl.split(';')[0].split(',')[0].substring(0, 30).replace(/[^A-Za-z0-9]/g, '.');
            filename = dataURIInfo + '.' + (Math.random() * 1000000).toFixed(0) + '.txt';
        } else {
            filename = 'data.' + (Math.random() * 1000000).toFixed(0) + '.txt';
        }

        filepath = '_DataURI/' + filename;
    } else {
        isDataURI = false;
        if (cUrl.split('://')[0].includes('http')) {
            // For http:// https://
            filepath = cUrl.split('://')[1].split('?')[0];
        } else {
            // For webpack:// ng:// ftp://
            filepath = cUrl.replace('://', '---').split('?')[0];
        }
        
        if (filepath.charAt(filepath.length - 1) === '/') {
            filepath = filepath + 'index.html';
        }
        filename = filepath.substring(filepath.lastIndexOf('/') + 1);
    }

    // Remove query parameters from filename
    filename = filename.split(';')[0];
    filepath = filepath.substring(0, filepath.lastIndexOf('/') + 1) + filename;

    // Add appropriate file extension based on content type
    if (filename.search(/\./) === -1) {
        const extension = getFileExtension(cType, cContent);
        filepath = filepath + '.' + extension;
        filename = filename + '.' + extension;
    }

    // Sanitize file paths
    filepath = sanitizeFilePath(filepath);
    filename = sanitizeFileName(filename);

    // Decode URI components
    if (filepath.indexOf('%') !== -1) {
        try {
            filepath = decodeURIComponent(filepath);
            filename = decodeURIComponent(filename);
        } catch (err) {
            console.warn('Failed to decode URI components:', err);
        }
    }

    // Clean up path separators
    filepath = cleanPath(filepath);

    return {
        path: filepath,
        name: filename,
        dataURI: isDataURI ? cUrl : undefined
    };
}

/**
 * Determines file extension based on content type and content
 */
function getFileExtension(cType?: string, cContent?: string): string {
    if (!cType) return 'html';

    // Special case for images with Base64
    if (cType.indexOf('image') !== -1 && cContent) {
        if (cContent.charAt(0) === '/') return 'jpg';
        if (cContent.charAt(0) === 'R') return 'gif';
        if (cContent.charAt(0) === 'i') return 'png';
        return 'png'; // default for images
    }
    
    // Map content types to extensions
    const typeMap: Record<string, string> = {
        'stylesheet': 'css',
        'css': 'css',
        'json': 'json',
        'javascript': 'js',
        'html': 'html',
        'xml': 'xml',
        'svg': 'svg',
        'pdf': 'pdf',
    };

    for (const [type, ext] of Object.entries(typeMap)) {
        if (cType.indexOf(type) !== -1) {
            return ext;
        }
    }

    return 'html'; // default extension
}

/**
 * Sanitizes file path by removing invalid characters
 */
function sanitizeFilePath(filepath: string): string {
    return filepath
        .replace(/\\|\=|\*|\.$|\"|\'|\?|\~|\||\<|\>/g, '')
        .replace(/\/\//g, '/')
        .replace(/(\s|\.)\//g, '/')
        .replace(/\/(\s|\.)/g, '/');
}

/**
 * Sanitizes filename by removing invalid characters
 */
function sanitizeFileName(filename: string): string {
    return filename.replace(/\\|\=|\*|\.$|\"|\'|\?|\~|\||\<|\>/g, '');
}

/**
 * Cleans and normalizes file paths
 */
function cleanPath(filepath: string): string {
    // Strip double slashes
    while (filepath.includes('//')) {
        filepath = filepath.replace('//', '/');
    }

    // Strip leading slash
    if (filepath.charAt(0) === '/') {
        filepath = filepath.slice(1);
    }

    return filepath;
}

/**
 * Saves file content to the specified path
 * @param outFolder - Output directory
 * @param filePath - Relative file path
 * @param data - File content
 */
export async function saveFile(outFolder: string, filePath: string, data: string): Promise<void> {
    try {
        // Ensure output folder exists
        if (!existsSync(outFolder)) {
            mkdirSync(outFolder, { recursive: true });
        }

        const fullPath = path.join(outFolder, filePath);
        const directory = path.dirname(fullPath);

        // Create directory structure
        await fs.mkdir(directory, { recursive: true });
        
        // Write file
        await fs.writeFile(fullPath, data, 'utf-8');
        
        console.log(`Saved: ${filePath}`);
    } catch (err) {
        console.error(`Error writing file ${filePath}:`, err);
        throw err;
    }
}

// function recursiveMkdir(path) {

//     path.substring(0, path.lastIndexOf('/')).split('/').forEach(folder => {
//         if (!fs.existsSync(folder)) {

//     }
// }
