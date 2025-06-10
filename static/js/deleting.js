// 检查 common.js 中的工具类是否加载
if (typeof PageStateManager === 'undefined') {
    console.error('PageStateManager 未定义，请检查 common.js 是否正确加载');
}
if (typeof PageRestorer === 'undefined') {
    console.error('PageRestorer 未定义，请检查 common.js 是否正确加载');
}
if (typeof DOMUtils === 'undefined') {
    console.error('DOMUtils 未定义，请检查 common.js 是否正确加载');
}

// 初始化状态管理器
const deleteStateManager = new PageStateManager('delete', 800);
const deleteRestorer = new PageRestorer(
    deleteStateManager,
    '/delete-status',
    '/stop-delete'
);

// 全局变量
let pollTimer = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('删除页面开始初始化...');
    initializeDeletePage();
});

// 初始化删除页面
function initializeDeletePage() {
    // 恢复本地状态
    const stateLoaded = deleteStateManager.load();
    console.log('本地状态加载结果:', stateLoaded);
    
    // 绑定表单事件
    bindDeleteFormEvents();
    
    // 检查并恢复状态
    checkAndRestoreDeleteState();
    
    console.log('删除页面初始化完成');
}

// 绑定表单事件
function bindDeleteFormEvents() {
    const deleteForm = document.getElementById('deleteForm');
    
    if (deleteForm) {
        deleteForm.addEventListener('reset', () => {
            deleteStateManager.clear();
            location.reload();
        });
    }
}

// 检查并恢复删除状态
async function checkAndRestoreDeleteState() {
    const result = await deleteRestorer.checkAndRestore();
    
    if (result.shouldRestore) {
        if (result.serverStatus) {
            // 根据服务器状态恢复UI
            restoreDeleteUI(result.serverStatus);
            // 开始轮询
            setTimeout(pollDeleteStatus, 1000);
        } else if (result.networkError) {
            // 网络错误，根据本地状态恢复
            restoreDeleteUIFromLocal();
            setTimeout(pollDeleteStatus, 5000);
        }
    }
    
    // 恢复表单状态
    restoreFormState();
}

// 根据服务器状态恢复删除UI
function restoreDeleteUI(serverStatus) {
    console.log('开始恢复删除UI...');
    
    // 恢复操作阶段状态
    const savedState = deleteStateManager.getState();
    const operationPhase = savedState.operationPhase || 'idle'; // 'detecting', 'selecting', 'removing'
    
    // 显示删除状态区域
    const deleteProgress = document.getElementById('deleteProgress');
    const deleteControls = document.querySelector('.delete-controls');
    
    let statusHtml = `
        <div class="status-item">
            <h3>操作状态: <span class="status-badge running">正在处理</span></h3>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#deleteProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.delete-controls', true);
    
    // 根据操作阶段恢复相应的UI状态
    if (operationPhase === 'selecting' && savedState.detectedNodes) {
        // 恢复节点选择状态
        restoreNodeSelection(savedState.detectedNodes, savedState.selectedNodes);
    }
    
    // 恢复日志内容
    const logs = deleteStateManager.getState().logs;
    if (logs && logs.length > 0) {
        console.log('恢复删除日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    console.log('删除UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreDeleteUIFromLocal() {
    if (!deleteStateManager.isRunning()) return;
    
    console.log('根据本地状态恢复删除UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>操作状态: <span class="status-badge running">尝试重连中...</span></h3>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#deleteProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.delete-controls', true);
    
    // 恢复日志
    const logs = deleteStateManager.getState().logs;
    if (logs && logs.length > 0) {
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    // 恢复节点选择状态（如果处于选择阶段）
    const savedState = deleteStateManager.getState();
    if (savedState.operationPhase === 'selecting' && savedState.detectedNodes) {
        restoreNodeSelection(savedState.detectedNodes, savedState.selectedNodes);
    }
}

// 恢复表单状态
function restoreFormState() {
    const savedConfig = deleteStateManager.getState().config;
    if (savedConfig) {
        console.log('恢复表单状态:', savedConfig);
        
        // 恢复模型路径
        if (savedConfig.modelPath) {
            const modelPathInput = document.getElementById('modelPath');
            if (modelPathInput) {
                modelPathInput.value = savedConfig.modelPath;
            }
        }
    }
}

// 恢复节点选择状态
function restoreNodeSelection(detectedNodes, selectedNodes = []) {
    const nodeSelectionDiv = document.getElementById('nodeSelection');
    const nodeListDiv = document.querySelector('.node-list');
    
    if (detectedNodes && Array.isArray(detectedNodes)) {
        DOMUtils.toggleDisplay('#nodeSelection', true);
        
        let nodesHtml = '';
        detectedNodes.forEach((node, index) => {
            const isSelected = selectedNodes.includes(node.name);
            nodesHtml += `
                <div class="node-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <label>
                        <input type="checkbox" class="node-checkbox" value="${node.name}" 
                               style="margin-right: 10px;" ${isSelected ? 'checked' : ''}>
                        <strong>输出:</strong> ${node.output}<br>
                        <strong>名称:</strong> ${node.name}
                    </label>
                </div>`;
        });
        nodeListDiv.innerHTML = nodesHtml;
        
        console.log('恢复了节点选择状态，共' + detectedNodes.length + '个节点');
    }
}

// 开始检测
function startDetect() {
    const modelPath = document.getElementById('modelPath').value;
    if (!modelPath) {
        alert('请选择模型文件');
        return;
    }

    if (deleteStateManager.isRunning()) {
        alert('已有操作在运行中');
        return;
    }

    const formData = new FormData();
    formData.append('modelPath', modelPath);

    // 保存配置和操作阶段到状态
    deleteStateManager.update({
        config: { modelPath: modelPath },
        operationPhase: 'detecting',
        logs: [] // 清空之前的日志
    });

    // 发送检测请求
    fetch('/start-delete-detect', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('节点检测启动成功');
            
            // 更新状态
            deleteStateManager.update({
                isRunning: true,
                status: 'running'
            });
            
            // 更新UI
            showDetectStarted();
            
            // 开始轮询状态
            setTimeout(pollDeleteStatus, 2000);
        } else {
            alert('检测启动失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('检测启动失败:', error);
        alert('检测启动失败: ' + error.message);
    });
}

// 显示检测开始状态
function showDetectStarted() {
    const statusHtml = `
        <div class="status-item">
            <h3>操作状态: <span class="status-badge running">正在检测</span></h3>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#deleteProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.delete-controls', true);
    
    // 隐藏节点选择区域
    DOMUtils.toggleDisplay('#nodeSelection', false);
}

// 开始移除
function startRemove() {
    const modelPath = document.getElementById('modelPath').value;
    const selectedNodes = [];
    
    // 获取选中的节点
    document.querySelectorAll('.node-checkbox:checked').forEach(checkbox => {
        selectedNodes.push(checkbox.value);
    });

    if (selectedNodes.length === 0) {
        alert('请选择要移除的节点');
        return;
    }

    const formData = new FormData();
    formData.append('modelPath', modelPath);
    selectedNodes.forEach(node => {
        formData.append('nodesToRemove', node);
    });

    // 更新状态 - 进入移除阶段
    deleteStateManager.update({
        operationPhase: 'removing',
        selectedNodes: selectedNodes,
        isRunning: true,
        status: 'running'
    });

    // 发送移除请求
    fetch('/start-delete-remove', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('节点移除启动成功');
            
            // 更新UI
            showRemoveStarted(selectedNodes);
            
            // 开始轮询状态
            setTimeout(pollDeleteStatus, 2000);
        } else {
            alert('移除启动失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('移除启动失败:', error);
        alert('移除启动失败: ' + error.message);
    });
}

// 显示移除开始状态
function showRemoveStarted(selectedNodes) {
    const statusHtml = `
        <div class="status-item">
            <h3>操作状态: <span class="status-badge running">正在移除</span></h3>
        </div>
        <div class="status-item">
            <h3>选中的节点:</h3>
            <pre>${selectedNodes.join(', ')}</pre>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#deleteProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.delete-controls', true);
    
    // 隐藏节点选择区域
    DOMUtils.toggleDisplay('#nodeSelection', false);
}

// 轮询删除状态
function pollDeleteStatus() {
    if (!deleteStateManager.isRunning()) return;
    
    fetch('/delete-status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('收到删除状态数据:', data);
            updateStatus(data);
        })
        .catch(error => {
            console.error('获取删除状态失败:', error);
            
            // 如果是网络错误，更新状态为重连中
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '重连中...');
            
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollDeleteStatus, retryTime);
        });
}

// 更新状态显示
function updateStatus(data) {
    const savedState = deleteStateManager.getState();
    const operationPhase = savedState.operationPhase || 'detecting';
    
    // 更新日志
    updateDeleteLogOutput(data);
    
    // 根据服务器状态和操作阶段处理
    if (data.status === 'running') {
        // 更新状态标签
        if (operationPhase === 'detecting') {
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '正在检测');
        } else if (operationPhase === 'removing') {
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '正在移除');
        }
        
        // 继续轮询
        setTimeout(pollDeleteStatus, 1000);
    } else if (data.status === 'completed') {
        if (operationPhase === 'detecting') {
            // 检测完成，显示节点选择
            handleDetectComplete(data);
        } else if (operationPhase === 'removing') {
            // 移除完成
            handleRemoveComplete(data);
        }
    } else if (data.status === 'stopped') {
        handleOperationStopped(data);
    } else if (data.status === 'error') {
        handleOperationError(data);
    }
}

// 更新删除日志输出
function updateDeleteLogOutput(data) {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;
    
    let hasNewLogs = false;
    
    if (data.stdout) {
        const lines = data.stdout.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stdout', line);
                deleteStateManager.addLog('stdout', line);
                hasNewLogs = true;
            }
        });
    }
    
    if (data.stderr) {
        const lines = data.stderr.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stderr', line);
                deleteStateManager.addLog('stderr', line);
                hasNewLogs = true;
            }
        });
    }
    
    if (data.error) {
        DOMUtils.addLogToContainer('#log-output', 'stderr', data.error);
        deleteStateManager.addLog('stderr', data.error);
        hasNewLogs = true;
    }
    
    // 自动滚动到底部
    if (hasNewLogs) {
        logOutput.scrollTop = logOutput.scrollHeight;
    }
}

// 处理检测完成
function handleDetectComplete(data) {
    console.log('节点检测已完成');
    
    // 更新状态为选择阶段
    deleteStateManager.update({
        isRunning: false,
        status: 'completed',
        operationPhase: 'selecting',
        detectedNodes: data.nodes || []
    });
    
    DOMUtils.toggleDisplay('.delete-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge completed');
    DOMUtils.updateElement('.status-badge', '检测完成');
    
    // 显示节点选择区域
    if (data.nodes && data.nodes.length > 0) {
        showNodeSelection(data.nodes);
    } else {
        alert('未检测到需要移除的反量化节点');
    }
    
    stopPolling();
}

// 显示节点选择区域
function showNodeSelection(nodes) {
    const nodeSelectionDiv = document.getElementById('nodeSelection');
    const nodeListDiv = document.querySelector('.node-list');
    
    DOMUtils.toggleDisplay('#nodeSelection', true);
    
    let nodesHtml = '';
    nodes.forEach((node, index) => {
        nodesHtml += `
            <div class="node-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <label>
                    <input type="checkbox" class="node-checkbox" value="${node.name}" style="margin-right: 10px;">
                    <strong>输出:</strong> ${node.output}<br>
                    <strong>名称:</strong> ${node.name}
                </label>
            </div>`;
    });
    nodeListDiv.innerHTML = nodesHtml;
    
    console.log('显示节点选择区域，共' + nodes.length + '个节点');
}

// 处理移除完成
function handleRemoveComplete(data) {
    console.log('节点移除已完成');
    
    // 更新状态管理
    deleteStateManager.update({
        isRunning: false,
        status: 'completed',
        operationPhase: 'completed'
    });
    
    DOMUtils.toggleDisplay('.delete-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge completed');
    DOMUtils.updateElement('.status-badge', '移除完成');
    
    // 隐藏节点选择区域
    DOMUtils.toggleDisplay('#nodeSelection', false);
    
    stopPolling();
}

// 处理操作停止
function handleOperationStopped(data) {
    console.log('操作已停止');
    
    // 更新状态管理
    deleteStateManager.update({
        isRunning: false,
        status: 'stopped'
    });
    
    DOMUtils.toggleDisplay('.delete-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge stopped');
    DOMUtils.updateElement('.status-badge', '已停止');
    
    stopPolling();
}

// 处理操作错误
function handleOperationError(data) {
    console.error('操作发生错误:', data.error);
    
    // 更新状态管理
    deleteStateManager.update({
        isRunning: false,
        status: 'error'
    });
    
    DOMUtils.toggleDisplay('.delete-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge error');
    DOMUtils.updateElement('.status-badge', '发生错误');
    
    stopPolling();
}

// 停止进程
async function stopProcess() {
    const result = await deleteRestorer.stopTask('确定要停止当前操作吗？');
    
    if (result.success) {
        handleOperationStopped(result.data);
    } else {
        alert('停止操作失败: ' + result.error);
    }
}

// 停止轮询
function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

// 全选/取消全选
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.node-checkbox');
    const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
    checkboxes.forEach(cb => cb.checked = anyUnchecked);
    
    // 保存选中状态
    const selectedNodes = [];
    document.querySelectorAll('.node-checkbox:checked').forEach(checkbox => {
        selectedNodes.push(checkbox.value);
    });
    deleteStateManager.update({ selectedNodes: selectedNodes });
}

// 文件浏览器相关功能
let currentPath = '/';
const modal = document.getElementById('fileBrowserModal');

function openFileBrowser() {
    modal.style.display = 'block';
    loadDirectory(currentPath);
}

function closeFileBrowser() {
    modal.style.display = 'none';
}

async function loadDirectory(path) {
    try {
        const response = await fetch('/api/list-directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                path: path,
                include_files: true,
                file_pattern: '*.bin'
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            currentPath = data.current_path;
            updateFileList(data);
        } else {
            alert(data.error || '加载目录失败');
        }
    } catch (error) {
        console.error('加载目录失败:', error);
        alert('加载目录失败');
    }
}

function updateFileList(data) {
    const fileList = document.getElementById('fileList');
    const currentPathElement = document.getElementById('currentPath');
    
    currentPathElement.textContent = data.current_path;
    fileList.innerHTML = '';
    
    // 添加文件项
    data.items.forEach(item => {
        const div = document.createElement('div');
        if (item.type === 'file') {
            div.className = 'file-item file';
            div.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${item.name}</span>
            `;
            div.onclick = () => selectFile(item.path);
        } else {
            div.className = 'file-item folder';
            div.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${item.name}</span>
            `;
            div.onclick = () => loadDirectory(item.path);
        }
        fileList.appendChild(div);
    });
}

function selectFile(filePath) {
    document.getElementById('modelPath').value = filePath;
    closeFileBrowser();
}

function navigateUp() {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
}
