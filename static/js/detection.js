// 文件浏览器状态
let currentBrowserMode = 'model';

document.addEventListener('DOMContentLoaded', function() {
    // 表单提交处理
    const detectionForm = document.getElementById('detectionForm');
    detectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 显示加载状态
        const submitBtn = detectionForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '检测中...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(detectionForm);
            
            // 打印表单数据
            console.log('提交的表单数据:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const response = await fetch('/model-detection', {
                method: 'POST',
                body: formData
            });
            
            console.log('服务器响应状态:', response.status);
            const result = await response.json();
            console.log('服务器返回数据:', result);
            
            if (!response.ok) {
                throw new Error(`服务器返回错误: ${result.message || '未知错误'}`);
            }
            
            // 更新检测状态区域
            updateDetectionStatus(result);
            
        } catch (error) {
            console.error('提交失败:', error);
            alert(`提交失败: ${error.message}`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// 检测状态管理
let detectionStatus = {
    isDetecting: false
};

// 更新检测状态显示
function updateDetectionStatus(data) {
    const detectionProgress = document.getElementById('detectionProgress');
    const detectionControls = document.querySelector('.detection-controls');
    const perfImage = document.getElementById('perfImage');
    
    if (data.status === 'success') {
        // 更新检测状态
        detectionStatus.isDetecting = true;
        
        // 显示检测配置和状态
        detectionProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>检测状态</span>
                    <span class="status-badge running">正在检测</span>
                </h3>
            </div>
            <div class="status-item">
                <h3>检测配置</h3>
                <pre>${JSON.stringify(data.config, null, 2)}</pre>
            </div>
            <div class="status-item">
                <h3>运行日志</h3>
                <pre class="log-output"></pre>
            </div>
        `;
        
        // 显示停止按钮
        detectionControls.style.display = 'flex';
        
        // 隐藏性能分析图
        perfImage.style.display = 'none';
        
        // 开始轮询检测状态
        pollDetectionStatus();
    } else {
        // 显示错误信息
        detectionProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>错误</span>
                    <span class="status-badge stopped">失败</span>
                </h3>
                <p class="error-message">${data.message}</p>
                ${data.error ? `<pre class="error-details">${data.error}</pre>` : ''}
            </div>
        `;
        detectionControls.style.display = 'none';
        perfImage.style.display = 'none';
    }
}

// 轮询检测状态
function pollDetectionStatus() {
    if (!detectionStatus.isDetecting) return;
    
    fetch('/api/detection-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                // 更新状态标签
                const statusBadge = document.querySelector('.status-badge');
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在检测';
                
                // 更新日志
                updateLogOutput(data);
                
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
            setTimeout(pollDetectionStatus, 1000);
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

// 更新检测完成状态
function updateDetectionComplete(data) {
    // 更新状态显示
    const progressDiv = document.getElementById('detectionProgress');
    progressDiv.innerHTML = `
        <div class="status-item">
            <h3>检测状态 <span class="status-badge completed">已完成</span></h3>
        </div>
    `;
    
    // 显示模型可视化图片
    if (data.perf_image) {
        const visualDiv = document.getElementById('perfImage');
        if (visualDiv) {
            visualDiv.style.display = 'block';
            const imgDisplay = document.getElementById('perfImageDisplay');
            if (imgDisplay) {
                imgDisplay.src = `/perf_image/${data.perf_image}`;
                imgDisplay.style.display = 'block';
            }
        }
    }
    
    // 显示输出日志
    if (data.stdout || data.stderr) {
        const logOutput = document.createElement('div');
        logOutput.className = 'log-output';
        
        if (data.stdout) {
            logOutput.innerHTML += `
                <div class="log-separator">标准输出</div>
                <pre class="stdout">${data.stdout}</pre>
            `;
        }
        
        if (data.stderr) {
            logOutput.innerHTML += `
                <div class="log-separator">标准错误</div>
                <pre class="stderr">${data.stderr}</pre>
            `;
        }
        
        progressDiv.appendChild(logOutput);
    }
    
    // 隐藏停止按钮
    const controlsDiv = document.querySelector('.detection-controls');
    if (controlsDiv) {
        controlsDiv.style.display = 'none';
    }
}

// 更新检测停止状态
function updateDetectionStopped(data) {
    const detectionProgress = document.getElementById('detectionProgress');
    const detectionControls = document.querySelector('.detection-controls');
    const perfImage = document.getElementById('perfImage');
    
    detectionStatus.isDetecting = false;
    detectionControls.style.display = 'none';
    perfImage.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge stopped';
    statusBadge.textContent = '已停止';
    
    // 更新最终日志
    updateLogOutput(data);
}

// 停止检测
function stopDetection() {
    if (!detectionStatus.isDetecting) return;
    
    if (!confirm('确定要停止检测吗？')) return;
    
    fetch('/api/stop-detection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateDetectionStopped(data);
            } else {
                alert('停止检测失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('停止检测失败:', error);
            alert('停止检测失败，请重试\n' + error.message);
        });
}

// 文件浏览器相关函数
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
            file_pattern: '*.bin'
        });
        
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