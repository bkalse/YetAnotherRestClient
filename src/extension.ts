
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const HISTORY_FILE = '.vscode/rest-client-history.json';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('restClient.open', () => {
      const panel = vscode.window.createWebviewPanel(
        'restClient',
        'REST API Client',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(
        message => {
          if (message.command === 'saveRequest') {
            saveRequestToFile(message.data);
          }
        },
        undefined,
        context.subscriptions
      );
    })
  );
}

function getWebviewContent(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script src="https://cdn.tailwindcss.com"></script>
    <title>REST Client</title>
  </head>
  <body class="p-4 font-sans bg-gray-100">
    <h2 class="text-xl font-bold mb-4">REST API Client</h2>
    <div class="space-y-2">
      <input class="w-full p-2 border rounded" id="url" placeholder="https://api.example.com" />
      <select class="w-full p-2 border rounded" id="method">
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>DELETE</option>
      </select>
      <textarea class="w-full p-2 border rounded" id="body" rows="6" placeholder="Request body (JSON)"></textarea>
      <button id="sendBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      <pre id="response" class="bg-black text-green-400 p-2 rounded h-60 overflow-auto"></pre>
    </div>

    <script>
      const vscode = acquireVsCodeApi();

      document.getElementById("sendBtn").addEventListener("click", async () => {
        const url = document.getElementById('url').value;
        const method = document.getElementById('method').value;
        const body = document.getElementById('body').value;

        const reqData = { url, method, body, timestamp: new Date().toISOString() };
        vscode.postMessage({ command: 'saveRequest', data: reqData });

        try {
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'GET' || method === 'DELETE' ? null : body
          });
          const text = await res.text();
          document.getElementById('response').textContent = 'Status: ' + res.status + '\\n\\n' + text;
        } catch (err) {
          document.getElementById('response').textContent = 'Error: ' + err;
        }
      });
    </script>
  </body>
  </html>
  `;
}


function saveRequestToFile(data: any) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;

  const historyFilePath = path.join(workspaceFolders[0].uri.fsPath, HISTORY_FILE);

  let history = [];
  if (fs.existsSync(historyFilePath)) {
    history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
  }
  history.push(data);
  fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
}

export function deactivate() {}
