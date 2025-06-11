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

// 页面状态管理器
let pageStateManager = null;
let pageRestorer = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化测试页面');
    console.log('模型配置数据:', modelConfigs);
    
    // 初始化状态管理器
    pageStateManager = new PageStateManager('testing_page');
    pageRestorer = new PageRestorer(pageStateManager, '/api/testing-status', '/api/stop-testing');
    
    // 初始化各个组件
    initializeModelSelectors();
    initializeWebSocket();
    initializeFileBrowser();
    initializeForm();
    
    // 绑定表单事件
    bindFormEvents();
    
    // 恢复页面状态
    restorePageState();
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
    loadFileList(currentPath);
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
    loadFileList(currentPath);
}

// 加载文件列表
function loadFileList(path) {
    fetch(`/browse?path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = '';
            
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'file-item';
                
                const icon = document.createElement('i');
                icon.className = item.type === 'directory' ? 'fas fa-folder' : 'fas fa-file';
                
                const name = document.createElement('span');
                name.textContent = item.name;
                
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
    
    // 保存表单状态
    saveFormState();
    
    // 显示测试控制按钮
    document.querySelector('.testing-controls').style.display = 'block';
    // 隐藏之前的测试结果
    document.getElementById('testResult').style.display = 'none';
    
    // 清空之前的日志
    if (pageStateManager) {
        pageStateManager.update({ logs: [] });
    }
    
    // 发送测试请求
    fetch('/model_testing', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            showError(data.message);
        } else {
            updateTestingProgress({ status: '测试已开始', progress: 0 });
            // 开始定期检查状态
            startStatusCheck();
        }
    })
    .catch(error => {
        console.error('Error starting testing:', error);
        showError('启动测试失败');
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
                updateTestingProgress({
                    status: '测试已完成',
                    message: '测试完成，检测结果如下：',
                    progress: 100
                });
                showTestResult(data);
            } else if (data.status === 'stopped') {
                stopStatusCheck();
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
    
    // 保存日志内容到状态管理器
    if (pageStateManager && data.stdout) {
        const state = pageStateManager.getState();
        const logs = state.logs || [];
        const newLogs = data.stdout.split('\n').filter(line => line.trim());
        
        // 转换为日志对象格式
        const logObjects = newLogs.map(line => ({
            type: 'info',
            content: line,
            timestamp: Date.now()
        }));
        
        const allLogs = [...logs, ...logObjects].slice(-100); // 保持最近100行
        pageStateManager.update({ logs: allLogs });
    }
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

// 保存表单状态
function saveFormState() {
    if (!pageStateManager) return;
    
    const formState = {
        modelSeries: getValue('modelSeries'),
        modelVersion: getValue('modelVersion'),
        modelTag: getValue('modelTag'),
        modelPath: getValue('modelPath'),
        imagePath: getValue('imagePath'),
        numClasses: getValue('numClasses'),
        timestamp: Date.now()
    };
    
    pageStateManager.update({ formState: formState });
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

// 恢复表单状态
function restoreFormState(state) {
    if (!state || !state.formState) return;
    
    const formState = state.formState;
    
    // 恢复表单值
    setValue('modelSeries', formState.modelSeries);
    setValue('modelPath', formState.modelPath);
    setValue('imagePath', formState.imagePath);
    setValue('numClasses', formState.numClasses);
    
    // 更新下拉选项
    if (formState.modelSeries) {
        updateVersionOptions(formState.modelSeries);
        
        // 延迟恢复版本和标签，确保选项已更新
        setTimeout(() => {
            if (formState.modelVersion) {
                setValue('modelVersion', formState.modelVersion);
                updateTagOptions(formState.modelSeries, formState.modelVersion);
                
                setTimeout(() => {
                    if (formState.modelTag) {
                        setValue('modelTag', formState.modelTag);
                    }
                }, 100);
            }
        }, 100);
    }
}

// 恢复页面状态
async function restorePageState() {
    // 加载本地状态
    pageStateManager.load();
    const state = pageStateManager.getState();
    
    // 恢复表单状态
    restoreFormState(state);
    
    // 检查服务器状态并恢复进度
    try {
        const restoreResult = await pageRestorer.checkAndRestore();
        
        if (restoreResult.shouldRestore && restoreResult.serverStatus) {
            const serverState = restoreResult.serverStatus;
            
            // 显示控制按钮
            const controlsElement = document.querySelector('.testing-controls');
            if (controlsElement) {
                controlsElement.style.display = 'block';
            }
            
            // 开始状态检查
            startStatusCheck();
            
            // 恢复日志内容
            const currentState = pageStateManager.getState();
            const logs = currentState.logs || [];
            updateTestingProgress({
                status: serverState.status,
                message: serverState.message || '测试进行中',
                stdout: logs.map(log => log.content).join('\n'),
                progress: serverState.progress || 0
            });
        }
    } catch (error) {
        console.error('恢复页面状态失败:', error);
    }
}

// 绑定表单事件以保存状态
function bindFormEvents() {
    const formElements = ['modelSeries', 'modelVersion', 'modelTag', 'modelPath', 'imagePath', 'numClasses'];
    
    formElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveFormState);
            element.addEventListener('input', saveFormState);
        }
    });
}
