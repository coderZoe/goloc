// Background Service Worker - 代理网络请求
// 处理来自 Content Script 的消息，避免 Mixed Content 限制

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FETCH_REQUEST') {
        handleFetchRequest(message.url, message.options)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
        return true; // 保持消息通道开放以等待异步响应
    }
});

async function handleFetchRequest(url: string, options?: RequestInit): Promise<any> {
    try {
        console.log('[Background] Fetching:', url);
        const response = await fetch(url, options);
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        console.error('[Background] Fetch error:', error);
        throw error;
    }
}
