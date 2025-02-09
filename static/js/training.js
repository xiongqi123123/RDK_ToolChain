// 模型配置数据
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
                value: "yolov10", 
                label: "YOLOv10",
                tags: [
                    {
                        value: "detect",
                        label: "YOLOv10-Detect",
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
                        label: "YOLOv10-Pose",
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
    tagSelect.innerHTML = '<option value="">请先选择模型版本</option>';
    
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
    tagSelect.onchange = function() {
        const kptShapeGroup = document.getElementById('kptShapeGroup');
        if (this.value === 'pose') {
            kptShapeGroup.style.display = 'block';
        } else {
            kptShapeGroup.style.display = 'none';
        }
        updateSizeOptions(modelSeries, selectedVersion, this.value);
    };
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

// 设备检测
async function detectDevice() {
    try {
        const response = await fetch('/detect-device');
        const data = await response.json();
        
        const deviceSelect = document.getElementById('device');
        deviceSelect.value = data.default_device;
        
        // 如果没有GPU，禁用GPU选项
        if (!data.gpu_available) {
            const gpuOption = deviceSelect.querySelector('option[value="gpu"]');
            gpuOption.disabled = true;
            gpuOption.text = 'GPU (未检测到可用设备)';
        }
    } catch (error) {
        console.error('设备检测失败:', error);
    }
}

// 文件选择处理
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

    // 浏览按钮点击事件 - 直接打开我们的自定义文件浏览器
    const browseBtn = document.querySelector('.browse-btn');
    browseBtn.addEventListener('click', () => {
        // 直接打开我们的自定义文件浏览器
        openFileBrowser();
    });

    // 表单提交处理
    const trainingForm = document.getElementById('trainingForm');
    trainingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 显示加载状态
        const submitBtn = trainingForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '配置中...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(trainingForm);
            const response = await fetch(trainingForm.action, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            // 更新训练状态区域
            updateTrainingStatus(result);
            
        } catch (error) {
            console.error('提交失败:', error);
            alert('提交失败，请重试');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // 初始设备检测
    detectDevice();
});

// 训练状态管理
let trainingStatus = {
    isTraining: false,
    currentEpoch: 0,
    totalEpochs: 0
};

// 更新训练状态显示
function updateTrainingStatus(data) {
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    if (data.status === 'success') {
        // 更新训练状态
        trainingStatus.isTraining = true;
        trainingStatus.totalEpochs = data.config.epochs;
        
        // 显示训练配置和状态
        trainingProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>训练状态</span>
                    <span class="status-badge running">正在运行</span>
                </h3>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%">0%</div>
                </div>
                <p>当前轮次: 1/${data.config.epochs}</p>
            </div>
            <div class="status-item">
                <h3>训练配置</h3>
                <pre>${JSON.stringify(data.config, null, 2)}</pre>
            </div>
            <div class="status-item">
                <h3>运行日志</h3>
                <pre class="log-output"></pre>
            </div>
        `;
        
        // 显示停止按钮
        trainingControls.style.display = 'flex';
        
        // 开始轮询训练状态
        pollTrainingStatus();
    } else {
        // 显示错误信息
        trainingProgress.innerHTML = `
            <div class="status-item">
                <h3>
                    <span>错误</span>
                    <span class="status-badge stopped">失败</span>
                </h3>
                <p class="error-message">${data.message}</p>
                ${data.error ? `<pre class="error-details">${data.error}</pre>` : ''}
            </div>
        `;
        trainingControls.style.display = 'none';
    }
}

// 轮询训练状态
function pollTrainingStatus() {
    if (!trainingStatus.isTraining) return;
    
    fetch('/api/training-status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('收到训练状态数据:', data);  // 调试日志
            
            // 更新训练状态
            if (data.status === 'running') {
                // 更新状态标签
                const statusBadge = document.querySelector('.status-badge');
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在运行';
                
                // 更新进度条和轮次
                const progressBar = document.querySelector('.progress-bar');
                const currentEpoch = document.querySelector('.status-item p');
                console.log('当前epoch:', data.current_epoch);  // 调试日志
                console.log('总epoch:', trainingStatus.totalEpochs);  // 调试日志
                
                if (data.current_epoch !== undefined && trainingStatus.totalEpochs) {
                    if (data.modelSeries == 'yolov5')
                        data.current_epoch = data.current_epoch + 1
                    const progress = ((data.current_epoch) / trainingStatus.totalEpochs) * 100;
                    console.log('计算的进度:', progress);  // 调试日志
                    
                    progressBar.style.transition = 'width 0.5s ease-in-out';
                    progressBar.style.width = `${progress}%`;
                    progressBar.textContent = `${progress.toFixed(1)}%`;
                    currentEpoch.textContent = `当前轮次: ${data.current_epoch}/${trainingStatus.totalEpochs}`;
                }
                
                // 更新日志
                const logOutput = document.querySelector('.log-output');
                if (data.stdout) {
                    const lines = data.stdout.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            const stdoutDiv = document.createElement('div');
                            stdoutDiv.className = 'stdout';
                            stdoutDiv.textContent = line;
                            logOutput.appendChild(stdoutDiv);
                        }
                    });
                }
                if (data.stderr) {
                    const lines = data.stderr.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            const stderrDiv = document.createElement('div');
                            stderrDiv.className = 'stderr';
                            stderrDiv.textContent = line;
                            logOutput.appendChild(stderrDiv);
                        }
                    });
                }
                
                // 自动滚动到底部
                logOutput.scrollTop = logOutput.scrollHeight;
                
                // 继续轮询
                setTimeout(pollTrainingStatus, 1000);
            } else if (data.status === 'completed') {
                updateTrainingComplete(data);
            } else if (data.status === 'stopped') {
                updateTrainingStopped(data);
            }
        })
        .catch(error => {
            console.error('获取训练状态失败:', error);
            // 如果是404错误，说明后端API还没准备好，等待更长时间
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollTrainingStatus, retryTime);
        });
}

// 更新训练完成状态
function updateTrainingComplete(data) {
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    trainingStatus.isTraining = false;
    trainingControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge completed';
    statusBadge.textContent = '已完成';
}

// 更新训练停止状态
function updateTrainingStopped(data) {
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    trainingStatus.isTraining = false;
    trainingControls.style.display = 'none';
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = 'status-badge stopped';
    statusBadge.textContent = '已停止';
}

// 停止训练
function stopTraining() {
    if (!trainingStatus.isTraining) return;
    
    if (!confirm('确定要停止训练吗？')) return;
    
    fetch('/api/stop-training', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                updateTrainingStopped(data);
            } else {
                alert('停止训练失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('停止训练失败:', error);
            alert('停止训练失败，请重试\n' + error.message);
        });
}

// 文件浏览器相关变量
let currentPath = '/';
const modal = document.getElementById('fileBrowserModal');

// 打开文件浏览器
function openFileBrowser() {
    modal.style.display = 'block';
    loadDirectory(currentPath);
}

// 关闭文件浏览器
function closeFileBrowser() {
    modal.style.display = 'none';
}

// 加载目录内容
async function loadDirectory(path) {
    try {
        const response = await fetch('/api/list-directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: path })
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

// 更新文件列表显示
function updateFileList(data) {
    const fileList = document.getElementById('fileList');
    const currentPathElement = document.getElementById('currentPath');
    
    currentPathElement.textContent = data.current_path;
    fileList.innerHTML = '';
    
    // 添加文件夹项
    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'file-item folder';
        div.innerHTML = `
            <i class="fas fa-folder"></i>
            <span>${item.name}</span>
        `;
        div.onclick = () => loadDirectory(item.path);
        fileList.appendChild(div);
    });
}

// 导航到上级目录
function navigateUp() {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
}

// 选择当前文件夹
function selectCurrentFolder() {
    document.getElementById('datasetPath').value = currentPath;
    closeFileBrowser();
}

// 关闭模态框的点击事件
window.onclick = function(event) {
    if (event.target == modal) {
        closeFileBrowser();
    }
}

// 为关闭按钮添加事件监听
document.querySelector('.close').onclick = closeFileBrowser; 