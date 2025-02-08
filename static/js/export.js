const modelConfigs = {
    yolo: {
        versions: [
            { 
                value: "yolov5", 
                label: "YOLOv5",
                tags: [
                    { 
                        value: "v2.0", 
                        label: "Yolov5-V2.0",
                        sizes: [
                            { value: "s", label: "s" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    },
                    { 
                        value: "v7.0", 
                        label: "Yolov5-V7.0",
                        sizes: [
                            { value: "s", label: "s" },
                            { value: "n", label: "n" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    }
                ]
            },
            { 
                value: "yolov8", 
                label: "YOLOv8",
                tags: [
                    {
                        value: "detect",
                        label: "YOLOv8-Detect",
                        sizes: [
                            { value: "n", label: "n" },
                            { value: "s", label: "s" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    },
                    {
                        value: "pose",
                        label: "YOLOv8-Pose",
                        sizes: [
                            { value: "n", label: "n" },
                            { value: "s", label: "s" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    },
                    {
                        value: "seg",
                        label: "YOLOv8-Seg",
                        sizes: [
                            { value: "n", label: "n" },
                            { value: "s", label: "s" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    }
                ]
            },
            { 
                value: "yolo11", 
                label: "YOLO11",
                tags: [
                    {
                        value: "detect",
                        label: "YOLO11-Detect",
                        sizes: [
                            { value: "n", label: "n" },
                            { value: "s", label: "s" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    },
                    {
                        value: "pose",
                        label: "YOLO11-Pose",
                        sizes: [
                            { value: "n", label: "n" },
                            { value: "s", label: "s" },
                            { value: "m", label: "m" },
                            { value: "l", label: "l" },
                            { value: "x", label: "x" }
                        ]
                    }
                ]
            }
        ]
    }
};
// 更新版本选项
function updateVersionOptions(modelSeries) {
    const versionSelect = document.getElementById('modelVersion');
    const versions = modelConfigs[modelSeries]?.versions || [];
    
    versionSelect.innerHTML = '<option value="">请选择版本</option>';
    versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version.value;
        option.textContent = version.label;
        versionSelect.appendChild(option);
    });
}

// 更新Tag选项
function updateTagOptions(modelSeries, selectedVersion) {
    const tagSelect = document.getElementById('modelTag');
    
    // 根据选中的version找到对应的配置
    const versionConfig = modelConfigs[modelSeries]?.versions.find(v => v.value === selectedVersion);
    const tags = versionConfig?.tags || [];
    
    tagSelect.innerHTML = '<option value="">请选择模型Tag</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.value;
        option.textContent = tag.label;
        tagSelect.appendChild(option);
    });
    
    // 重置size选择
    document.getElementById('modelSize').innerHTML = '<option value="">请选择大小</option>';
}

// 更新大小选项
function updateSizeOptions(modelSeries, selectedVersion, selectedTag) {
    const sizeSelect = document.getElementById('modelSize');
    
    // 根据选中的version和tag找到对应的配置
    const versionConfig = modelConfigs[modelSeries]?.versions.find(v => v.value === selectedVersion);
    const tagConfig = versionConfig?.tags.find(t => t.value === selectedTag);
    const sizes = tagConfig?.sizes || [];
    
    sizeSelect.innerHTML = '<option value="">请选择大小</option>';
    sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.value;
        option.textContent = size.label;
        sizeSelect.appendChild(option);
    });
}

// 文件选择处理
// 在DOMContentLoaded事件中更新事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 模型系列选择事件
    const modelSeriesSelect = document.getElementById('modelSeries');
    modelSeriesSelect.addEventListener('change', (e) => {
        const selectedSeries = e.target.value;
        updateVersionOptions(selectedSeries);
        
        // 重置version、tag和size选择
        document.getElementById('modelVersion').value = '';
        document.getElementById('modelTag').value = '';
        document.getElementById('modelSize').value = '';
    });
    // 版本选择事件
    document.getElementById('modelVersion').addEventListener('change', function() {
        const modelSeries = document.getElementById('modelSeries').value;
        updateTagOptions(modelSeries, this.value);
    });

    // Tag选择事件
    document.getElementById('modelTag').addEventListener('change', function() {
        const modelSeries = document.getElementById('modelSeries').value;
        const selectedVersion = document.getElementById('modelVersion').value;
        updateSizeOptions(modelSeries, selectedVersion, this.value);
    });

    // 表单提交处理
    const exportForm = document.getElementById('exportForm');
    exportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 显示加载状态
        const submitBtn = exportForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '导出中...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(exportForm);
            
            // 打印表单数据
            console.log('提交的表单数据:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const response = await fetch('/model-export', {
                method: 'POST',
                body: formData
            });
            
            console.log('服务器响应状态:', response.status);
            const result = await response.json();
            console.log('服务器返回数据:', result);
            
            if (!response.ok) {
                throw new Error(`服务器返回错误: ${result.message || '未知错误'}`);
            }
            
            // 更新导出状态区域
            updateExportStatus(result);
            
        } catch (error) {
            console.error('提交失败:', error);
            alert(`提交失败: ${error.message}`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// 导出状态管理
let exportStatus = {
    isExporting: false,
    progress: 0
};

// 更新导出状态显示
function updateExportStatus(data) {
    const exportProgress = document.getElementById('exportProgress');
    const exportControls = document.querySelector('.export-controls');
    
    if (data.status === 'success') {
        // 更新导出状态
        exportStatus.isExporting = true;
        
        // 显示导出配置和状态
        exportProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>导出状态</span>
                    <span class="status-badge running">正在导出</span>
                </h3>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%">0%</div>
                </div>
            </div>
            <div class="status-item">
                <h3>导出配置</h3>
                <pre>${JSON.stringify(data.config, null, 2)}</pre>
            </div>
            <div class="status-item">
                <h3>运行日志</h3>
                <pre class="log-output"></pre>
            </div>
        `;
        
        // 显示停止按钮
        exportControls.style.display = 'flex';
        
        // 开始轮询导出状态
        pollExportStatus();
    } else {
        // 显示错误信息
        exportProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>错误</span>
                    <span class="status-badge stopped">失败</span>
                </h3>
                <p class="error-message">${data.message}</p>
                ${data.error ? `<pre class="error-details">${data.error}</pre>` : ''}
            </div>
        `;
        exportControls.style.display = 'none';
    }
}

// 轮询导出状态
function pollExportStatus() {
    if (!exportStatus.isExporting) return;
    
    fetch('/api/export-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                // 更新状态标签
                const statusBadge = document.querySelector('.status-badge');
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在导出';
                
                // 更新进度条
                const progressBar = document.querySelector('.progress-bar');
                if (data.progress !== undefined) {
                    progressBar.style.width = `${data.progress}%`;
                    progressBar.textContent = `${data.progress.toFixed(1)}%`;
                }
                
                // 更新日志
                const logOutput = document.querySelector('.log-output');
                if (data.stdout || data.stderr) {
                    // 清空之前的日志内容
                    logOutput.innerHTML = '';
                    
                    // 添加标准输出
                    if (data.stdout) {
                        const stdoutDiv = document.createElement('div');
                        stdoutDiv.className = 'stdout';
                        stdoutDiv.textContent = data.stdout;
                        logOutput.appendChild(stdoutDiv);
                    }
                    
                    // 添加标准错误
                    if (data.stderr) {
                        const stderrDiv = document.createElement('div');
                        stderrDiv.className = 'stderr';
                        stderrDiv.textContent = data.stderr;
                        logOutput.appendChild(stderrDiv);
                    }
                    
                    // 自动滚动到底部
                    logOutput.scrollTop = logOutput.scrollHeight;
                }
                
                // 继续轮询
                setTimeout(pollExportStatus, 1000);
            } else if (data.status === 'completed') {
                updateExportComplete(data);
            } else if (data.status === 'stopped') {
                updateExportStopped(data);
            }
        })
        .catch(error => {
            console.error('获取导出状态失败:', error);
            setTimeout(pollExportStatus, 1000);
        });
}

// 更新导出完成状态
function updateExportComplete(data) {
    const exportProgress = document.getElementById('exportProgress');
    const exportControls = document.querySelector('.export-controls');
    
    exportStatus.isExporting = false;
    exportControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge completed';
    statusBadge.textContent = '已完成';
}

// 更新导出停止状态
function updateExportStopped(data) {
    const exportProgress = document.getElementById('exportProgress');
    const exportControls = document.querySelector('.export-controls');
    
    exportStatus.isExporting = false;
    exportControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge stopped';
    statusBadge.textContent = '已停止';
}

// 停止导出
function stopExport() {
    if (!exportStatus.isExporting) return;
    
    if (!confirm('确定要停止导出吗？')) return;
    
    fetch('/api/stop-export', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateExportStopped(data);
            } else {
                alert('停止导出失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('停止导出失败:', error);
            alert('停止导出失败，请重试\n' + error.message);
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
            file_pattern: '*.pt,*.pth,*.weights,*.onnx'
        });
        
        const response = await fetch('/api/list-directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: path,
                include_files: true,
                file_pattern: '*.pt,*.pth,*.weights,*.onnx'
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

// 为关闭按钮添加事件监听
document.querySelector('.close').onclick = closeFileBrowser;

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('fileBrowserModal');
    if (event.target == modal) {
        closeFileBrowser();
    }
};

function navigateUp() {
    const currentPath = document.getElementById('currentPath').textContent;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
}
// 在HTML中需要修改tag选择的事件处理
document.getElementById('modelTag').addEventListener('change', function() {
    const modelSeries = document.getElementById('modelSeries').value; // 假设有一个modelSeries的选择框
    updateSizeOptions(modelSeries, this.value);
});
