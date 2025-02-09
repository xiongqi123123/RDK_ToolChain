// 文件浏览器状态
let currentBrowserMode = ''; // 'model' 或 'caldata'

document.addEventListener('DOMContentLoaded', function() {
    // 表单提交处理
    const conversionForm = document.getElementById('conversionForm');
    conversionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 显示加载状态
        const submitBtn = conversionForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '转换中...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(conversionForm);
            
            // 打印表单数据
            console.log('提交的表单数据:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const response = await fetch('/model-conversion', {
                method: 'POST',
                body: formData
            });
            
            console.log('服务器响应状态:', response.status);
            const result = await response.json();
            console.log('服务器返回数据:', result);
            
            if (!response.ok) {
                throw new Error(`服务器返回错误: ${result.message || '未知错误'}`);
            }
            
            // 更新转换状态区域
            updateConversionStatus(result);
            
        } catch (error) {
            console.error('提交失败:', error);
            alert(`提交失败: ${error.message}`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// 转换状态管理
let conversionStatus = {
    isConverting: false
};

// 更新转换状态显示
function updateConversionStatus(data) {
    const conversionProgress = document.getElementById('conversionProgress');
    const conversionControls = document.querySelector('.conversion-controls');
    
    if (data.status === 'success') {
        // 更新转换状态
        conversionStatus.isConverting = true;
        
        // 显示转换配置和状态
        conversionProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>转换状态</span>
                    <span class="status-badge running">正在转换</span>
                </h3>
            </div>
            <div class="status-item">
                <h3>转换配置</h3>
                <pre>${JSON.stringify(data.config, null, 2)}</pre>
            </div>
            <div class="status-item">
                <h3>运行日志</h3>
                <pre class="log-output"></pre>
            </div>
        `;
        
        // 显示停止按钮
        conversionControls.style.display = 'flex';
        
        // 开始轮询转换状态
        pollConversionStatus();
    } else {
        // 显示错误信息
        conversionProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>错误</span>
                    <span class="status-badge stopped">失败</span>
                </h3>
                <p class="error-message">${data.message}</p>
                ${data.error ? `<pre class="error-details">${data.error}</pre>` : ''}
            </div>
        `;
        conversionControls.style.display = 'none';
    }
}

// 轮询转换状态
function pollConversionStatus() {
    if (!conversionStatus.isConverting) return;
    
    fetch('/api/conversion-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                // 更新状态标签
                const statusBadge = document.querySelector('.status-badge');
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在转换';
                
                // 更新日志
                updateLogOutput(data);
                
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
            setTimeout(pollConversionStatus, 1000);
        });
}

function updateLogOutput(data) {
    const logOutput = document.querySelector('.log-output');
    if (!logOutput) return;

    // 添加新的日志内容
    if (data.stdout) {
        const stdoutDiv = document.createElement('div');
        stdoutDiv.className = 'stdout';
        stdoutDiv.textContent = data.stdout;
        logOutput.appendChild(stdoutDiv);
    }
    if (data.stderr) {
        const stderrDiv = document.createElement('div');
        stderrDiv.className = 'stderr';
        stderrDiv.textContent = data.stderr;
        logOutput.appendChild(stderrDiv);
    }

    // 自动滚动到底部
    logOutput.scrollTop = logOutput.scrollHeight;
}

// 更新转换完成状态
function updateConversionComplete(data) {
    const conversionProgress = document.getElementById('conversionProgress');
    const conversionControls = document.querySelector('.conversion-controls');
    
    conversionStatus.isConverting = false;
    conversionControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge completed';
    statusBadge.textContent = '已完成';
    
    // 更新最终日志
    updateLogOutput(data);
}

// 更新转换停止状态
function updateConversionStopped(data) {
    const conversionProgress = document.getElementById('conversionProgress');
    const conversionControls = document.querySelector('.conversion-controls');
    
    conversionStatus.isConverting = false;
    conversionControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge stopped';
    statusBadge.textContent = '已停止';
    
    // 更新最终日志
    updateLogOutput(data);
}

// 停止转换
function stopConversion() {
    if (!conversionStatus.isConverting) return;
    
    if (!confirm('确定要停止转换吗？')) return;
    
    fetch('/api/stop-conversion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateConversionStopped(data);
            } else {
                alert('停止转换失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('停止转换失败:', error);
            alert('停止转换失败，请重试\n' + error.message);
        });
}

// 文件浏览器相关函数
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
    selectBtn.style.display = 'block';
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
        const requestData = {
            path: path,
            include_files: includeFiles
        };
        
        if (includeFiles) {
            requestData.file_pattern = '*.onnx';
        }
        
        console.log('发送请求参数:', requestData);
        
        const response = await fetch('/api/list-directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        console.log('服务器返回数据:', data);
        
        if (response.ok) {
            updateFileList(data);
        } else {
            console.error('服务器返回错误:', data);
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
    
    // 添加文件夹
    data.items.filter(item => item.type === 'directory').forEach(item => {
        const div = document.createElement('div');
        div.className = 'file-item folder';
        div.innerHTML = `
            <i class="fas fa-folder"></i>
            <span>${item.name}</span>
        `;
        div.onclick = () => loadDirectory(item.path, currentBrowserMode === 'model');
        fileList.appendChild(div);
    });

    // 添加文件(仅当浏览模型文件时)
    if (currentBrowserMode === 'model') {
        data.items.filter(item => item.type === 'file').forEach(item => {
            const div = document.createElement('div');
            div.className = 'file-item file';
            div.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${item.name}</span>
            `;
            div.onclick = () => selectFile(item.path);
            fileList.appendChild(div);
        });
    }
}

function selectFile(filePath) {
    document.getElementById('modelPath').value = filePath;
    closeFileBrowser();
}

function selectCurrentFolder() {
    const currentPath = document.getElementById('currentPath').textContent;
    document.getElementById('calDataDir').value = currentPath;
    closeFileBrowser();
}

function navigateUp() {
    const currentPath = document.getElementById('currentPath').textContent;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath, currentBrowserMode === 'model');
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

function addNodeInfo() {
    const container = document.getElementById('nodeInfoContainer');
    const newNode = document.createElement('div');
    newNode.className = 'node-info-item';
    newNode.innerHTML = `
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
    container.appendChild(newNode);
}

function removeNodeInfo(button) {
    button.closest('.node-info-item').remove();
}
