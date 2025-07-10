
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
      <div class="flex space-x-2"><select class="w-1/5 p-2 border rounded" id="method">
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>DELETE</option>
      </select><input class="w-4/5 p-2 border rounded" id="url" placeholder="https://api.example.com" /></div>
      <textarea class="w-full p-2 border rounded" id="body" rows="6" placeholder="Request body (JSON)"></textarea>
      <button id="sendBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
    </div>

    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-1">Status: <span id="status" class="font-mono text-blue-700">N/A</span></h3>
      <div class="flex space-x-2 mb-2">
        <button id="tab-body" class="px-3 py-1 bg-blue-500 text-white rounded">Body</button>
        <button id="tab-headers" class="px-3 py-1 bg-gray-300 text-black rounded">Headers</button>
      </div>
      <div id="response-body" class="bg-black text-green-400 p-2 rounded h-64 overflow-auto whitespace-pre-wrap"></div>
      <div id="response-headers" class="bg-gray-800 text-yellow-200 p-2 rounded h-64 overflow-auto whitespace-pre-wrap hidden"></div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();

      window.addEventListener('DOMContentLoaded', () => {
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
            const headers = [...res.headers.entries()]
              .map(([k, v]) => k + ': ' + v)
              .join('\n');

            document.getElementById('status').textContent = res.status + ' ' + res.statusText;

            try {
              const json = JSON.parse(text);
              document.getElementById('response-body').textContent = JSON.stringify(json, null, 2);
            } catch {
              document.getElementById('response-body').textContent = text;
            }

            document.getElementById('response-headers').textContent = headers;

          } catch (err) {
            document.getElementById('status').textContent = 'Error';
            document.getElementById('response-body').textContent = 'Error: ' + err;
            document.getElementById('response-headers').textContent = '';
          }
        });

        document.getElementById("tab-body").addEventListener("click", () => {
          document.getElementById("response-body").classList.remove("hidden");
          document.getElementById("response-headers").classList.add("hidden");
          document.getElementById("tab-body").classList.add("bg-blue-500", "text-white");
          document.getElementById("tab-headers").classList.remove("bg-blue-500", "text-white");
          document.getElementById("tab-headers").classList.add("bg-gray-300", "text-black");
        });

        document.getElementById("tab-headers").addEventListener("click", () => {
          document.getElementById("response-headers").classList.remove("hidden");
          document.getElementById("response-body").classList.add("hidden");
          document.getElementById("tab-headers").classList.add("bg-blue-500", "text-white");
          document.getElementById("tab-body").classList.remove("bg-blue-500", "text-white");
          document.getElementById("tab-body").classList.add("bg-gray-300", "text-black");
        });
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
