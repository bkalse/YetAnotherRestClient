import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './tailwind.css';
import axios from 'axios';

type TabType = 'Headers' | 'Body' | 'Auth' | 'Params';

type KeyValue = { key: string; value: string };

type AuthType = 'None' | 'Basic' | 'Bearer';

function App() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Headers');
  const [headers, setHeaders] = useState<KeyValue[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [authType, setAuthType] = useState<AuthType>('None');
  const [basicAuth, setBasicAuth] = useState({ username: '', password: '' });
  const [bearerToken, setBearerToken] = useState('');
  const [params, setParams] = useState<KeyValue[]>([{ key: '', value: '' }]);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!url) return;
    setLoading(true);
    setStatus(null);
    setTime(null);
    setResponse(null);
    const reqHeaders: Record<string, string> = {};
    headers.forEach(h => {
      if (h.key) reqHeaders[h.key] = h.value;
    });
    // Auth
    if (authType === 'Basic' && basicAuth.username && basicAuth.password) {
      reqHeaders['Authorization'] = 'Basic ' + btoa(`${basicAuth.username}:${basicAuth.password}`);
    } else if (authType === 'Bearer' && bearerToken) {
      reqHeaders['Authorization'] = 'Bearer ' + bearerToken;
    }
    // Params
    const searchParams = params.filter(p => p.key).map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    const fullUrl = searchParams ? `${url}${url.includes('?') ? '&' : '?'}${searchParams}` : url;
    const start = performance.now();
    try {
      const res = await axios({
        method: method as any,
        url: fullUrl,
        headers: reqHeaders,
        data: body && (method !== 'GET' && method !== 'DELETE') ? body : undefined,
        validateStatus: () => true,
      });
      setStatus(`${res.status} ${res.statusText}`);
      setResponse(res);
      setTime(Math.round(performance.now() - start));
    } catch (e: any) {
      setStatus('Error');
      setResponse(e.message);
      setTime(Math.round(performance.now() - start));
    }
    setLoading(false);
  };

  // Tab content renderers
  function renderTab() {
    if (activeTab === 'Headers') {
      return (
        <div>
          {headers.map((h, i) => (
            <div className="flex gap-2 mb-1" key={i}>
              <input className="border rounded px-2 py-1 flex-1" placeholder="Header Key" value={h.key} onChange={e => {
                const nh = [...headers]; nh[i].key = e.target.value; setHeaders(nh);
              }} />
              <input className="border rounded px-2 py-1 flex-1" placeholder="Header Value" value={h.value} onChange={e => {
                const nh = [...headers]; nh[i].value = e.target.value; setHeaders(nh);
              }} />
              <button className="text-red-500" onClick={() => setHeaders(headers.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
          <button className="text-blue-600 mt-1" onClick={() => setHeaders([...headers, { key: '', value: '' }])}>+ Add Header</button>
        </div>
      );
    }
    if (activeTab === 'Body') {
      return (
        <textarea className="border rounded w-full min-h-[80px] p-2" placeholder="Request body (JSON, text, etc.)" value={body} onChange={e => setBody(e.target.value)} />
      );
    }
    if (activeTab === 'Auth') {
      return (
        <div className="space-y-2">
          <select className="border rounded px-2 py-1" value={authType} onChange={e => setAuthType(e.target.value as AuthType)}>
            <option value="None">None</option>
            <option value="Basic">Basic Auth</option>
            <option value="Bearer">Bearer Token</option>
          </select>
          {authType === 'Basic' && (
            <div className="flex gap-2">
              <input className="border rounded px-2 py-1" placeholder="Username" value={basicAuth.username} onChange={e => setBasicAuth({ ...basicAuth, username: e.target.value })} />
              <input className="border rounded px-2 py-1" placeholder="Password" type="password" value={basicAuth.password} onChange={e => setBasicAuth({ ...basicAuth, password: e.target.value })} />
            </div>
          )}
          {authType === 'Bearer' && (
            <input className="border rounded px-2 py-1 w-full" placeholder="Bearer token" value={bearerToken} onChange={e => setBearerToken(e.target.value)} />
          )}
        </div>
      );
    }
    if (activeTab === 'Params') {
      return (
        <div>
          {params.map((p, i) => (
            <div className="flex gap-2 mb-1" key={i}>
              <input className="border rounded px-2 py-1 flex-1" placeholder="Param Key" value={p.key} onChange={e => {
                const np = [...params]; np[i].key = e.target.value; setParams(np);
              }} />
              <input className="border rounded px-2 py-1 flex-1" placeholder="Param Value" value={p.value} onChange={e => {
                const np = [...params]; np[i].value = e.target.value; setParams(np);
              }} />
              <button className="text-red-500" onClick={() => setParams(params.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
          <button className="text-blue-600 mt-1" onClick={() => setParams([...params, { key: '', value: '' }])}>+ Add Param</button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">YetAnotherRestClient</h1>
        <button className="px-3 py-1 bg-blue-600 text-white rounded">Manage Environments</button>
      </header>
      <main className="p-4">
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex gap-2 mb-2">
            <select className="border rounded px-2 py-1" value={method} onChange={e => setMethod(e.target.value)}>
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
            <input className="flex-1 border rounded px-2 py-1" placeholder="Enter request URL..." value={url} onChange={e => setUrl(e.target.value)} />
            <button className="px-4 py-1 bg-green-600 text-white rounded" onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
          </div>
          <div className="flex gap-2 border-b mb-2">
            {(['Headers', 'Body', 'Auth', 'Params'] as TabType[]).map(tab => (
              <button
                key={tab}
                className={`py-1 px-2 ${activeTab === tab ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="min-h-[60px]">{renderTab()}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="flex gap-4 mb-2">
            <span>Status: <span className="font-semibold">{status ?? '-'}</span></span>
            <span>Time: <span className="font-semibold">{time !== null ? `${time}ms` : '-'}</span></span>
          </div>
          <div className="border rounded p-2 min-h-[100px] bg-gray-50 whitespace-pre-wrap text-sm overflow-x-auto">
            {response ? (typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data || response) : 'Response body here'}
          </div>
        </div>
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
