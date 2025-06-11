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
const conversionStateManager = new PageStateManager('conversion', 800);
const conversionRestorer = new PageRestorer(
    conversionStateManager,
    '/api/conversion-status',
    '/api/stop-conversion'
);

// 文件浏览器状态
let currentBrowserMode = ''; // 'model' 或 'caldata'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('转换页面开始初始化...');
    initializeConversionPage();
});

// 初始化转换页面
function initializeConversionPage() {
    // 恢复本地状态
    const stateLoaded = conversionStateManager.load();
    console.log('本地状态加载结果:', stateLoaded);
    
    // 绑定表单事件
    bindConversionFormEvents();
    
    // 绑定norm_type选择事件
    bindNormTypeEvent();
    
    // 初始化mean value显示状态
    updateMeanValueVisibility();
    
    // 检查并恢复状态
    checkAndRestoreConversionState();
    
    console.log('转换页面初始化完成');
}

// 绑定表单事件
function bindConversionFormEvents() {
    const conversionForm = document.getElementById('conversionForm');
    
    if (conversionForm) {
        conversionForm.addEventListener('submit', handleConversionFormSubmit);
        conversionForm.addEventListener('reset', () => {
            conversionStateManager.clear();
            location.reload();
        });
    }
        
    // 绑定输入框的用户修改追踪
    const scaleValueInput = document.getElementById('scaleValue');
    const meanValueInput = document.getElementById('meanValue');
    const removeNodeTypeInput = document.getElementById('removeNodeType');
    
    if (scaleValueInput) {
        scaleValueInput.addEventListener('input', () => {
            scaleValueInput.dataset.userModified = 'true';
        });
    }
    
    if (meanValueInput) {
        meanValueInput.addEventListener('input', () => {
            meanValueInput.dataset.userModified = 'true';
        });
            }
            
    if (removeNodeTypeInput) {
        removeNodeTypeInput.addEventListener('input', () => {
            removeNodeTypeInput.dataset.userModified = 'true';
        });
    }
}

// 检查并恢复转换状态
async function checkAndRestoreConversionState() {
    const result = await conversionRestorer.checkAndRestore();
    
    if (result.shouldRestore) {
        if (result.serverStatus) {
            // 根据服务器状态恢复UI
            restoreConversionUI(result.serverStatus);
            
            // 如果不是刚完成的任务，开始轮询
            if (!result.justCompleted) {
                setTimeout(pollConversionStatus, 1000);
            }
        } else if (result.restoreCompleted) {
            // 恢复已完成的任务状态
            restoreCompletedConversionUI();
        } else if (result.networkError) {
            // 网络错误，根据本地状态恢复
            restoreConversionUIFromLocal();
            setTimeout(pollConversionStatus, 5000);
        }
    }
    
    // 恢复表单状态
    restoreFormState();
}

// 根据服务器状态恢复转换UI
function restoreConversionUI(serverStatus) {
    console.log('开始恢复转换UI...');
    
    // 禁用表单
    DOMUtils.toggleForm('#conversionForm', true);
    
    // 显示转换状态区域
    const conversionProgress = document.getElementById('conversionProgress');
    const conversionControls = document.querySelector('.conversion-controls');
    
    const statusHtml = `
        <div class="status-item">
            <h3>转换状态: <span class="status-badge running">正在转换</span></h3>
        </div>
            <div class="status-item">
            <h3>转换配置:</h3>
            <pre>${JSON.stringify(serverStatus.config || {}, null, 2)}</pre>
            </div>
            <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#conversionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.conversion-controls', true);
    
    // 恢复日志内容
    const logs = conversionStateManager.getState().logs;
    if (logs && logs.length > 0) {
        console.log('恢复转换日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    console.log('转换UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreConversionUIFromLocal() {
    if (!conversionStateManager.isRunning()) return;
    
    console.log('根据本地状态恢复转换UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>转换状态: <span class="status-badge running">尝试重连中...</span></h3>
            </div>
            <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
            </div>
        `;
        
    DOMUtils.updateElement('#conversionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.conversion-controls', true);
        
    // 恢复日志
    const logs = conversionStateManager.getState().logs;
    if (logs && logs.length > 0) {
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
}

// 恢复已完成的转换UI
function restoreCompletedConversionUI() {
    const savedState = conversionStateManager.getState();
    console.log('恢复已完成的转换任务UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>转换状态: <span class="status-badge completed">已完成</span></h3>
            <p>转换已于: ${new Date(savedState.timestamp).toLocaleString()} 完成</p>
        </div>
            <div class="status-item">
            <h3>转换日志:</h3>
            <div class="log-output" id="log-output"></div>
            </div>
        `;
    
    DOMUtils.updateElement('#conversionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.conversion-controls', false);
    
    // 恢复日志
    const logs = savedState.logs;
    if (logs && logs.length > 0) {
        console.log('恢复转换日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    console.log('已完成任务UI恢复完成');
}

// 恢复表单状态
function restoreFormState() {
    const savedConfig = conversionStateManager.getState().config;
    if (savedConfig) {
        console.log('恢复转换表单状态:', savedConfig);
        
        // 恢复各个表单字段
        Object.keys(savedConfig).forEach(key => {
            const element = document.getElementById(key);
            if (element && savedConfig[key]) {
                element.value = savedConfig[key];
            }
        });
        
        // 恢复动态节点信息
        if (savedConfig.nodePath && Array.isArray(savedConfig.nodePath)) {
            // 重建动态节点配置区域
            const savedNodePaths = savedConfig.nodePath;
            const savedInputTypes = savedConfig.nodeInputType || [];
            const savedOutputTypes = savedConfig.nodeOutputType || [];
            
            // 清空现有的节点配置
            const nodeInfoContainer = document.getElementById('nodeInfoContainer');
            nodeInfoContainer.innerHTML = '';
            
            // 重建保存的节点配置
            for (let i = 0; i < savedNodePaths.length; i++) {
                addNodeInfo();
                const nodeInfos = document.querySelectorAll('.node-info');
                const currentNodeInfo = nodeInfos[nodeInfos.length - 1];
                
                const pathInput = currentNodeInfo.querySelector('input[name="nodePath[]"]');
                const inputTypeSelect = currentNodeInfo.querySelector('select[name="nodeInputType[]"]');
                const outputTypeSelect = currentNodeInfo.querySelector('select[name="nodeOutputType[]"]');
                
                if (pathInput) pathInput.value = savedNodePaths[i] || '';
                if (inputTypeSelect) inputTypeSelect.value = savedInputTypes[i] || '';
                if (outputTypeSelect) outputTypeSelect.value = savedOutputTypes[i] || '';
    }
}
    }
}

// 处理转换表单提交
function handleConversionFormSubmit(event) {
    event.preventDefault();
    
    if (conversionStateManager.isRunning()) {
        alert('已有转换任务在运行中');
        return;
    }
    
    const formData = new FormData(event.target);
    const config = {};
    
    // 处理表单数据，包括数组字段
    for (let [key, value] of formData.entries()) {
        if (config[key]) {
            // 如果已存在，转换为数组
            if (!Array.isArray(config[key])) {
                config[key] = [config[key]];
            }
            config[key].push(value);
        } else {
            config[key] = value;
        }
    }
    
    // 保存配置到状态
    conversionStateManager.update({
        config: config,
        logs: [] // 清空之前的日志
    });
    
    submitConversionForm(formData);
}

// 提交转换表单
function submitConversionForm(formData) {
    console.log('提交转换表单...');
    
    // 显示加载状态
    const submitBtn = document.querySelector('#conversionForm .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '转换中...';
    submitBtn.disabled = true;

    fetch('/model-conversion', {
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
            console.log('模型转换启动成功');
            
            // 更新状态
            conversionStateManager.update({
                isRunning: true,
                status: 'running'
            });
            
            // 更新UI
            showConversionStarted(data);
            
            // 开始轮询状态
            setTimeout(pollConversionStatus, 2000);
        } else {
            alert('启动转换失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('提交转换失败:', error);
        alert('提交转换失败: ' + error.message);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// 显示转换开始状态
function showConversionStarted(data) {
    // 禁用表单
    DOMUtils.toggleForm('#conversionForm', true);

    const statusHtml = `
        <div class="status-item">
            <h3>转换状态: <span class="status-badge running">正在转换</span></h3>
        </div>
        <div class="status-item">
            <h3>转换配置:</h3>
            <pre>${JSON.stringify(data.config, null, 2)}</pre>
        </div>
        <div class="status-item">
            <h3>运行日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#conversionProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.conversion-controls', true);
}

// 轮询转换状态
function pollConversionStatus() {
    if (!conversionStateManager.isRunning()) return;
    
    fetch('/api/conversion-status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('收到转换状态数据:', data);
            
            if (data.status === 'running') {
                // 更新状态标签
                DOMUtils.updateClass('.status-badge', 'status-badge running');
                DOMUtils.updateElement('.status-badge', '正在转换');
                
                // 更新日志并保存到状态
                updateConversionLogOutput(data);
                
                // 继续轮询
                setTimeout(pollConversionStatus, 1000);
            } else if (data.status === 'completed') {
                updateConversionComplete(data);
            } else if (data.status === 'stopped') {
                updateConversionStopped(data);
            }
        })
        .catch(error => {
            console.error('获取转换状态失败:', error);
            
            // 如果是网络错误，更新状态为重连中
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '重连中...');
            
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollConversionStatus, retryTime);
        });
}

// 更新转换日志输出
function updateConversionLogOutput(data) {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;
    
    let hasNewLogs = false;

    if (data.stdout) {
        const lines = data.stdout.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stdout', line);
                conversionStateManager.addLog('stdout', line);
                hasNewLogs = true;
            }
        });
    }
    
    if (data.stderr) {
        const lines = data.stderr.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                DOMUtils.addLogToContainer('#log-output', 'stderr', line);
                conversionStateManager.addLog('stderr', line);
                hasNewLogs = true;
            }
        });
    }

    // 自动滚动到底部
    if (hasNewLogs) {
    logOutput.scrollTop = logOutput.scrollHeight;
    }
}

// 更新转换完成状态
function updateConversionComplete(data) {
    // 更新状态管理
    conversionStateManager.update({
        isRunning: false,
        status: 'completed'
    });
    
    DOMUtils.toggleDisplay('.conversion-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge completed');
    DOMUtils.updateElement('.status-badge', '已完成');
    
    // 重新启用表单
    DOMUtils.toggleForm('#conversionForm', false);
    
    // 显示最终日志
    updateConversionLogOutput(data);
    
    console.log('模型转换已完成');
}

// 更新转换停止状态
function updateConversionStopped(data) {
    // 更新状态管理
    conversionStateManager.update({
        isRunning: false,
        status: 'stopped'
    });
    
    DOMUtils.toggleDisplay('.conversion-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge stopped');
    DOMUtils.updateElement('.status-badge', '已停止');
    
    // 重新启用表单
    DOMUtils.toggleForm('#conversionForm', false);
    
    console.log('模型转换已停止');
}

// 停止转换
async function stopConversion() {
    const result = await conversionRestorer.stopTask('确定要停止转换吗？');
    
    if (result.success) {
        updateConversionStopped(result.data);
            } else {
        alert('停止转换失败: ' + result.error);
            }
}

// 文件浏览器相关功能
function openModelBrowser() {
    currentBrowserMode = 'model';
    const modal = document.getElementById('fileBrowserModal');
    const browserTitle = document.getElementById('browserTitle');
    const selectBtn = document.getElementById('selectBtn');
    
    browserTitle.textContent = '选择ONNX模型文件';
    selectBtn.style.display = 'none';
    modal.style.display = 'block';
    loadDirectory('/', true);
}

function openCalDataBrowser() {
    currentBrowserMode = 'caldata';
    const modal = document.getElementById('fileBrowserModal');
    const browserTitle = document.getElementById('browserTitle');
    const selectBtn = document.getElementById('selectBtn');
    
    browserTitle.textContent = '选择校准数据集文件夹';
    selectBtn.style.display = 'inline-block';
    modal.style.display = 'block';
    loadDirectory('/', false);
}

function closeFileBrowser() {
    const modal = document.getElementById('fileBrowserModal');
    modal.style.display = 'none';
    currentBrowserMode = '';
}

async function loadDirectory(path, includeFiles) {
    try {
        const requestBody = {
            path: path,
            include_files: includeFiles
        };
        
        if (includeFiles && currentBrowserMode === 'model') {
            requestBody.file_pattern = '*.onnx';
        }
        
        const response = await fetch('/api/list-directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        if (response.ok) {
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
            div.onclick = () => {
                const includeFiles = currentBrowserMode === 'model';
                loadDirectory(item.path, includeFiles);
            };
        }
            fileList.appendChild(div);
        });
}

function selectFile(filePath) {
    if (currentBrowserMode === 'model') {
    document.getElementById('modelPath').value = filePath;
    }
    closeFileBrowser();
}

function selectCurrentFolder() {
    const currentPath = document.getElementById('currentPath').textContent;
    if (currentBrowserMode === 'caldata') {
    document.getElementById('calDataDir').value = currentPath;
    }
    closeFileBrowser();
}

function navigateUp() {
    const currentPath = document.getElementById('currentPath').textContent;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    const includeFiles = currentBrowserMode === 'model';
    loadDirectory(parentPath, includeFiles);
    }

// 节点信息管理
function addNodeInfo() {
    const container = document.getElementById('nodeInfoContainer');
    const nodeItem = document.createElement('div');
    nodeItem.className = 'node-info-item';
    nodeItem.innerHTML = `
        <div class="node-info-container">
            <label>节点路径
                <button type="button" class="remove-node-btn" onclick="removeNodeInfo(this)">
                    <i class="fas fa-minus"></i> 删除
                </button>
            </label>
            <input type="text" name="nodePath[]" placeholder="节点路径" class="node-path">
            <label>nodeInputType</label>
            <select name="nodeInputType[]" class="node-type">
                <option value="int8">int8</option>
                <option value="int16">int16</option>
            </select>
            <label>nodeOutputType</label>
            <select name="nodeOutputType[]" class="node-type">
                <option value="int8">int8</option>
                <option value="int16">int16</option>
            </select>
        </div>
    `;
    container.appendChild(nodeItem);
}

function removeNodeInfo(button) {
    const nodeItem = button.closest('.node-info-item');
    if (nodeItem) {
        nodeItem.remove();
    }
}

// 绑定norm_type选择事件
function bindNormTypeEvent() {
    const normTypeSelect = document.getElementById('normType');
    if (normTypeSelect) {
        normTypeSelect.addEventListener('change', updateMeanValueVisibility);
    }
}

// 更新Mean Value输入框的显示状态和默认值
function updateMeanValueVisibility() {
    const normTypeSelect = document.getElementById('normType');
    const meanValueGroup = document.getElementById('meanValueGroup');
    const meanValueInput = document.getElementById('meanValue');
    const scaleValueInput = document.getElementById('scaleValue');
    
    if (normTypeSelect && meanValueGroup) {
        if (normTypeSelect.value === 'data_mean_and_scale') {
            // 分类模型配置
            meanValueGroup.style.display = 'block';
            meanValueInput.required = true;
            
            // 设置分类模型的默认值
            if (!meanValueInput.dataset.userModified) {
                meanValueInput.value = '123.675, 116.28, 103.53';
            }
            if (!scaleValueInput.dataset.userModified) {
                scaleValueInput.value = '0.01712475, 0.017507, 0.01742919';
            }
        } else {
            // YOLO模型配置
            meanValueGroup.style.display = 'none';
            meanValueInput.required = false;
            
            // 设置YOLO模型的默认值
            if (!scaleValueInput.dataset.userModified) {
                scaleValueInput.value = '0.003921568627451';
            }
        }
    }
}
