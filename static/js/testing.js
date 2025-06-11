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
                    },
                    { 
                        value: "v7.0", 
                        label: "Yolov5-V7.0",
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
                    },
                    {
                        value: "pose",
                        label: "YOLOv8-Pose",
                    },
                    {
                        value: "seg",
                        label: "YOLOv8-Seg",
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
                    },
                    {
                        value: "pose",
                        label: "YOLO11-Pose",
                    }
                ]
            }
        ]
    }
};

// 更新版本选项
function updateVersionOptions(modelSeries) {
    console.log('更新版本选项，模型系列:', modelSeries);
    const versionSelect = document.getElementById('modelVersion');
    if (!versionSelect) {
        console.error('未找到模型版本选择框');
        return;
    }
    
    const versions = modelConfigs[modelSeries]?.versions || [];
    console.log('找到版本选项:', versions);
    
    versionSelect.innerHTML = '<option value="">请选择版本</option>';
    versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version.value;
        option.textContent = version.label;
        versionSelect.appendChild(option);
    });
    console.log('版本选项已更新');
}

// 更新Tag选项
function updateTagOptions(modelSeries, selectedVersion) {
    console.log('更新Tag选项，模型系列:', modelSeries, '选择的版本:', selectedVersion);
    const tagSelect = document.getElementById('modelTag');
    if (!tagSelect) {
        console.error('未找到模型Tag选择框');
        return;
    }
    
    tagSelect.innerHTML = '<option value="">请先选择模型版本</option>';
    
    // 根据选中的version找到对应的配置
    const versionConfig = modelConfigs[modelSeries]?.versions.find(v => v.value === selectedVersion);
    console.log('找到版本配置:', versionConfig);
    
    const tags = versionConfig?.tags || [];
    console.log('找到Tag选项:', tags);
    
    tagSelect.innerHTML = '<option value="">请选择模型Tag</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.value;
        option.textContent = tag.label;
        tagSelect.appendChild(option);
    });
    console.log('Tag选项已更新');
    
    tagSelect.onchange = function() {
        const kptShapeGroup = document.getElementById('kptShapeGroup');
        if (kptShapeGroup && this.value === 'pose') {
            kptShapeGroup.style.display = 'block';
        } else if (kptShapeGroup) {
            kptShapeGroup.style.display = 'none';
        }
    };
}

// 全局变量
let currentBrowserTarget = null;
let currentPath = '/';
let socket = null;

// 测试状态管理
let testingStatus = {
    isTesting: false,
    status: 'stopped',
    config: null,
    logs: [],
    
    update: function(data) {
        Object.assign(this, data);
        this.save();
    },
    
    save: function() {
        localStorage.setItem('testing_status', JSON.stringify({
            isTesting: this.isTesting,
            status: this.status,
            config: this.config,
            logs: this.logs
        }));
    },
    
    load: function() {
        const saved = localStorage.getItem('testing_status');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
        }
    },
    
    clear: function() {
        this.isTesting = false;
        this.status = 'stopped';
        this.config = null;
        this.logs = [];
        localStorage.removeItem('testing_status');
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化测试页面');
    console.log('模型配置数据:', modelConfigs);
    
    // 加载本地状态
    testingStatus.load();
    
    // 初始化各个组件
    initializeModelSelectors();
    initializeWebSocket();
    initializeFileBrowser();
    initializeForm();
    
    // 绑定表单事件
    bindFormEvents();
    
    // 检查并恢复测试状态
    checkAndRestoreTestingState();
});

// 初始化模型选择器
function initializeModelSelectors() {
    console.log('初始化模型选择器');
    
    // 模型系列选择事件
    const modelSeriesSelect = document.getElementById('modelSeries');
    if (modelSeriesSelect) {
        console.log('找到模型系列选择框');
        modelSeriesSelect.addEventListener('change', function() {
            const selectedSeries = this.value;
            console.log('选择的模型系列:', selectedSeries);
            
            if (selectedSeries) {
                updateVersionOptions(selectedSeries);
            }
            
            // 重置version和tag选择
            const versionSelect = document.getElementById('modelVersion');
            const tagSelect = document.getElementById('modelTag');
            
            if (versionSelect) {
                versionSelect.value = '';
                if (!selectedSeries) {
                    versionSelect.innerHTML = '<option value="">请先选择模型系列</option>';
                }
            }
            
            if (tagSelect) {
                tagSelect.value = '';
                tagSelect.innerHTML = '<option value="">请先选择模型版本</option>';
            }
        });
    } else {
        console.error('未找到模型系列选择框');
    }

    // 版本选择事件
    const modelVersionSelect = document.getElementById('modelVersion');
    if (modelVersionSelect) {
        console.log('找到模型版本选择框');
        modelVersionSelect.addEventListener('change', function() {
            const modelSeries = document.getElementById('modelSeries').value;
            console.log('选择的模型版本:', this.value);
            if (modelSeries && this.value) {
                updateTagOptions(modelSeries, this.value);
            }
            
            // 重置Tag选择
            const tagSelect = document.getElementById('modelTag');
            if (tagSelect && !this.value) {
                tagSelect.innerHTML = '<option value="">请先选择模型版本</option>';
            }
        });
    } else {
        console.error('未找到模型版本选择框');
    }
}

function initializeWebSocket() {
    // Socket.IO 已被轮询方式替代，此函数保留为空
    console.log('WebSocket 初始化跳过，使用轮询方式');
}

function initializeFileBrowser() {
    const modal = document.getElementById('fileBrowserModal');
    const closeBtn = modal.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.onclick = closeFileBrowser;
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            closeFileBrowser();
        }
    };
}

// 初始化表单提交
function initializeForm() {
    const form = document.getElementById('testingForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        startTesting();
    };
}

function openModelBrowser() {
    currentBrowserTarget = 'model';
    document.getElementById('browserTitle').textContent = '选择模型文件';
    openFileBrowser();
}

// 打开图片文件浏览器
function openImageBrowser() {
    currentBrowserTarget = 'image';
    document.getElementById('browserTitle').textContent = '选择测试图片';
    openFileBrowser();
}

// 打开文件浏览器
function openFileBrowser() {
    document.getElementById('fileBrowserModal').style.display = 'block';
    document.getElementById('currentPath').textContent = currentPath;
    
    // 添加文件类型过滤提示
    addFileFilterTip();
    
    loadFileList(currentPath);
}

// 添加文件类型过滤提示
function addFileFilterTip() {
    // 移除现有的提示（如果存在）
    const existingTip = document.getElementById('fileFilterTip');
    if (existingTip) {
        existingTip.remove();
    }
    
    // 创建新的提示
    const tip = document.createElement('div');
    tip.id = 'fileFilterTip';
    tip.style.cssText = `
        background-color: #e7f3ff;
        border: 1px solid #b3d7ff;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 15px;
        font-size: 13px;
        color: #0056b3;
    `;
    
    let tipText = '';
    if (currentBrowserTarget === 'model') {
        tipText = '📁 仅显示 .onnx 格式的模型文件和文件夹';
    } else if (currentBrowserTarget === 'image') {
        tipText = '🖼️ 仅显示 .jpg/.png 格式的图片文件和文件夹';
    } else {
        tipText = '📂 显示所有文件和文件夹';
    }
    
    tip.textContent = tipText;
    
    // 插入到文件列表之前
    const fileList = document.getElementById('fileList');
    fileList.parentNode.insertBefore(tip, fileList);
}

// 关闭文件浏览器
function closeFileBrowser() {
    document.getElementById('fileBrowserModal').style.display = 'none';
}

// 导航到上级目录
function navigateUp() {
    if (currentPath === '/') return;
    
    const parts = currentPath.split('/');
    parts.pop();
    currentPath = parts.join('/') || '/';
    
    document.getElementById('currentPath').textContent = currentPath;
    addFileFilterTip(); // 更新提示
    loadFileList(currentPath);
}

// 加载文件列表
function loadFileList(path) {
    fetch(`/browse?path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = '';
            
            // 过滤文件
            const filteredData = data.filter(item => {
                // 总是显示目录
                if (item.type === 'directory') {
                    return true;
                }
                
                // 根据当前浏览器目标过滤文件
                if (currentBrowserTarget === 'model') {
                    return item.name.toLowerCase().endsWith('.onnx');
                } else if (currentBrowserTarget === 'image') {
                    return item.name.match(/\.(jpg|jpeg|png)$/i);
                }
                
                // 默认显示所有文件
                return true;
            });
            
            // 如果没有匹配的文件，显示提示
            if (filteredData.length === 0) {
                const noFiles = document.createElement('div');
                noFiles.className = 'no-files-message';
                noFiles.style.cssText = `
                    text-align: center;
                    color: #6c757d;
                    font-style: italic;
                    padding: 40px 20px;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    margin: 20px 0;
                `;
                
                if (currentBrowserTarget === 'model') {
                    noFiles.textContent = '当前目录下没有找到 .onnx 模型文件';
                } else if (currentBrowserTarget === 'image') {
                    noFiles.textContent = '当前目录下没有找到 .jpg/.png 图片文件';
                } else {
                    noFiles.textContent = '当前目录为空';
                }
                
                fileList.appendChild(noFiles);
                return;
            }
            
            filteredData.forEach(item => {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 10px 15px;
                    border-bottom: 1px solid #dee2e6;
                    cursor: pointer;
                    transition: background-color 0.2s;
                `;
                
                // 悬停效果
                div.onmouseenter = () => {
                    div.style.backgroundColor = '#f8f9fa';
                };
                div.onmouseleave = () => {
                    div.style.backgroundColor = '';
                };
                
                const icon = document.createElement('i');
                icon.className = item.type === 'directory' ? 'fas fa-folder' : 'fas fa-file';
                icon.style.cssText = `
                    margin-right: 10px;
                    color: ${item.type === 'directory' ? '#ffc107' : '#6c757d'};
                    width: 16px;
                `;
                
                const name = document.createElement('span');
                name.textContent = item.name;
                name.style.cssText = `
                    flex: 1;
                    word-break: break-all;
                `;
                
                // 为支持的文件类型添加标识
                if (item.type === 'file') {
                    const badge = document.createElement('span');
                    badge.style.cssText = `
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 3px;
                        margin-left: 10px;
                    `;
                    
                    if (item.name.toLowerCase().endsWith('.onnx')) {
                        badge.textContent = 'ONNX';
                        badge.style.backgroundColor = '#e3f2fd';
                        badge.style.color = '#1976d2';
                    } else if (item.name.match(/\.(jpg|jpeg)$/i)) {
                        badge.textContent = 'JPG';
                        badge.style.backgroundColor = '#e8f5e8';
                        badge.style.color = '#388e3c';
                    } else if (item.name.match(/\.png$/i)) {
                        badge.textContent = 'PNG';
                        badge.style.backgroundColor = '#e8f5e8';
                        badge.style.color = '#388e3c';
                    }
                    
                    if (badge.textContent) {
                        name.appendChild(badge);
                    }
                }
                
                div.appendChild(icon);
                div.appendChild(name);
                
                div.onclick = () => handleFileClick(item);
                
                fileList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error loading file list:', error);
            showError('加载文件列表失败');
        });
}

// 处理文件点击
function handleFileClick(item) {
    if (item.type === 'directory') {
        currentPath = item.path;
        document.getElementById('currentPath').textContent = currentPath;
        addFileFilterTip(); // 更新提示
        loadFileList(currentPath);
    } else {
        // 检查文件类型
        if (currentBrowserTarget === 'model' && !item.name.endsWith('.onnx')) {
            showError('请选择.onnx格式的模型文件');
            return;
        }
        if (currentBrowserTarget === 'image' && !item.name.match(/\.(jpg|jpeg|png)$/i)) {
            showError('请选择jpg或png格式的图片文件');
            return;
        }
        
        // 更新对应的输入框
        const inputId = currentBrowserTarget === 'model' ? 'modelPath' : 'imagePath';
        document.getElementById(inputId).value = item.path;
        closeFileBrowser();
    }
}

// 开始测试
function startTesting() {
    const form = document.getElementById('testingForm');
    const formData = new FormData(form);
    
    // 保存测试配置
    const testConfig = {
        modelSeries: getValue('modelSeries'),
        modelVersion: getValue('modelVersion'),
        modelTag: getValue('modelTag'),
        modelPath: getValue('modelPath'),
        imagePath: getValue('imagePath'),
        numClasses: getValue('numClasses'),
        timestamp: Date.now()
    };
    
    testingStatus.update({
        isTesting: true,
        status: 'running',
        config: testConfig,
        logs: []
    });
    
    // 显示测试控制按钮
    document.querySelector('.testing-controls').style.display = 'block';
    // 隐藏之前的测试结果
    document.getElementById('testResult').style.display = 'none';
    
    // 发送测试请求
    fetch('/model_testing', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            showError(data.message);
            testingStatus.update({ isTesting: false, status: 'error' });
        } else {
            updateTestingProgress({ status: '测试已开始', progress: 0 });
            // 开始定期检查状态
            startStatusCheck();
        }
    })
    .catch(error => {
        console.error('Error starting testing:', error);
        showError('启动测试失败');
        testingStatus.update({ isTesting: false, status: 'error' });
    });
}

// 停止测试
function stopTesting() {
    fetch('/api/stop-testing', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                showError(data.message);
            } else {
                updateTestingProgress({ status: '测试已停止', progress: 0 });
                document.querySelector('.testing-controls').style.display = 'none';
                stopStatusCheck();
            }
        })
        .catch(error => {
            console.error('Error stopping testing:', error);
            showError('停止测试失败');
        });
}

let statusCheckInterval = null;

// 开始定期检查状态
function startStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    statusCheckInterval = setInterval(checkTestingStatus, 1000);
}

// 停止状态检查
function stopStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

// 检查测试状态
function checkTestingStatus() {
    fetch('/api/testing-status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                showError(data.message);
                stopStatusCheck();
                return;
            }
            
            updateTestingProgress(data);
            
            if (data.status === 'completed') {
                stopStatusCheck();
                
                // 更新本地状态为已完成
                testingStatus.update({
                    isTesting: false,
                    status: 'completed'
                });
                
                updateTestingProgress({
                    status: '测试已完成',
                    message: '测试完成，检测结果如下：',
                    progress: 100
                });
                showTestResult(data);
            } else if (data.status === 'stopped') {
                stopStatusCheck();
                
                // 更新本地状态为已停止
                testingStatus.update({
                    isTesting: false,
                    status: 'stopped'
                });
                
                document.querySelector('.testing-controls').style.display = 'none';
                if (data.error) {
                    showError(data.error);
                } else {
                    updateTestingProgress({
                        status: '测试已停止',
                        message: '测试已手动停止',
                        progress: 0
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error checking testing status:', error);
            showError('获取测试状态失败');
            stopStatusCheck();
        });
}

// 更新测试进度
function updateTestingProgress(data) {
    const progressDiv = document.getElementById('testingProgress');
    progressDiv.innerHTML = `
        <div class="status-message">${data.message}</div>
        ${data.progress !== undefined ? `<div class="progress-bar">
            <div class="progress" style="width: ${data.progress}%"></div>
        </div>` : ''}
        ${data.stdout ? `<div class="output-log">${data.stdout}</div>` : ''}
        ${data.stderr ? `<div class="error-log">${data.stderr}</div>` : ''}
    `;
}

// 显示测试结果
function showTestResult(data) {
    console.log('显示测试结果:', data);
    
    const resultDiv = document.getElementById('testResult');
    resultDiv.style.display = 'block';
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.style.display = 'block';
    
    // 更新图片显示
    if (data.original_image) {
        const originalImg = document.getElementById('originalImage');
        originalImg.src = data.original_image;
        console.log('设置原始图片路径:', originalImg.src);
    }
    
    if (data.result_image) {
        const resultImg = document.getElementById('resultImage');
        resultImg.src = data.result_image;
        console.log('设置结果图片路径:', resultImg.src);
    }
    
    // 更新检测信息
    const detectionInfo = document.getElementById('detectionInfo');
    if (data.stdout) {
        detectionInfo.innerHTML = `<pre>${data.stdout}</pre>`;
    } else if (data.detection_info) {
        detectionInfo.innerHTML = data.detection_info;
    }
    
    // 隐藏控制按钮
    document.querySelector('.testing-controls').style.display = 'none';
}

// 显示错误信息
function showError(message) {
    const progressDiv = document.getElementById('testingProgress');
    progressDiv.innerHTML = `<div class="error-message">${message}</div>`;
}



// 辅助函数：获取元素值
function getValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

// 辅助函数：设置元素值
function setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value || '';
    }
}



// 检查并恢复测试状态（与其他页面保持一致）
async function checkAndRestoreTestingState() {
    try {
        console.log('检查服务器测试状态...');
        
        // 首先检查本地是否有已完成的任务状态（历史任务）
        if (testingStatus.config && !testingStatus.isTesting && testingStatus.status === 'completed') {
            console.log('发现已完成的测试任务状态，询问用户是否恢复');
            const shouldRestoreCompleted = await askUserRestoreTesting();
            if (shouldRestoreCompleted) {
                restoreCompletedTestingUI();
                return;
            } else {
                // 用户选择不恢复，清除旧状态
                testingStatus.clear();
            }
        }
        
        const response = await fetch('/api/testing-status');
        
        if (response.ok) {
            const serverStatus = await response.json();
            console.log('服务器状态:', serverStatus);
            
            // 如果服务器有任务在运行，直接自动恢复
            if (serverStatus.status === 'running') {
                console.log('检测到服务器有测试任务在运行，开始恢复状态...');
                
                // 更新本地状态
                testingStatus.update({
                    isTesting: true,
                    status: 'running',
                    config: serverStatus.config || testingStatus.config
                });
                
                restoreTestingUI(serverStatus);
                restoreFormState();
                startStatusCheck();
                return;
            } else if (serverStatus.status === 'stopped' || serverStatus.status === 'completed') {
                console.log('服务器测试任务已结束');
                
                // 检查本地是否有相应的状态，如果有且是运行中状态，说明是刚完成的任务
                if (testingStatus.isTesting) {
                    console.log('更新本地状态为已完成');
                    testingStatus.update({
                        isTesting: false,
                        status: serverStatus.status
                    });
                    
                    // 如果是刚完成的任务，询问用户是否查看结果
                    const shouldViewResult = await askUserViewTestingResult();
                    if (shouldViewResult) {
                        if (serverStatus.status === 'completed' && serverStatus.result_image) {
                            showTestResult(serverStatus);
                        } else {
                            restoreCompletedTestingUI();
                        }
                        return;
                    }
                }
            }
        } else {
            console.log('无法获取服务器状态，可能没有任务在运行');
            // 如果有本地保存的运行状态，但服务器没有任务，清除本地状态
            if (testingStatus.isTesting) {
                console.log('本地状态与服务器不一致，清除本地状态');
                testingStatus.clear();
            }
        }
    } catch (error) {
        console.error('检查服务器状态失败:', error);
        
        // 网络错误时，检查本地是否有完成的任务状态
        if (testingStatus.config && !testingStatus.isTesting && testingStatus.status === 'completed') {
            const shouldRestoreCompleted = await askUserRestoreTesting();
            if (shouldRestoreCompleted) {
                restoreCompletedTestingUI();
                return;
            }
        }
        
        // 如果有本地状态，尝试恢复UI
        if (testingStatus.isTesting) {
            console.log('网络错误，但尝试根据本地状态恢复UI');
            restoreTestingUIFromLocal();
            setTimeout(() => checkAndRestoreTestingState(), 5000); // 5秒后重试
        }
    }
}

// 询问用户是否恢复历史测试任务
async function askUserRestoreTesting() {
    return new Promise((resolve) => {
        const timeStr = new Date(testingStatus.config?.timestamp || Date.now()).toLocaleString();
        let taskInfo = `任务时间: ${timeStr}`;
        
        if (testingStatus.config) {
            taskInfo += `\n模型类型: ${testingStatus.config.modelSeries || '未知'}`;
            taskInfo += `\n模型版本: ${testingStatus.config.modelVersion || '未知'}`;
            taskInfo += `\n模型文件: ${testingStatus.config.modelPath || '未知'}`;
            taskInfo += `\n测试图片: ${testingStatus.config.imagePath || '未知'}`;
        }
        
        const modal = createRestoreTestingModal(taskInfo, resolve);
        document.body.appendChild(modal);
    });
}

// 询问用户是否查看测试结果
async function askUserViewTestingResult() {
    return new Promise((resolve) => {
        const modal = createViewTestingResultModal(resolve);
        document.body.appendChild(modal);
    });
}

// 创建恢复历史测试任务模态框
function createRestoreTestingModal(taskInfo, resolve) {
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
                <button id="restoreTestYes" style="
                    background-color: #ff8c00;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 10px;
                    font-size: 14px;
                ">查看结果</button>
                <button id="restoreTestNo" style="
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
    
    modal.querySelector('#restoreTestYes').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
    };
    
    modal.querySelector('#restoreTestNo').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
    };
    
    return modal;
}

// 创建查看测试结果模态框
function createViewTestingResultModal(resolve) {
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
            <h3 style="color: #28a745; margin-bottom: 15px;">发现测试结果！</h3>
            <p style="color: #666; margin: 15px 0;">检测到之前的测试已完成，是否要查看结果？</p>
            <div style="margin-top: 20px;">
                <button id="viewTestYes" style="
                    background-color: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 10px;
                    font-size: 14px;
                ">查看结果</button>
                <button id="viewTestNo" style="
                    background-color: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 10px;
                    font-size: 14px;
                ">开始新测试</button>
            </div>
        </div>
    `;
    
    modal.querySelector('#viewTestYes').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
    };
    
    modal.querySelector('#viewTestNo').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
    };
    
    return modal;
}

// 根据服务器状态恢复测试UI
function restoreTestingUI(serverStatus) {
    console.log('开始恢复测试UI...');
    
    // 禁用表单
    const form = document.getElementById('testingForm');
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        if (input.type !== 'button' && !input.classList.contains('stop-btn')) {
            input.disabled = true;
        }
    });
    
    // 显示测试状态
    const testingProgress = document.getElementById('testingProgress');
    const testingControls = document.querySelector('.testing-controls');
    
    testingProgress.innerHTML = `
        <div class="status-item">
            <h3>测试状态: <span class="status-badge running">正在运行</span></h3>
            <p>测试进度: ${serverStatus.progress || 0}%</p>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${serverStatus.progress || 0}%">${serverStatus.progress || 0}%</div>
        </div>
        <div class="status-item">
            <h3>测试日志:</h3>
            <div class="log-output">${serverStatus.stdout || '等待输出...'}</div>
        </div>
    `;
    
    testingControls.style.display = 'block';
    
    console.log('测试UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreTestingUIFromLocal() {
    if (!testingStatus.isTesting) return;
    
    console.log('根据本地状态恢复UI...');
    
    const testingProgress = document.getElementById('testingProgress');
    const testingControls = document.querySelector('.testing-controls');
    
    testingProgress.innerHTML = `
        <div class="status-item">
            <h3>测试状态: <span class="status-badge running">尝试重连中...</span></h3>
            <p>正在尝试重新连接服务器...</p>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">重连中...</div>
        </div>
        <div class="status-item">
            <h3>测试日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    testingControls.style.display = 'block';
    
    // 恢复日志
    const logOutput = document.querySelector('.log-output');
    if (testingStatus.logs && testingStatus.logs.length > 0) {
        testingStatus.logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = log.type || 'info';
            logDiv.style.marginBottom = '4px';
            logDiv.style.padding = '2px 0';
            if (log.type === 'error') {
                logDiv.style.color = '#dc3545';
            } else if (log.type === 'warning') {
                logDiv.style.color = '#fd7e14';
            } else {
                logDiv.style.color = '#495057';
            }
            logDiv.textContent = log.content;
            logOutput.appendChild(logDiv);
        });
        logOutput.scrollTop = logOutput.scrollHeight;
    } else {
        logOutput.innerHTML = '<p style="color: #6c757d; font-style: italic; margin: 0;">暂无日志记录</p>';
    }
}

// 恢复已完成的测试UI
function restoreCompletedTestingUI() {
    console.log('恢复已完成的测试任务UI...');
    
    // 1. 恢复表单状态
    restoreFormState();
    
    // 2. 表单设为只读状态（已完成的任务）
    const form = document.getElementById('testingForm');
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        if (input.type !== 'button' || input.textContent === '开始测试') {
            input.disabled = true;
        }
    });
    
    // 3. 显示测试状态
    const testingProgress = document.getElementById('testingProgress');
    const testingControls = document.querySelector('.testing-controls');
    const testResult = document.getElementById('testResult');
    
    testingProgress.innerHTML = `
        <div class="status-item" style="margin-bottom: 20px;">
            <h3>测试状态: <span class="status-badge completed" style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">已完成</span></h3>
            <p style="color: #666; margin: 10px 0;">测试完成时间: ${new Date(testingStatus.config?.timestamp || Date.now()).toLocaleString()}</p>
        </div>
        <div class="status-item" style="margin-bottom: 20px;">
            <h3>测试配置:</h3>
            <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px; line-height: 1.6;">模型: ${testingStatus.config?.modelSeries} ${testingStatus.config?.modelVersion} ${testingStatus.config?.modelTag}
模型文件: ${testingStatus.config?.modelPath || '未知'}
测试图片: ${testingStatus.config?.imagePath || '未知'}
类别数量: ${testingStatus.config?.numClasses || '未知'}</pre>
        </div>
        <div class="status-item">
            <h3>测试日志:</h3>
            <div class="log-output" style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 13px; line-height: 1.4;"></div>
        </div>
    `;
    
    // 隐藏控制按钮
    testingControls.style.display = 'none';
    
    // 恢复日志
    const logOutput = document.querySelector('.log-output');
    if (testingStatus.logs && testingStatus.logs.length > 0) {
        testingStatus.logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = log.type || 'info';
            logDiv.textContent = log.content;
            logOutput.appendChild(logDiv);
        });
        logOutput.scrollTop = logOutput.scrollHeight;
    }
    
    // 3. 尝试加载和显示结果图片
    loadTestResults();
}

// 恢复表单状态
function restoreFormState() {
    if (!testingStatus.config) return;
    
    console.log('恢复表单状态:', testingStatus.config);
    
    // 恢复基本字段
    setValue('modelPath', testingStatus.config.modelPath);
    setValue('imagePath', testingStatus.config.imagePath);
    setValue('numClasses', testingStatus.config.numClasses);
    
    // 恢复模型选择字段
    if (testingStatus.config.modelSeries) {
        setValue('modelSeries', testingStatus.config.modelSeries);
        updateVersionOptions(testingStatus.config.modelSeries);
        
        // 延迟恢复版本和标签，确保选项已更新
        setTimeout(() => {
            if (testingStatus.config.modelVersion) {
                setValue('modelVersion', testingStatus.config.modelVersion);
                updateTagOptions(testingStatus.config.modelSeries, testingStatus.config.modelVersion);
                
                setTimeout(() => {
                    if (testingStatus.config.modelTag) {
                        setValue('modelTag', testingStatus.config.modelTag);
                    }
                }, 100);
            }
        }, 100);
    }
}

// 加载测试结果
async function loadTestResults() {
    try {
        console.log('尝试加载测试结果...');
        
        // 首先检查服务器是否有结果
        const response = await fetch('/api/testing-status');
        if (response.ok) {
            const serverStatus = await response.json();
            if (serverStatus.status === 'completed' && serverStatus.result_image) {
                console.log('从服务器加载测试结果');
                showTestResult(serverStatus);
                return;
            }
        }
        
        // 如果服务器没有结果，尝试显示默认的结果区域
        const testResult = document.getElementById('testResult');
        const resultContainer = document.getElementById('resultContainer');
        
        testResult.style.display = 'block';
        resultContainer.style.display = 'block';
        
        // 设置默认图片路径（如果存在）
        if (testingStatus.config) {
            // 尝试显示原始图片
            const originalImg = document.getElementById('originalImage');
            if (testingStatus.config.imagePath) {
                originalImg.src = `/original-image?path=${encodeURIComponent(testingStatus.config.imagePath)}`;
                console.log('设置原始图片路径:', originalImg.src);
            }
            
            // 尝试显示结果图片（使用默认路径）
            const resultImg = document.getElementById('resultImage');
            resultImg.src = '/test-result-image/result.jpg';
            
            // 如果图片加载失败，隐藏图片容器
            resultImg.onerror = function() {
                console.log('结果图片加载失败，可能需要重新测试');
                resultContainer.style.display = 'none';
            };
        }
        
        console.log('测试结果区域已显示');
        
    } catch (error) {
        console.error('加载测试结果失败:', error);
    }
}

// 绑定表单事件（不再自动保存状态，与其他页面保持一致）
function bindFormEvents() {
    // 这里可以添加其他表单事件处理逻辑
    console.log('表单事件绑定完成');
}
