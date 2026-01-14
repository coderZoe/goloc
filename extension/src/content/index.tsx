import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useGoLocStore } from '../store';
import { Draggable } from '../components/Draggable';
import { FloatingButton } from '../components/FloatingButton';
import { StatsPanel } from '../components/StatsPanel';
// 导入样式
import '../index.css';

function ContentApp() {
    const {
        loadSettings,
        loadConfig,
        analyze,
        panelExpanded,
        setPanelExpanded,
        panelPosition,
        setPanelPosition,
        settings,
        panelWidth,
    } = useGoLocStore();

    // 初始化
    useEffect(() => {
        loadSettings();
        loadConfig();
    }, [loadSettings, loadConfig]);

    // 监听chrome.storage变更（用于同步Popup中的设置到Content Script）
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
            const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
                if (areaName === 'sync' && changes.goloc_settings) {
                    // 设置发生变化，重新加载
                    loadSettings();
                }
            };

            chrome.storage.onChanged.addListener(handleStorageChange);

            return () => {
                chrome.storage.onChanged.removeListener(handleStorageChange);
            };
        }
    }, [loadSettings]);

    // 自动分析逻辑...
    useEffect(() => {
        if (!settings?.autoAnalyze) return;
        const urlMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
        if (!urlMatch) return;
        const finalUrlMatch = urlMatch; // 闭包捕获

        if (['settings', 'pulls', 'issues', 'actions', 'wiki', 'security', 'insights'].includes(finalUrlMatch[2])) return;

        const timer = setTimeout(() => {
            if (!useGoLocStore.getState().settings?.autoAnalyze) return;
            // 简单获取分支，如果获取不到则让后端通过API获取默认分支
            const branchElement = document.querySelector('[data-hotkey=\"w\"] span[data-menu-button]');
            const branch = branchElement?.textContent?.trim() || '';
            analyze(`https://github.com/${finalUrlMatch[1]}/${finalUrlMatch[2]}`, branch);
        }, 1000);

        return () => clearTimeout(timer);
    }, [settings?.autoAnalyze, analyze]);

    // 悬浮按钮尺寸
    const FAB_SIZE = 56;

    // 核心逻辑：判断当前锚点是否在屏幕右侧
    // panelPosition 始终代表 "锚点" (FAB的位置)
    const isRightSide = panelPosition.x > window.innerWidth / 2;

    // 计算面板的渲染位置
    const panelRenderPos = isRightSide
        ? { x: panelPosition.x + FAB_SIZE - panelWidth, y: panelPosition.y }
        : panelPosition;

    const handlePanelDrag = (newPos: { x: number; y: number }, persist?: boolean) => {
        // 反向计算锚点位置
        const newAnchorPos = isRightSide
            ? { x: newPos.x - FAB_SIZE + panelWidth, y: newPos.y }
            : newPos;

        setPanelPosition(newAnchorPos, persist);
    };

    const handleFabClick = () => {
        if (!panelExpanded) {
            const urlMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
            if (urlMatch) {
                const [, owner, repo] = urlMatch;
                const branchElement = document.querySelector('[data-hotkey=\"w\"] span[data-menu-button]');
                const branch = branchElement?.textContent?.trim() || '';
                // 每次点击都重新分析，确保获取最新配置的结果
                analyze(`https://github.com/${owner}/${repo}`, branch);
            }
            setPanelExpanded(true);
        } else {
            setPanelExpanded(false);
        }
    };

    return (
        <div className="goloc-extension-container">
            {/* 悬浮按钮 - 使用锚点位置 */}
            {!panelExpanded && (
                <Draggable
                    position={panelPosition}
                    onPositionChange={setPanelPosition}
                    className="goloc-fab-container"
                >
                    <FloatingButton onClick={handleFabClick} />
                </Draggable>
            )}

            {/* 统计面板 - 使用计算后的渲染位置，并反向更新锚点 */}
            {panelExpanded && (
                <Draggable
                    position={panelRenderPos}
                    onPositionChange={handlePanelDrag}
                    className="goloc-panel-container"
                >
                    <StatsPanel onClose={() => setPanelExpanded(false)} />
                </Draggable>
            )}
        </div>
    );
}

// 注入到页面
function injectApp() {
    // 创建根容器
    const root = document.createElement('div');
    root.id = 'goloc-extension-root';
    root.setAttribute('data-goloc', 'true');

    document.body.appendChild(root);

    // 渲染React应用
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(
        <React.StrictMode>
            <ContentApp />
        </React.StrictMode>
    );
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectApp);
} else {
    injectApp();
}
