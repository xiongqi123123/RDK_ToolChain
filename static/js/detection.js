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
const detectionStateManager = new PageStateManager('detection', 800);
const detectionRestorer = new PageRestorer(
    detectionStateManager,
    '/api/detection-status',
    '/api/stop-detection'
);

// 文件浏览器状态
let currentBrowserMode = 'model';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('检测页面开始初始化...');
    initializeDetectionPage();
});

// 初始化检测页面
function initializeDetectionPage() {
    // 恢复本地状态
    const stateLoaded = detectionStateManager.load();
    console.log('本地状态加载结果:', stateLoaded);
    
    // 绑定表单事件
    bindDetectionFormEvents();
    
    // 检查并恢复状态
    checkAndRestoreDetectionState();
    
    console.log('检测页面初始化完成');
}

// 绑定表单事件
function bindDetectionFormEvents() {
    const detectionForm = document.getElementById('detectionForm');
    
    if (detectionForm) {
        detectionForm.addEventListener('submit', handleDetectionFormSubmit);
        detectionForm.addEventListener('reset', () => {
            detectionStateManager.clear();
            location.reload();
        });
    }
}

// 检查并恢复检测状态
async function checkAndRestoreDetectionState() {
    const result = await detectionRestorer.checkAndRestore();
    
    if (result.shouldRestore) {
        if (result.serverStatus) {
            // 根据服务器状态恢复UI
            restoreDetectionUI(result.serverStatus);
            
            // 如果不是刚完成的任务，开始轮询
            if (!result.justCompleted) {
                setTimeout(pollDetectionStatus, 1000);
            }
        } else if (result.restoreCompleted) {
            // 恢复已完成的任务状态
            restoreCompletedDetectionUI();
        } else if (result.networkError) {
            // 网络错误，根据本地状态恢复
            restoreDetectionUIFromLocal();
            setTimeout(pollDetectionStatus, 5000);
        }
    }
    
    // 恢复表单状态
    restoreFormState();
}

// 根据服务器状态恢复检测UI
function restoreDetectionUI(serverStatus) {
    console.log('开始恢复检测UI...');
    
    // 禁用表单
    DOMUtils.toggleForm('#detectionForm', true);
    
    // 显示检测状态区域
    const detectionProgress = document.getElementById('detectionProgress');
    const detectionControls = document.querySelector('.detection-controls');
    
    const statusHtml = `
        <div class="status-item">
            <h3>检测状态: <span class="status-badge running">正在检测</span></h3>
        </div>
        <div class="status-item">
            <h3>检测配置:</h3>
            <pre>${JSON.stringify(serverStatus.config || {}, null, 2)}</pre>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#detectionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.detection-controls', true);
    
    // 隐藏性能分析图
    DOMUtils.toggleDisplay('#perfImage', false);
    
    // 恢复日志内容
    const logs = detectionStateManager.getState().logs;
    if (logs && logs.length > 0) {
        console.log('恢复检测日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    // 如果任务已完成且有性能图，则显示性能图
    const savedState = detectionStateManager.getState();
    if (serverStatus.status === 'completed' && savedState.perfImage) {
        showPerfImage(savedState.perfImage);
    }
    
    console.log('检测UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreDetectionUIFromLocal() {
    if (!detectionStateManager.isRunning()) return;
    
    console.log('根据本地状态恢复检测UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>检测状态: <span class="status-badge running">尝试重连中...</span></h3>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#detectionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.detection-controls', true);
    DOMUtils.toggleDisplay('#perfImage', false);
    
    // 恢复日志
    const logs = detectionStateManager.getState().logs;
    if (logs && logs.length > 0) {
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
}

// 恢复已完成的检测UI
function restoreCompletedDetectionUI() {
    const savedState = detectionStateManager.getState();
    console.log('恢复已完成的检测任务UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>检测状态: <span class="status-badge completed">已完成</span></h3>
            <p>检测已于: ${new Date(savedState.timestamp).toLocaleString()} 完成</p>
        </div>
        <div class="status-item">
            <h3>检测日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#detectionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.detection-controls', false);
    
    // 恢复日志
    const logs = savedState.logs;
    if (logs && logs.length > 0) {
        console.log('恢复检测日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    // 恢复性能分析图片（如果有的话）
    if (savedState.perfImage) {
        console.log('恢复性能分析图片:', savedState.perfImage);
        showPerfImage(savedState.perfImage);
    }
    
    console.log('已完成任务UI恢复完成');
}

// 恢复表单状态
function restoreFormState() {
    const savedConfig = detectionStateManager.getState().config;
    if (savedConfig) {
        console.log('恢复检测表单状态:', savedConfig);
        
        // 恢复各个表单字段
        Object.keys(savedConfig).forEach(key => {
            const element = document.getElementById(key);
            if (element && savedConfig[key]) {
                element.value = savedConfig[key];
            }
        });
    }
}

// 处理检测表单提交
function handleDetectionFormSubmit(event) {
    event.preventDefault();
    
    if (detectionStateManager.isRunning()) {
        alert('已有检测任务在运行中');
        return;
    }
    
    const formData = new FormData(event.target);
    const config = Object.fromEntries(formData.entries());
    
    // 保存配置到状态
    detectionStateManager.update({
        config: config,
        logs: [] // 清空之前的日志
    });
    
    submitDetectionForm(formData);
}

// 提交检测表单
function submitDetectionForm(formData) {
    console.log('提交检测表单...');
    
    // 显示加载状态
    const submitBtn = document.querySelector('#detectionForm .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '检测中...';
    submitBtn.disabled = true;

    fetch('/model-detection', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('服务器响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('服务器返回数据:', data);
        
        if (data.status === 'success') {
            console.log('模型检测启动成功');
            
            // 更新状态
            detectionStateManager.update({
                isRunning: true,
                status: 'running'
            });
            
            // 更新UI
            showDetectionStarted(data);
            
            // 开始轮询状态
            setTimeout(pollDetectionStatus, 2000);
        } else {
            alert('启动检测失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('提交检测失败:', error);
        alert('提交检测失败: ' + error.message);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// 显示检测开始状态
function showDetectionStarted(data) {
    // 禁用表单
    DOMUtils.toggleForm('#detectionForm', true);

    const statusHtml = `
        <div class="status-item">
            <h3>检测状态: <span class="status-badge running">正在检测</span></h3>
        </div>
        <div class="status-item">
            <h3>检测配置:</h3>
            <pre>${JSON.stringify(data.config, null, 2)}</pre>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#detectionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.detection-controls', true);
    
    // 隐藏性能分析图
    DOMUtils.toggleDisplay('#perfImage', false);
}

// 轮询检测状态
function pollDetectionStatus() {
    if (!detectionStateManager.isRunning()) return;
    
    fetch('/api/detection-status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('收到检测状态数据:', data);
            
            if (data.status === 'running') {
                // 更新状态标签
                DOMUtils.updateClass('.status-badge', 'status-badge running');
                DOMUtils.updateElement('.status-badge', '正在检测');
                
                // 更新日志并保存到状态
                updateDetectionLogOutput(data);
                
                // 继续轮询
                setTimeout(pollDetectionStatus, 1000);
            } else if (data.status === 'completed') {
                updateDetectionComplete(data);
            } else if (data.status === 'stopped') {
                updateDetectionStopped(data);
            }
        })
        .catch(error => {
            console.error('获取检测状态失败:', error);
            
            // 如果是网络错误，更新状态为重连中
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '重连中...');
            
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollDetectionStatus, retryTime);
        });
}

// 更新检测日志输出
function updateDetectionLogOutput(data) {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;
    
    let hasNewLogs = false;
    
    if (data.stdout) {
        const lines = data.stdout.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stdout', line);
                detectionStateManager.addLog('stdout', line);
                hasNewLogs = true;
            }
        });
    }
    
    if (data.stderr) {
        const lines = data.stderr.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stderr', line);
                detectionStateManager.addLog('stderr', line);
                hasNewLogs = true;
            }
        });
    }
    
    // 自动滚动到底部
    if (hasNewLogs) {
        logOutput.scrollTop = logOutput.scrollHeight;
    }
}

// 更新检测完成状态
function updateDetectionComplete(data) {
    // 更新状态管理
    detectionStateManager.update({
        isRunning: false,
        status: 'completed',
        perfImage: data.perf_image // 保存性能图路径
    });
    
    DOMUtils.toggleDisplay('.detection-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge completed');
    DOMUtils.updateElement('.status-badge', '已完成');
    
    // 重新启用表单
    DOMUtils.toggleForm('#detectionForm', false);
    
    // 显示最终日志
    updateDetectionLogOutput(data);
    
    // 显示模型可视化图片
    if (data.perf_image) {
        showPerfImage(data.perf_image);
    }
    
    console.log('模型检测已完成');
}

// 显示性能分析图
function showPerfImage(imagePath) {
    const perfImageDiv = document.getElementById('perfImage');
    const perfImageDisplay = document.getElementById('perfImageDisplay');
    
    if (perfImageDiv && perfImageDisplay) {
        perfImageDisplay.src = `/perf_image/${imagePath}`;
        DOMUtils.toggleDisplay('#perfImage', true);
        
        console.log('显示性能分析图:', imagePath);
    }
}

// 更新检测停止状态
function updateDetectionStopped(data) {
    // 更新状态管理
    detectionStateManager.update({
        isRunning: false,
        status: 'stopped'
    });
    
    DOMUtils.toggleDisplay('.detection-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge stopped');
    DOMUtils.updateElement('.status-badge', '已停止');
    
    // 重新启用表单
    DOMUtils.toggleForm('#detectionForm', false);
    
    // 隐藏性能分析图
    DOMUtils.toggleDisplay('#perfImage', false);
    
    console.log('模型检测已停止');
}

// 停止检测
async function stopDetection() {
    const result = await detectionRestorer.stopTask('确定要停止检测吗？');
    
    if (result.success) {
        updateDetectionStopped(result.data);
    } else {
        alert('停止检测失败: ' + result.error);
    }
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

// 为关闭按钮添加事件监听（如果存在的话）
const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.onclick = closeFileBrowser;
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('fileBrowserModal');
    if (event.target == modal) {
        closeFileBrowser();
    }
}; 