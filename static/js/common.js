// 通用状态管理工具
class PageStateManager {
    constructor(pageName, maxLogs = 800) {
        this.pageName = pageName;
        this.maxLogs = maxLogs;
        this.state = {
            isRunning: false,
            status: 'idle',
            config: null,
            logs: [],
            timestamp: Date.now()
        };
    }

    // 保存状态到localStorage
    save() {
        const stateData = {
            ...this.state,
            timestamp: Date.now()
        };
        localStorage.setItem(`${this.pageName}State`, JSON.stringify(stateData));
        console.log(`${this.pageName}状态已保存:`, stateData);
    }

    // 从localStorage恢复状态
    load() {
        try {
            const savedData = localStorage.getItem(`${this.pageName}State`);
            if (savedData) {
                const stateData = JSON.parse(savedData);
                // 检查数据是否过期（超过24小时）
                if (Date.now() - stateData.timestamp < 24 * 60 * 60 * 1000) {
                    this.state = { ...this.state, ...stateData };
                    console.log(`${this.pageName}状态已恢复:`, stateData);
                    return true;
                } else {
                    // 数据过期，清除
                    this.clear();
                }
            }
        } catch (error) {
            console.error(`恢复${this.pageName}状态失败:`, error);
            this.clear();
        }
        return false;
    }

    // 清除保存的状态
    clear() {
        localStorage.removeItem(`${this.pageName}State`);
        this.state = {
            isRunning: false,
            status: 'idle',
            config: null,
            logs: [],
            timestamp: Date.now()
        };
        console.log(`${this.pageName}状态已清除`);
    }

    // 更新状态并保存
    update(updates) {
        Object.assign(this.state, updates);
        this.save();
    }

    // 添加日志
    addLog(type, content) {
        this.state.logs.push({
            type: type,
            content: content,
            timestamp: Date.now()
        });

        // 限制日志数量
        if (this.state.logs.length > this.maxLogs + 200) {
            this.state.logs = this.state.logs.slice(-this.maxLogs);
        }

        this.save();
    }

    // 获取状态
    getState() {
        return { ...this.state };
    }

    // 检查是否正在运行
    isRunning() {
        return this.state.isRunning;
    }
}

// 通用页面恢复功能
class PageRestorer {
    constructor(stateManager, apiStatusEndpoint, apiStopEndpoint) {
        this.stateManager = stateManager;
        this.apiStatusEndpoint = apiStatusEndpoint;
        this.apiStopEndpoint = apiStopEndpoint;
        this.pollInterval = null;
    }

    // 检查并恢复页面状态
    async checkAndRestore() {
        try {
            console.log(`检查${this.stateManager.pageName}服务器状态...`);
            
            // 首先检查本地是否有已完成的任务状态
            const localState = this.stateManager.getState();
            if (localState.status === 'completed' && localState.config) {
                console.log('发现已完成的任务状态，询问用户是否恢复');
                const shouldRestoreCompleted = await this.askUserRestore(localState);
                if (shouldRestoreCompleted) {
                    return { shouldRestore: true, serverStatus: null, restoreCompleted: true };
                } else {
                    // 用户选择不恢复，清除旧状态
                    this.stateManager.clear();
                    return { shouldRestore: false, serverStatus: null };
                }
            }
            
            const response = await fetch(this.apiStatusEndpoint);
            
            if (response.ok) {
                const serverStatus = await response.json();
                console.log('服务器状态:', serverStatus);
                
                if (serverStatus.status === 'running') {
                    console.log(`检测到服务器有${this.stateManager.pageName}任务在运行，开始恢复状态...`);
                    
                    // 恢复状态
                    this.stateManager.update({
                        isRunning: true,
                        status: 'running',
                        config: serverStatus.config || this.stateManager.state.config
                    });
                    
                    return { shouldRestore: true, serverStatus: serverStatus };
                } else if (serverStatus.status === 'stopped' || serverStatus.status === 'completed') {
                    console.log(`服务器${this.stateManager.pageName}任务已结束`);
                    
                    // 检查本地是否有相应的状态，如果有且是运行中状态，需要更新为完成状态
                    if (this.stateManager.isRunning()) {
                        console.log('更新本地状态为已完成');
                        this.stateManager.update({
                            isRunning: false,
                            status: serverStatus.status
                        });
                        
                        // 如果是刚完成的任务，询问用户是否查看结果
                        const shouldViewResult = await this.askUserViewResult();
                        if (shouldViewResult) {
                            return { shouldRestore: true, serverStatus: serverStatus, justCompleted: true };
                        }
                    }
                    
                    return { shouldRestore: false, serverStatus: serverStatus };
                }
            } else {
                console.log(`无法获取服务器状态，可能没有${this.stateManager.pageName}任务在运行`);
                
                // 检查本地是否有完成的任务状态需要恢复
                if (localState.status === 'completed') {
                    const shouldRestoreCompleted = await this.askUserRestore(localState);
                    if (shouldRestoreCompleted) {
                        return { shouldRestore: true, serverStatus: null, restoreCompleted: true };
                    }
                }
                
                if (this.stateManager.isRunning()) {
                    console.log('本地状态与服务器不一致，清除本地状态');
                    this.stateManager.clear();
                }
                return { shouldRestore: false, serverStatus: null };
            }
        } catch (error) {
            console.error(`检查服务器状态失败:`, error);
            
            // 网络错误时，检查本地是否有完成的任务状态
            const localState = this.stateManager.getState();
            if (localState.status === 'completed') {
                const shouldRestoreCompleted = await this.askUserRestore(localState);
                if (shouldRestoreCompleted) {
                    return { shouldRestore: true, serverStatus: null, restoreCompleted: true, networkError: true };
                }
            }
            
            if (this.stateManager.isRunning()) {
                console.log('网络错误，但尝试根据本地状态恢复UI');
                return { shouldRestore: true, serverStatus: null, networkError: true };
            }
            return { shouldRestore: false, serverStatus: null, networkError: true };
        }
    }

    // 询问用户是否恢复已完成的任务状态
    async askUserRestore(localState) {
        return new Promise((resolve) => {
            const taskInfo = this.getTaskInfoString(localState);
            const modal = this.createRestoreModal(taskInfo, resolve);
            document.body.appendChild(modal);
        });
    }

    // 询问用户是否查看刚完成的任务结果
    async askUserViewResult() {
        return new Promise((resolve) => {
            const modal = this.createViewResultModal(resolve);
            document.body.appendChild(modal);
        });
    }

    // 获取任务信息字符串
    getTaskInfoString(localState) {
        const timeStr = new Date(localState.timestamp).toLocaleString();
        let taskInfo = `任务时间: ${timeStr}`;
        
        if (localState.config) {
            // 根据不同页面显示不同的配置信息
            if (this.stateManager.pageName === 'training') {
                taskInfo += `\n模型类型: ${localState.config.modelType || '未知'}`;
                taskInfo += `\n数据集: ${localState.config.datasetPath || '未知'}`;
            } else if (this.stateManager.pageName === 'export') {
                taskInfo += `\n模型文件: ${localState.config.modelPath || '未知'}`;
                taskInfo += `\n导出格式: ${localState.config.exportFormat || '未知'}`;
            } else if (this.stateManager.pageName === 'quantization') {
                taskInfo += `\n模型文件: ${localState.config.modelPath || '未知'}`;
                taskInfo += `\n量化类型: ${localState.config.quantizationType || '未知'}`;
            } else if (this.stateManager.pageName === 'conversion') {
                taskInfo += `\n模型文件: ${localState.config.modelPath || '未知'}`;
                taskInfo += `\n目标平台: ${localState.config.targetPlatform || '未知'}`;
            } else if (this.stateManager.pageName === 'detection') {
                taskInfo += `\n模型文件: ${localState.config.modelPath || '未知'}`;
            } else if (this.stateManager.pageName === 'delete') {
                taskInfo += `\n模型文件: ${localState.config.modelPath || '未知'}`;
            }
        }
        
        return taskInfo;
    }

    // 创建恢复任务模态框
    createRestoreModal(taskInfo, resolve) {
        const modal = document.createElement('div');
        modal.className = 'modal restore-modal';
        modal.style.cssText = `
            display: block;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background-color: #fefefe;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                border-radius: 8px;
                width: 400px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h3 style="color: #333; margin-bottom: 15px;">发现之前的任务结果</h3>
                <div style="
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 4px;
                    margin: 15px 0;
                    text-align: left;
                    white-space: pre-line;
                    word-wrap: break-word;
                    word-break: break-all;
                    font-size: 14px;
                    color: #666;
                    max-height: 200px;
                    overflow-y: auto;
                ">${taskInfo}</div>
                <p style="color: #666; margin: 15px 0;">是否要查看之前的任务结果？</p>
                <div style="margin-top: 20px;">
                    <button id="restoreYes" style="
                        background-color: #ff8c00;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 10px;
                        font-size: 14px;
                    ">查看结果</button>
                    <button id="restoreNo" style="
                        background-color: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 10px;
                        font-size: 14px;
                    ">开始新任务</button>
                </div>
            </div>
        `;
        
        modal.querySelector('#restoreYes').onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };
        
        modal.querySelector('#restoreNo').onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };
        
        return modal;
    }

    // 创建查看结果模态框
    createViewResultModal(resolve) {
        const modal = document.createElement('div');
        modal.className = 'modal view-result-modal';
        modal.style.cssText = `
            display: block;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background-color: #fefefe;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                border-radius: 8px;
                width: 350px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h3 style="color: #28a745; margin-bottom: 15px;">任务已完成！</h3>
                <p style="color: #666; margin: 15px 0;">是否要查看任务结果？</p>
                <div style="margin-top: 20px;">
                    <button id="viewYes" style="
                        background-color: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 10px;
                        font-size: 14px;
                    ">查看结果</button>
                    <button id="viewNo" style="
                        background-color: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 10px;
                        font-size: 14px;
                    ">关闭</button>
                </div>
            </div>
        `;
        
        modal.querySelector('#viewYes').onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };
        
        modal.querySelector('#viewNo').onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };
        
        return modal;
    }

    // 开始轮询
    startPolling(pollFunction, interval = 1000) {
        if (this.pollInterval) {
            clearTimeout(this.pollInterval);
        }
        this.pollInterval = setTimeout(pollFunction, interval);
    }

    // 停止轮询
    stopPolling() {
        if (this.pollInterval) {
            clearTimeout(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // 通用停止任务
    async stopTask(confirmMessage = '确定要停止当前任务吗？') {
        if (!this.stateManager.isRunning()) return;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            const response = await fetch(this.apiStopEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    this.stateManager.update({
                        isRunning: false,
                        status: 'stopped'
                    });
                    this.stopPolling();
                    return { success: true, data: data };
                } else {
                    return { success: false, error: data.message };
                }
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error(`停止${this.stateManager.pageName}失败:`, error);
            return { success: false, error: error.message };
        }
    }
}

// 通用DOM工具函数
const DOMUtils = {
    // 安全地获取元素
    getElement: function(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`元素未找到: ${selector}`);
        }
        return element;
    },

    // 安全地更新元素内容
    updateElement: function(selector, content, isHTML = false) {
        const element = this.getElement(selector);
        if (element) {
            if (isHTML) {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
    },

    // 安全地更新元素类名
    updateClass: function(selector, className) {
        const element = this.getElement(selector);
        if (element) {
            element.className = className;
        }
    },

    // 安全地显示/隐藏元素
    toggleDisplay: function(selector, show) {
        const element = this.getElement(selector);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    },

    // 禁用/启用表单
    toggleForm: function(formSelector, disable) {
        const form = this.getElement(formSelector);
        if (form) {
            const inputs = form.querySelectorAll('input, select, button, textarea');
            inputs.forEach(input => {
                if (disable) {
                    if (input.type !== 'button' && !input.classList.contains('stop-btn')) {
                        input.disabled = true;
                    }
                } else {
                    if (input.type !== 'button' || input.classList.contains('submit-btn') || input.classList.contains('reset-btn')) {
                        input.disabled = false;
                    }
                }
            });
        }
    },

    // 添加日志到日志容器
    addLogToContainer: function(logContainerSelector, logType, content) {
        const logContainer = this.getElement(logContainerSelector);
        if (logContainer && content.trim()) {
            const logDiv = document.createElement('div');
            logDiv.className = logType;
            logDiv.textContent = content;
            logContainer.appendChild(logDiv);
            
            // 自动滚动到底部
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    },

    // 恢复日志到容器
    restoreLogsToContainer: function(logContainerSelector, logs) {
        const logContainer = this.getElement(logContainerSelector);
        if (logContainer && logs && logs.length > 0) {
            // 清空现有日志
            logContainer.innerHTML = '';
            
            // 添加保存的日志
            logs.forEach(log => {
                this.addLogToContainer(logContainerSelector, log.type, log.content);
            });
            
            console.log(`恢复了 ${logs.length} 条日志`);
        }
    }
};

// 导出到全局
window.PageStateManager = PageStateManager;
window.PageRestorer = PageRestorer;
window.DOMUtils = DOMUtils; 