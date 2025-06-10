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
const quantizationStateManager = new PageStateManager('quantization', 800);
const quantizationRestorer = new PageRestorer(
    quantizationStateManager,
    '/api/checker-status',
    '/api/stop-checker'
);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('量化页面开始初始化...');
    initializeQuantizationPage();
});

// 初始化量化页面
function initializeQuantizationPage() {
    // 恢复本地状态
    const stateLoaded = quantizationStateManager.load();
    console.log('本地状态加载结果:', stateLoaded);
    
    // 绑定表单事件
    bindQuantizationFormEvents();
    
    // 检查并恢复状态
    checkAndRestoreQuantizationState();
    
    console.log('量化页面初始化完成');
}

// 绑定表单事件
function bindQuantizationFormEvents() {
    const quantizationForm = document.getElementById('quantizationForm');
    
    if (quantizationForm) {
        quantizationForm.addEventListener('submit', handleQuantizationFormSubmit);
        quantizationForm.addEventListener('reset', () => {
            quantizationStateManager.clear();
            location.reload();
        });
    }
}

// 检查并恢复量化状态
async function checkAndRestoreQuantizationState() {
    const result = await quantizationRestorer.checkAndRestore();
    
    if (result.shouldRestore) {
        if (result.serverStatus) {
            // 根据服务器状态恢复UI
            restoreQuantizationUI(result.serverStatus);
            // 开始轮询
            setTimeout(pollQuantizationStatus, 1000);
        } else if (result.networkError) {
            // 网络错误，根据本地状态恢复
            restoreQuantizationUIFromLocal();
            setTimeout(pollQuantizationStatus, 5000);
        }
    }
}

// 根据服务器状态恢复量化UI
function restoreQuantizationUI(serverStatus) {
    console.log('开始恢复量化UI...');
    
    // 禁用表单
    DOMUtils.toggleForm('#quantizationForm', true);
    
    // 显示量化状态区域
    const checkerProgress = document.getElementById('checkerProgress');
    const checkerControls = document.querySelector('.checker-controls');
    
    const statusHtml = `
        <div class="status-item">
            <h3>检查状态: <span class="status-badge running">正在检查</span></h3>
        </div>
        <div class="status-item">
            <h3>检查配置:</h3>
            <pre>${JSON.stringify(serverStatus.config || {}, null, 2)}</pre>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#checkerProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.checker-controls', true);
    
    // 恢复日志内容
    const logs = quantizationStateManager.getState().logs;
    if (logs && logs.length > 0) {
        console.log('恢复量化日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    console.log('量化UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreQuantizationUIFromLocal() {
    if (!quantizationStateManager.isRunning()) return;
    
    console.log('根据本地状态恢复量化UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>检查状态: <span class="status-badge running">尝试重连中...</span></h3>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#checkerProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.checker-controls', true);
    
    // 恢复日志
    const logs = quantizationStateManager.getState().logs;
    if (logs && logs.length > 0) {
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
}

// 处理量化表单提交
function handleQuantizationFormSubmit(event) {
    event.preventDefault();
    
    if (quantizationStateManager.isRunning()) {
        alert('已有检查任务在运行中');
        return;
    }
    
    const formData = new FormData(event.target);
    const config = Object.fromEntries(formData.entries());
    
    // 保存配置到状态
    quantizationStateManager.update({
        config: config,
        logs: [] // 清空之前的日志
    });
    
    submitQuantizationForm(formData);
}

// 提交量化表单
function submitQuantizationForm(formData) {
    console.log('提交量化表单...');
    
    // 显示加载状态
    const submitBtn = document.querySelector('#quantizationForm .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '检查中...';
    submitBtn.disabled = true;

    fetch('/model-quantization', {
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
            console.log('量化检查启动成功');
            
            // 更新状态
            quantizationStateManager.update({
                isRunning: true,
                status: 'running'
            });
            
            // 更新UI
            showQuantizationStarted(data);
            
            // 开始轮询状态
            setTimeout(pollQuantizationStatus, 2000);
        } else {
            alert('启动检查失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('提交量化失败:', error);
        alert('提交检查失败: ' + error.message);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// 显示量化开始状态
function showQuantizationStarted(data) {
    // 禁用表单
    DOMUtils.toggleForm('#quantizationForm', true);

    const statusHtml = `
        <div class="status-item">
            <h3>检查状态: <span class="status-badge running">正在检查</span></h3>
        </div>
        <div class="status-item">
            <h3>检查配置:</h3>
            <pre>${JSON.stringify(data.config, null, 2)}</pre>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#checkerProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.checker-controls', true);
}

// 轮询量化状态
function pollQuantizationStatus() {
    if (!quantizationStateManager.isRunning()) return;
    
    fetch('/api/checker-status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('收到量化状态数据:', data);
            
            if (data.status === 'running') {
                // 更新状态标签
                DOMUtils.updateClass('.status-badge', 'status-badge running');
                DOMUtils.updateElement('.status-badge', '正在检查');
                
                // 更新日志并保存到状态
                updateQuantizationLogOutput(data);
                
                // 继续轮询
                setTimeout(pollQuantizationStatus, 1000);
            } else if (data.status === 'completed') {
                updateQuantizationComplete(data);
            } else if (data.status === 'stopped') {
                updateQuantizationStopped(data);
            }
        })
        .catch(error => {
            console.error('获取量化状态失败:', error);
            
            // 如果是网络错误，更新状态为重连中
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '重连中...');
            
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollQuantizationStatus, retryTime);
        });
}

// 更新量化日志输出
function updateQuantizationLogOutput(data) {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;
    
    let hasNewLogs = false;
    
    if (data.stderr) {
        const lines = data.stderr.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stderr', line);
                quantizationStateManager.addLog('stderr', line);
                hasNewLogs = true;
            }
        });
    }
    
    if (data.stdout) {
        const lines = data.stdout.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stdout', line);
                quantizationStateManager.addLog('stdout', line);
                hasNewLogs = true;
            }
        });
    }
    
    // 自动滚动到底部
    if (hasNewLogs) {
        logOutput.scrollTop = logOutput.scrollHeight;
    }
}

// 更新量化完成状态
function updateQuantizationComplete(data) {
    // 更新状态管理
    quantizationStateManager.update({
        isRunning: false,
        status: 'completed'
    });
    
    DOMUtils.toggleDisplay('.checker-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge completed');
    DOMUtils.updateElement('.status-badge', '已完成');
    
    // 重新启用表单
    DOMUtils.toggleForm('#quantizationForm', false);
    
    // 显示最终日志
    updateQuantizationLogOutput(data);
    
    console.log('量化检查已完成');
}

// 更新量化停止状态
function updateQuantizationStopped(data) {
    // 更新状态管理
    quantizationStateManager.update({
        isRunning: false,
        status: 'stopped'
    });
    
    DOMUtils.toggleDisplay('.checker-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge stopped');
    DOMUtils.updateElement('.status-badge', '已停止');
    
    // 重新启用表单
    DOMUtils.toggleForm('#quantizationForm', false);
    
    console.log('量化检查已停止');
}

// 停止量化
async function stopChecker() {
    const result = await quantizationRestorer.stopTask('确定要停止检查吗？');
    
    if (result.success) {
        updateQuantizationStopped(result.data);
    } else {
        alert('停止检查失败: ' + result.error);
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
                file_pattern: '*.onnx'
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

// 为关闭按钮添加事件监听
document.querySelector('.close').onclick = closeFileBrowser;

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('fileBrowserModal');
    if (event.target == modal) {
        closeFileBrowser();
    }
};
