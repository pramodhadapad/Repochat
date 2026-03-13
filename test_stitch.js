
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AQ.Ab8RN6KtLydlvHKtjCtRKHHyApQdSXyTVD6s0pt9dEM84VrAZA';
const ENDPOINT_HOST = 'stitch.googleapis.com';
const ENDPOINT_PATH = '/mcp';
const PROJECT_ID = '17312601772201490516';

function mcpRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: Date.now()
        });

        const options = {
            hostname: ENDPOINT_HOST,
            path: ENDPOINT_PATH,
            method: 'POST',
            headers: {
                'X-Goog-Api-Key': API_KEY,
                'Content-Type': 'application/json',
                'Content-Length': body.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

function callTool(name, args = {}) {
    return mcpRequest('tools/call', { name, arguments: args });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function main() {
    console.log('Listing tools to be sure...');
    const toolsResult = await mcpRequest('tools/list');
    fs.writeFileSync('stitch_tools.json', JSON.stringify(toolsResult, null, 2));
    
    const toolNames = (toolsResult.result?.tools || []).map(t => t.name);
    console.log('Available tools:', toolNames.join(', '));

    const screens = [
        { id: 'f8b7f777bf3e4d3e9f27d2a371a17438', name: 'Landing' },
        { id: 'dd9cbb0a583f436d8c4fc46c2a08f58e', name: 'Dashboard' },
        { id: '16d6b20962d74d8c963b5214fe50a43b', name: 'RepoChat' },
        { id: '604d6d6812664e0785cff60f7ffa1de6', name: 'Profile' },
        { id: '9abb4a2f94dd49e7b722a6fcf6cdcb0c', name: 'Collab' }
    ];

    const outputDir = path.join(__dirname, 'stitch_assets');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    for (const screen of screens) {
        console.log(`Fetching details for ${screen.name}...`);
        const screenResourceName = `projects/${PROJECT_ID}/screens/${screen.id}`;
        const res = await callTool('get_screen', {
            name: screenResourceName,
            projectId: PROJECT_ID,
            screenId: screen.id
        });

        if (res.result) {
            const s = res.result.structuredContent || res.result;
            if (s.htmlCode && s.htmlCode.downloadUrl) {
                const dest = path.join(outputDir, `${screen.name}.html`);
                console.log(`Downloading ${screen.name}.html from ${s.htmlCode.downloadUrl}...`);
                try {
                    await downloadFile(s.htmlCode.downloadUrl, dest);
                    console.log(`Saved ${screen.name}.html`);
                } catch (e) {
                    console.error(`Download failed for ${screen.name}:`, e.message);
                }
            }
            
            if (s.screenshot && s.screenshot.downloadUrl) {
                const imgDest = path.join(outputDir, `${screen.name}.png`);
                console.log(`Downloading screenshot for ${screen.name}...`);
                try {
                    await downloadFile(s.screenshot.downloadUrl, imgDest);
                    console.log(`Saved ${screen.name}.png`);
                } catch (e) {
                    console.error(`Screenshot download failed for ${screen.name}:`, e.message);
                }
            }
        } else {
            console.error(`Failed to get screen details for ${screen.name}:`, JSON.stringify(res.error || res, null, 2));
        }
    }
}

main();
