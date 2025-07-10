"use strict";
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const COLLECTIONS_FOLDER = '.vscode/rest-client-collections';
// Logging for debugging
function activate(context) {
    console.log('Activating extension...');
    let collectionsPath = context.globalState.get('restClient.collectionsPath');
    console.log('Initial collectionsPath:', collectionsPath);
    // Use globalState to store collections folder path
    collectionsPath = context.globalState.get('restClient.collectionsPath');
    function selectCollectionsFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            const folders = yield vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Collections Folder',
            });
            if (folders && folders.length > 0) {
                collectionsPath = folders[0].fsPath;
                context.globalState.update('restClient.collectionsPath', collectionsPath);
                vscode.window.showInformationMessage(`Collections folder set to: ${collectionsPath}`);
                collectionsProvider.setCollectionsPath(collectionsPath);
                collectionsProvider.refresh();
            }
        });
    }
    if (!collectionsPath) {
        vscode.window.showInformationMessage('Please select a folder to store REST client collections.');
        selectCollectionsFolder();
    }
    else {
        if (!fs.existsSync(collectionsPath)) {
            fs.mkdirSync(collectionsPath, { recursive: true });
        }
    }
    // Register TreeView provider for collections
    console.log('Initializing CollectionsProvider with path:', collectionsPath || '');
    const collectionsProvider = new CollectionsProvider(collectionsPath || '');
    vscode.window.registerTreeDataProvider('restClientCollections', collectionsProvider);
    console.log('Registered TreeDataProvider for restClientCollections');
    // Register command to open REST client webview
    context.subscriptions.push(vscode.commands.registerCommand('restClient.open', () => {
        var _a;
        RestClientPanel.createOrShow((_a = context.extensionUri) !== null && _a !== void 0 ? _a : vscode.Uri.file(context.extensionPath), collectionsProvider);
    }));
    // Register command to refresh collections view
    context.subscriptions.push(vscode.commands.registerCommand('restClient.refreshCollections', () => {
        collectionsProvider.refresh();
    }));
    // Register command to save request to collection
    context.subscriptions.push(vscode.commands.registerCommand('restClient.saveRequest', (request) => __awaiter(this, void 0, void 0, function* () {
        const collectionName = yield vscode.window.showInputBox({
            prompt: 'Enter collection name to save the request',
            placeHolder: 'My Collection',
        });
        if (!collectionName) {
            vscode.window.showWarningMessage('Collection name is required to save request.');
            return;
        }
        yield collectionsProvider.saveRequestToCollection(collectionName, request);
        vscode.window.showInformationMessage(`Request saved to collection '${collectionName}'.`);
        collectionsProvider.refresh();
    })));
    // Register command to select collections folder
    context.subscriptions.push(vscode.commands.registerCommand('restClient.selectCollectionsFolder', () => {
        selectCollectionsFolder();
    }));
}
class RestClientPanel {
    static createOrShow(extensionUri, collectionsProvider) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (RestClientPanel.currentPanel) {
            RestClientPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('restClient', 'REST API Client', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(extensionUri.fsPath, 'media'))],
        });
        RestClientPanel.currentPanel = new RestClientPanel(panel, extensionUri, collectionsProvider);
    }
    constructor(panel, extensionUri, collectionsProvider) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._collectionsProvider = collectionsProvider;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            console.log('Extension received message:', message.command, 'request:', message.request);
            switch (message.command) {
                case 'sendRequest':
                    {
                        const response = yield this._sendHttpRequest(message.request);
                        this._panel.webview.postMessage({ command: 'response', response });
                    }
                    break;
                case 'saveRequest':
                    {
                        const request = message.request;
                        vscode.commands.executeCommand('restClient.saveRequest', request);
                    }
                    break;
                case 'refreshCollections':
                    {
                        this._collectionsProvider.refresh();
                    }
                    break;
            }
        }), null, this._disposables);
    }
    dispose() {
        RestClientPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>REST API Client</title>
<!-- Tailwind CSS removed to comply with CSP; use inline styles instead -->
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 1rem;
    background-color: #f3f4f6;
    color: #333;
  }
  .tab {
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-bottom: 2px solid transparent;
    transition: border-color 0.3s;
  }
  .tab-active {
    border-color: #3b82f6;
    font-weight: bold;
  }
  .hidden {
    display: none;
  }
  textarea,
  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }
  button {
    background-color: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s;
  }
  button:hover {
    background-color: #2563eb;
  }
  button:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
  .header-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .header-row input {
    flex: 1;
  }
  .response-container {
    background-color: #1e293b;
    color: #d1d5db;
    padding: 1rem;
    border-radius: 0.375rem;
    height: 300px;
    overflow: auto;
    white-space: pre-wrap;
    font-family: monospace;
  }
  .response-tabs {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  .response-tab {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-bottom: 2px solid transparent;
    transition: border-color 0.3s;
  }
  .response-tab-active {
    border-color: #3b82f6;
    font-weight: bold;
  }
</style>
</head>
<body>
  <h1 class="text-2xl font-bold mb-4">REST API Client</h1>
  <div>
    <div class="flex gap-4 border-b mb-4">
      <div class="tab tab-active" id="tab-request">Request</div>
      <div class="tab" id="tab-headers">Headers</div>
      <div class="tab" id="tab-auth">Auth</div>
      <div class="tab" id="tab-payload">Payload</div>    
    </div>

    <div id="content-request" class="tab-content">
      <div class="mb-2">
        <select id="method" class="border rounded p-2 w-32">
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input type="text" id="url" placeholder="https://api.example.com" class="ml-2" />
        <button id="btnSend" class="ml-2">Send</button>
      </div>
    </div>

    <div id="content-headers" class="tab-content hidden">
      <div id="headers-list"></div>
      <button id="add-header">Add Header</button>
    </div>

    <div id="content-auth" class="tab-content hidden">
      <select id="auth-type" class="border rounded p-2 w-48 mb-2">
        <option value="none">None</option>
        <option value="basic">Basic Auth</option>
        <option value="bearer">Bearer Token</option>
      </select>
      <div id="auth-basic" class="hidden">
        <input type="text" id="auth-username" placeholder="Username" class="mb-2" />
        <input type="password" id="auth-password" placeholder="Password" />
      </div>
      <div id="auth-bearer" class="hidden">
        <input type="text" id="auth-token" placeholder="Token" />
      </div>
    </div>

    <div id="content-payload" class="tab-content hidden">
      <textarea id="payload" rows="10" placeholder="Request body (JSON)"></textarea>
    </div>

    <div class="response-tabs">
      <div id="response-tab-body" class="response-tab response-tab-active">Body</div>
      <div id="response-tab-headers" class="response-tab">Headers</div>
      <div id="response-tab-status" class="response-tab">Status</div>
      <div id="response-tab-time" class="response-tab">Time (ms)</div>
    </div>
    <div id="response-body" class="response-container"></div>
    <div id="response-headers" class="response-container hidden"></div>
    <div id="response-status" class="response-container hidden"></div>
    <div id="response-time" class="response-container hidden"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // Tab switching
    const tabs = ['request', 'headers', 'auth', 'payload'];
    tabs.forEach(tab => {
      document.getElementById('tab-' + tab).addEventListener('click', () => {
        tabs.forEach(t => {
          document.getElementById('tab-' + t).classList.remove('tab-active');
          document.getElementById('content-' + t).classList.add('hidden');
        });
        document.getElementById('tab-' + tab).classList.add('tab-active');
        document.getElementById('content-' + tab).classList.remove('hidden');
      });
    });

    // Auth type switching
    const authTypeSelect = document.getElementById('auth-type');
    authTypeSelect.addEventListener('change', () => {
      const val = authTypeSelect.value;
      document.getElementById('auth-basic').classList.toggle('hidden', val !== 'basic');
      document.getElementById('auth-bearer').classList.toggle('hidden', val !== 'bearer');
    });

    // Headers management
    const headersList = document.getElementById('headers-list');
    const addHeaderBtn = document.getElementById('add-header');

    function createHeaderRow(key = '', value = '') {
      const div = document.createElement('div');
      div.className = 'header-row';
      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.placeholder = 'Key';
      keyInput.value = key;
      const valueInput = document.createElement('input');
      valueInput.type = 'text';
      valueInput.placeholder = 'Value';
      valueInput.value = value;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => div.remove();
      div.appendChild(keyInput);
      div.appendChild(valueInput);
      div.appendChild(removeBtn);
      return div;
    }

    addHeaderBtn.addEventListener('click', () => {
      headersList.appendChild(createHeaderRow());
    });

    // Send request
    document.getElementById('btnSend').addEventListener('click', async () => {
      console.log('btnSend clicked');
      const method = document.getElementById('method').value;
      const url = document.getElementById('url').value.trim();
      if (!url) {
        alert('URL is required');
        return;
      }

      // Gather headers
      const headers = [];
      headersList.querySelectorAll('.header-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const key = inputs[0].value.trim();
        const value = inputs[1].value.trim();
        if (key) {
          headers.push({ key, value });
        }
      });

      // Gather auth
      const authType = document.getElementById('auth-type').value;
      let auth = { type: 'none' };
      if (authType === 'basic') {
        const username = document.getElementById('auth-username').value;
        const password = document.getElementById('auth-password').value;
        auth = { type: 'basic', username, password };
      } else if (authType === 'bearer') {
        const token = document.getElementById('auth-token').value;
        auth = { type: 'bearer', token };
      }

      // Payload
      const payload = document.getElementById('payload').value;

      const request = {
        id: generateId(),
        name: url,
        method,
        url: "https://api.restful-api.dev/objects",
        headers,
        auth,
        payload,
        timestamp: new Date().toISOString(),
      };

      console.log('Webview sending request:', request);
      vscode.postMessage({ command: 'sendRequest', request });

      // Save request button (optional)
      if (confirm('Save this request to a collection?')) {
        vscode.postMessage({ command: 'saveRequest', request });
      }
    });

    // Response tabs
    const responseTabs = ['body', 'headers', 'status', 'time'];
    responseTabs.forEach(tab => {
      document.getElementById('response-tab-' + tab).addEventListener('click', () => {
        responseTabs.forEach(t => {
          document.getElementById('response-tab-' + t).classList.remove('response-tab-active');
          document.getElementById('response-' + t).classList.add('hidden');
        });
        document.getElementById('response-tab-' + tab).classList.add('response-tab-active');
        document.getElementById('response-' + tab).classList.remove('hidden');
      });
    });

    // Receive response from extension
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'response') {
        const res = message.response;
        document.getElementById('response-status').textContent = res.status + ' ' + res.statusText;
        document.getElementById('response-time').textContent = res.time.toString();
        try {
          const json = JSON.parse(res.body);
          document.getElementById('response-body').textContent = JSON.stringify(json, null, 2);
        } catch {
          document.getElementById('response-body').textContent = res.body;
        }
        document.getElementById('response-headers').textContent = res.headers;
      }
    });

    function generateId() {
      return Math.random().toString(36).substr(2, 9);
    }
  </script>
</body>
</html>`;
    }
    _sendHttpRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {};
            request.headers.forEach(h => {
                headers[h.key] = h.value;
            });
            // Add auth headers
            if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
                const encoded = Buffer.from(`${request.auth.username}:${request.auth.password}`).toString('base64');
                headers['Authorization'] = `Basic ${encoded}`;
            }
            else if (request.auth.type === 'bearer' && request.auth.token) {
                headers['Authorization'] = `Bearer ${request.auth.token}`;
            }
            const fetch = require('node-fetch');
            const options = {
                method: request.method,
                headers,
            };
            if (request.method !== 'GET' && request.method !== 'DELETE' && request.payload) {
                headers['Content-Type'] = 'application/json';
                options.body = request.payload;
                console.log('Including request body:', request.payload);
            }
            const start = Date.now();
            try {
                const res = yield fetch(request.url, options);
                const time = Date.now() - start;
                const body = yield res.text();
                const headersArr = [];
                res.headers.forEach((value, key) => {
                    headersArr.push(`${key}: ${value}`);
                });
                const headersStr = headersArr.join('\n');
                return {
                    status: res.status,
                    statusText: res.statusText,
                    headers: headersStr,
                    body,
                    time,
                };
            }
            catch (err) {
                return {
                    status: 0,
                    statusText: 'Error',
                    headers: '',
                    body: (err instanceof Error) ? err.message : String(err),
                    time: 0,
                };
            }
        });
    }
}
class CollectionsProvider {
    constructor(collectionsPath) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.collections = [];
        this.collectionsPath = collectionsPath;
        this.loadCollections();
    }
    setCollectionsPath(newPath) {
        this.collectionsPath = newPath;
        this.loadCollections();
    }
    refresh() {
        this.loadCollections();
        this._onDidChangeTreeData.fire(null);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Return collections
            return Promise.resolve(this.collections.map(c => new CollectionItem(c)));
        }
        else if (element instanceof CollectionItem) {
            // Return requests in collection
            return Promise.resolve(element.collection.requests.map(r => new RequestItem(r)));
        }
        else {
            return Promise.resolve([]);
        }
    }
    loadCollections() {
        this.collections = [];
        if (!fs.existsSync(this.collectionsPath)) {
            return;
        }
        const files = fs.readdirSync(this.collectionsPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const fullPath = path.join(this.collectionsPath, file);
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const collection = JSON.parse(content);
                    this.collections.push(collection);
                }
                catch (_a) {
                    // ignore invalid files
                }
            }
        }
    }
    saveRequestToCollection(collectionName, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = this.collections.find(c => c.name === collectionName);
            if (!collection) {
                collection = {
                    id: generateId(),
                    name: collectionName,
                    requests: [],
                };
                this.collections.push(collection);
            }
            // Check if request with same id exists, replace it
            const existingIndex = collection.requests.findIndex(r => r.id === request.id);
            if (existingIndex >= 0) {
                collection.requests[existingIndex] = request;
            }
            else {
                collection.requests.push(request);
            }
            // Save collection to file
            const filePath = path.join(this.collectionsPath, `${collection.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
        });
    }
}
class CollectionItem extends vscode.TreeItem {
    constructor(collection) {
        super(collection.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.collection = collection;
        this.contextValue = 'collection';
    }
}
class RequestItem extends vscode.TreeItem {
    constructor(request) {
        super(request.name, vscode.TreeItemCollapsibleState.None);
        this.request = request;
        this.contextValue = 'request';
        this.command = {
            command: 'restClient.open',
            title: 'Open Request',
            arguments: [request],
        };
    }
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
function deactivate() { }
