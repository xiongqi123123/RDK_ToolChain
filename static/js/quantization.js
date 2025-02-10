// 文件选择处理
document.addEventListener('DOMContentLoaded', function() {
    // 表单提交处理
    const quantizationForm = document.getElementById('quantizationForm');
    quantizationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 显示加载状态
        const submitBtn = quantizationForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '检查中...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(quantizationForm);
            
            // 打印表单数据
            console.log('提交的表单数据:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const response = await fetch('/model-quantization', {
                method: 'POST',
                body: formData
            });
            
            console.log('服务器响应状态:', response.status);
            const result = await response.json();
            console.log('服务器返回数据:', result);
            
            if (!response.ok) {
                throw new Error(`服务器返回错误: ${result.message || '未知错误'}`);
            }
            
            // 更新检查状态区域
            updateCheckerStatus(result);
            
        } catch (error) {
            console.error('提交失败:', error);
            alert(`提交失败: ${error.message}`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// 检查状态管理
let checkerStatus = {
    isChecking: false
};

// 更新检查状态显示
function updateCheckerStatus(data) {
    const checkerProgress = document.getElementById('checkerProgress');
    const checkerControls = document.querySelector('.checker-controls');
    
    if (data.status === 'success') {
        // 更新检查状态
        checkerStatus.isChecking = true;
        
        // 显示检查配置和状态
        checkerProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>检查状态</span>
                    <span class="status-badge running">正在检查</span>
                </h3>
            </div>
            <div class="status-item">
                <h3>检查配置</h3>
                <pre>${JSON.stringify(data.config, null, 2)}</pre>
            </div>
            <div class="status-item">
                <h3>运行日志</h3>
                <pre class="log-output"></pre>
            </div>
        `;
        
        // 显示停止按钮
        checkerControls.style.display = 'flex';
        
        // 开始轮询检查状态
        pollCheckerStatus();
    } else {
        // 显示错误信息
        checkerProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>错误</span>
                    <span class="status-badge stopped">失败</span>
                </h3>
                <p class="error-message">${data.message}</p>
                ${data.error ? `<pre class="error-details">${data.error}</pre>` : ''}
            </div>
        `;
        checkerControls.style.display = 'none';
    }
}

// 轮询检查状态
function pollCheckerStatus() {
    if (!checkerStatus.isChecking) return;
    
    fetch('/api/checker-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                const statusBadge = document.querySelector('.status-badge');
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在检查';
                updateLogOutput(data);
                setTimeout(pollCheckerStatus, 1000);
            } else if (data.status === 'completed') {
                updateCheckerComplete(data);
            } else if (data.status === 'stopped') {
                updateCheckerStopped(data);
            }
        })
        .catch(error => {
            console.error('获取检查状态失败:', error);
            setTimeout(pollCheckerStatus, 1000);
        });
}

function updateLogOutput(data) {
    const logOutput = document.getElementById('log-output');
    logOutput.innerHTML = '';
    if (data.stderr) {
        const lines = data.stderr.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                const logLine = document.createElement('div');
                
                if (line.includes('='.repeat(20))) {
                    logLine.className = 'log-separator';
                    line = line.replace(/={20,}/g, '='.repeat(20)); // 移除多余的等号,只保留必要的分隔线
                } else if (line.includes('-'.repeat(10))) {
                    logLine.className = 'log-subseparator';
                    line = line.replace(/-{10,}/g, '-'.repeat(10)); // 移除多余的横线,只保留必要的分隔线
                } else if (line.includes('INFO:')) {
                    logLine.className = 'log-info';
                } else if (line.trim().startsWith('Node')) {
                    logLine.className = 'log-node';
                    line = line.replace(/\s+/g, ' '); // 压缩Node信息行中的空格
                } else {
                    logLine.className = 'log-normal';
                }
                
                logLine.textContent = line;
                logOutput.appendChild(logLine);
            }
        });
    }

    if (data.stdout) {
        const lines = data.stdout.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                const logLine = document.createElement('div');
                logLine.className = 'stdout';
                logLine.textContent = line;
                logOutput.appendChild(logLine);
            }
        });
    }

    // 自动滚动到底部
    logOutput.scrollTop = logOutput.scrollHeight;
}

// 更新检查完成状态
function updateCheckerComplete(data) {
    const checkerProgress = document.getElementById('checkerProgress');
    const checkerControls = document.querySelector('.checker-controls');
    
    checkerStatus.isChecking = false;
    checkerControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge completed';
    statusBadge.textContent = '已完成';
    
    // 显示最终日志
    const logOutput = document.querySelector('.log-output');
    if (logOutput) {
        logOutput.innerHTML = '';

        if (data.stderr) {
            const lines = data.stderr.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    const logLine = document.createElement('div');
                    if (line.includes('===')) {
                        logLine.className = 'log-separator';
                    } else if (line.includes('---')) {
                        logLine.className = 'log-subseparator';
                    } else if (line.includes('INFO')) {
                        logLine.className = 'log-info';
                    } else if (line.includes('BPU')) {
                        logLine.className = 'log-node';
                    } else {
                        logLine.className = 'log-normal';
                    }
                    logLine.textContent = line;
                    logOutput.appendChild(logLine);
                }
            });
        }
        
        if (data.stdout) {
            const lines = data.stdout.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    const logLine = document.createElement('div');
                    logLine.className = 'stdout';
                    logLine.textContent = line;
                    logOutput.appendChild(logLine);
                }
            });
        }
    }
}

// 更新检查停止状态
function updateCheckerStopped(data) {
    const checkerProgress = document.getElementById('checkerProgress');
    const checkerControls = document.querySelector('.checker-controls');
    
    checkerStatus.isChecking = false;
    checkerControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge stopped';
    statusBadge.textContent = '已停止';
}

// 停止检查
function stopChecker() {
    if (!checkerStatus.isChecking) return;
    
    if (!confirm('确定要停止检查吗？')) return;
    
    fetch('/api/stop-checker', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateCheckerStopped(data);
            } else {
                alert('停止检查失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('停止检查失败:', error);
            alert('停止检查失败，请重试\n' + error.message);
        });
}

function openFileBrowser() {
    const modal = document.getElementById('fileBrowserModal');
    modal.style.display = 'block';
    loadDirectory('/');
}

function closeFileBrowser() {
    const modal = document.getElementById('fileBrowserModal');
    modal.style.display = 'none';
}

async function loadDirectory(path) {
    try {
        console.log('发送请求参数:', {
            path: path,
            include_files: true,
            file_pattern: '*.onnx'
        });
        
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
        div.onclick = () => loadDirectory(item.path);
        fileList.appendChild(div);
    });

    // 添加文件
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

function selectFile(filePath) {
    document.getElementById('modelPath').value = filePath;
    closeFileBrowser();
}

function navigateUp() {
    const currentPath = document.getElementById('currentPath').textContent;
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
