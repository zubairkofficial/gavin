import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseString } from 'xml2js';

const repoUrl = 'https://github.com/usgpo/bulk-data.git';
const cloneDir = './cloned_repo';

function deleteDirectorySync(dirPath: string) {
    try {
        require('fs').rmSync(dirPath, { recursive: true, force: true });
        console.log(`Successfully deleted: ${dirPath}`);
    } catch (error: any) {
        console.error(`Error deleting directory: ${error.message}`);
    }
}

function execPromise(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                if (stderr && !stderr.includes('Cloning into')) {
                    console.error(`stderr: ${stderr}`);
                }
                resolve();
            }
        });
    });
}

function parseXmlPromise(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
        parseString(xml, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

function cleanString(xmlContent: string): string {
    if (typeof xmlContent !== 'string') return xmlContent;
    return xmlContent
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim();
}

/**
 * Async generator: clones the repo, parses XML files, yields { file, title, contant }
 */
export async function* parseXmlTitlesFromRepo() {
    await execPromise(`git clone ${repoUrl} ${cloneDir}`);
    const updatedDir = path.join(cloneDir, 'ndash-changes-March2024/updated');
    let files: string[] = [];
    try {
        files = await fs.readdir(updatedDir);
    } catch (err: any) {
        console.error(`Error reading directory: ${err.message}`);
        return;
    }
    const xmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.xml');
    for (const file of xmlFiles) {
        try {
            const filePath = path.join(updatedDir, file);
            const xmlContent = await fs.readFile(filePath, 'utf8');
            let parsedData = cleanString(xmlContent);
            let title: string | null = null;
            try {
                const Data = await parseXmlPromise(xmlContent);
                title = Data?.DLPSTEXTCLASS?.HEADER?.[0]?.FILEDESC?.[0]?.TITLESTMT?.[0]?.TITLE?.[0] ;
                if(title) title = title.trim();
                if(!title){
                    console.log(`No title found in file ${file}`);
                }
            } catch (parseErr: any) {
                console.error(`Error parsing XML file ${file}:`, parseErr.message);
            }
            // console.log(`Parsed file: ${file}, Title: ${title}`);
            yield { file, title, contant: parsedData };
        } catch (readError: any) {
            console.error(`Error reading file ${file}:`, readError.message);
            yield { file, title: null, contant: '' };
        }
    }
    deleteDirectorySync(cloneDir);
}

// Example usage for for-await-of:
// (async () => {
//   for await (const { file, title, contant } of parseXmlTitlesFromRepo()) {
//     console.log(`File: ${file}, Title: ${title}`);
//   }
// })();