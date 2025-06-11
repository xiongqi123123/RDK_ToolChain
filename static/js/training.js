// 模型配置数据
const modelConfigs = {
    classification: {
        versions: [
            { 
                value: "mobilenetv3", 
                label: "MobileNetV3",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "_large_100", label: "large_100" }
                        ]
                    }
                ]
            },
            { 
                value: "mobilenetv4", 
                label: "MobileNetV4",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "_conv_small_050", label: "conv_small_050" },
                            { value: "_conv_small", label: "conv_small" },
                            { value: "_conv_medium", label: "conv_medium" },
                            { value: "_conv_large", label: "conv_large" }
                        ]
                    }
                ]
            },
            { 
                value: "repvit", 
                label: "RepViT",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "_m0_9", label: "m0_9" },
                            { value: "_m1_0", label: "m1_0" },
                            { value: "_m1_1", label: "m1_1" },
                            { value: "_m1_5", label: "m1_5" },
                            { value: "_m2_3", label: "m2_3" }
                        ]
                    }
                ]
            },
            { 
                value: "efficientvit", 
                label: "EfficientViT",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "_m0", label: "m0" },
                            { value: "_m1", label: "m1" },
                            { value: "_m2", label: "m2" },
                            { value: "_m3", label: "m3" },
                            { value: "_m4", label: "m4" },
                            { value: "_m5", label: "m5" }
                        ]
                    }
                ]
            },
            { 
                value: "efficientformerv2", 
                label: "EfficientFormerV2",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "_s0", label: "s0" },
                            { value: "_s1", label: "s1" },
                            { value: "_s2", label: "s2" },
                            { value: "_l", label: "l" }
                        ]
                    }
                ]
            },
            { 
                value: "hrnet", 
                label: "HRNet",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "_w18", label: "w18" },
                            { value: "_w32", label: "w32" },
                            { value: "_w48", label: "w48" }
                        ]
                    }
                ]
            },
            { 
                value: "resnet", 
                label: "ResNet",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "18", label: "18" },
                            { value: "34", label: "34" },
                            { value: "50", label: "50" },
                            { value: "101", label: "101" }
                        ]
                    }
                ]
            },
            { 
                value: "resnext", 
                label: "ResNeXt",
                tags: [
                    { 
                        value: "classification", 
                        label: "Classification",
                        sizes: [
                            { value: "50_32x4d", label: "50_32x4d" },
                            { value: "101_32x4d", label: "101_32x4d" }
                        ]
                    }
                ]
            }
        ]
    },
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

// 训练状态管理 - 添加状态持久化
const trainingStatus = {
    isTraining: false,
    totalEpochs: 0,
    currentEpoch: 0,
    config: null,
    logs: [],
    status: 'idle',
    
            // 保存状态到localStorage
        save: function() {
            const stateData = {
                isTraining: this.isTraining,
                totalEpochs: this.totalEpochs,
                currentEpoch: this.currentEpoch,
                config: this.config,
                logs: this.logs,
                status: this.status || 'idle',
                timestamp: Date.now()
            };
        localStorage.setItem('trainingStatus', JSON.stringify(stateData));
        console.log('训练状态已保存:', stateData);
    },
    
    // 从localStorage恢复状态
    load: function() {
        try {
            const savedData = localStorage.getItem('trainingStatus');
            if (savedData) {
                const stateData = JSON.parse(savedData);
                // 检查数据是否过期（超过24小时）
                if (Date.now() - stateData.timestamp < 24 * 60 * 60 * 1000) {
                    this.isTraining = stateData.isTraining || false;
                    this.totalEpochs = stateData.totalEpochs || 0;
                    this.currentEpoch = stateData.currentEpoch || 0;
                    this.config = stateData.config || null;
                    this.logs = stateData.logs || [];
                    this.status = stateData.status || 'idle';
                    console.log('训练状态已恢复:', stateData);
                    return true;
                } else {
                    // 数据过期，清除
                    this.clear();
                }
            }
        } catch (error) {
            console.error('恢复训练状态失败:', error);
            this.clear();
        }
        return false;
    },
    
            // 清除保存的状态
        clear: function() {
            localStorage.removeItem('trainingStatus');
            this.isTraining = false;
            this.totalEpochs = 0;
            this.currentEpoch = 0;
            this.config = null;
            this.logs = [];
            this.status = 'idle';
            console.log('训练状态已清除');
        },
    
    // 更新状态并保存
    update: function(updates) {
        Object.assign(this, updates);
        this.save();
    }
};

// 页面加载时恢复状态
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 先恢复保存的状态
    const hasRestoredState = trainingStatus.load();
    
    // 初始化页面
    initializePage();
    
    // 检查服务器状态并恢复UI
    checkAndRestoreTrainingState();
});

// 初始化页面
function initializePage() {
    console.log('开始初始化页面...');
    
    // 设备检测
    detectDevice();
    
    // 绑定模型选择事件
    const modelSeriesSelect = document.getElementById('modelSeries');
    if (modelSeriesSelect) {
        console.log('绑定modelSeries事件');
        modelSeriesSelect.onchange = function() {
            console.log('modelSeries changed to:', this.value);
            // 先重置后续字段，再更新当前字段的选项
            resetFormFields(['modelTag', 'modelSize']);
            updateVersionOptions(this.value);
            
            // 切换数据集格式提示
            updateDatasetStructureDisplay(this.value);
        };
    } else {
        console.error('找不到modelSeries元素');
    }
    
    const modelVersionSelect = document.getElementById('modelVersion');
    if (modelVersionSelect) {
        console.log('绑定modelVersion事件');
        modelVersionSelect.onchange = function() {
            console.log('modelVersion changed to:', this.value);
            const modelSeries = document.getElementById('modelSeries').value;
            // 先重置后续字段，再更新当前字段的选项
            resetFormFields(['modelSize']);
            updateTagOptions(modelSeries, this.value);
        };
    } else {
        console.error('找不到modelVersion元素');
    }
    
    // 添加缺失的modelTag事件绑定
    const modelTagSelect = document.getElementById('modelTag');
    if (modelTagSelect) {
        console.log('绑定modelTag事件');
        modelTagSelect.onchange = function() {
            console.log('modelTag changed to:', this.value);
            const modelSeries = document.getElementById('modelSeries').value;
            const selectedVersion = document.getElementById('modelVersion').value;
            
            // 处理关键点配置显示（仅YOLO pose模型需要）
            const kptShapeGroup = document.getElementById('kptShapeGroup');
            if (modelSeries === 'yolo' && this.value === 'pose') {
                kptShapeGroup.style.display = 'block';
            } else {
                kptShapeGroup.style.display = 'none';
            }
            
            updateSizeOptions(modelSeries, selectedVersion, this.value);
        };
    } else {
        console.error('找不到modelTag元素');
    }
    

    
    // 绑定文件浏览器按钮事件
    const browseBtn = document.querySelector('.browse-btn');
    if (browseBtn) {
        browseBtn.onclick = openFileBrowser;
        console.log('绑定浏览按钮事件');
    } else {
        console.error('找不到浏览按钮');
    }
    
    // 绑定表单提交事件
    const trainingForm = document.getElementById('trainingForm');
    if (trainingForm) {
        trainingForm.onsubmit = handleFormSubmit;
        console.log('绑定表单提交事件');
    } else {
        console.error('找不到trainingForm');
    }
    
    // 初始化数据集格式显示
    const initialModelSeries = document.getElementById('modelSeries').value;
    updateDatasetStructureDisplay(initialModelSeries);
    
    console.log('页面初始化完成');
}

// 检查并恢复训练状态
async function checkAndRestoreTrainingState() {
    try {
        console.log('检查服务器训练状态...');
        
        // 首先检查本地是否有已完成的任务状态
        if (trainingStatus.config && !trainingStatus.isTraining && trainingStatus.status === 'completed') {
            console.log('发现已完成的训练任务状态，询问用户是否恢复');
            const shouldRestoreCompleted = await askUserRestoreTraining();
            if (shouldRestoreCompleted) {
                restoreCompletedTrainingUI();
                restoreFormState();
                return;
            } else {
                // 用户选择不恢复，清除旧状态
                trainingStatus.clear();
            }
        }
        
        const response = await fetch('/api/training-status');
        
        if (response.ok) {
            const serverStatus = await response.json();
            console.log('服务器状态:', serverStatus);
            
            // 如果服务器有任务在运行
            if (serverStatus.status === 'running') {
                console.log('检测到服务器有训练任务在运行，开始恢复状态...');
                
                // 恢复训练状态
                trainingStatus.update({
                    isTraining: true,
                    totalEpochs: serverStatus.config?.epochs || trainingStatus.totalEpochs,
                    currentEpoch: serverStatus.current_epoch || 0,
                    config: serverStatus.config || trainingStatus.config,
                    status: 'running'
                });
                
                // 恢复UI状态
                restoreTrainingUI(serverStatus);
                
                // 恢复表单状态
                restoreFormState();
                
                // 开始轮询
                setTimeout(pollTrainingStatus, 1000);
                
            } else if (serverStatus.status === 'stopped' || serverStatus.status === 'completed') {
                console.log('服务器训练任务已结束');
                
                // 检查本地是否有相应的状态，如果有且是运行中状态，需要更新为完成状态
                if (trainingStatus.isTraining) {
                    console.log('更新本地状态为已完成');
                    trainingStatus.update({
                        isTraining: false,
                        status: serverStatus.status
                    });
                    
                    // 如果是刚完成的任务，询问用户是否查看结果
                    const shouldViewResult = await askUserViewTrainingResult();
                    if (shouldViewResult) {
                        restoreCompletedTrainingUI();
                        restoreFormState();
                        return;
                    }
                }
            }
        } else {
            console.log('无法获取服务器状态，可能没有任务在运行');
            // 如果有本地保存的运行状态，但服务器没有任务，清除本地状态
            if (trainingStatus.isTraining) {
                console.log('本地状态与服务器不一致，清除本地状态');
                trainingStatus.clear();
            }
        }
    } catch (error) {
        console.error('检查服务器状态失败:', error);
        
                 // 网络错误时，检查本地是否有完成的任务状态
         if (trainingStatus.config && !trainingStatus.isTraining && trainingStatus.status === 'completed') {
             const shouldRestoreCompleted = await askUserRestoreTraining();
             if (shouldRestoreCompleted) {
                 restoreCompletedTrainingUI();
                 restoreFormState();
                 return;
             }
         }
        
        // 如果有本地状态，尝试恢复UI
        if (trainingStatus.isTraining) {
            console.log('网络错误，但尝试根据本地状态恢复UI');
            restoreTrainingUIFromLocal();
            setTimeout(pollTrainingStatus, 5000); // 5秒后重试轮询
        }
    }
}

// 根据服务器状态恢复UI
function restoreTrainingUI(serverStatus) {
    console.log('开始恢复训练UI...');
    
    // 恢复表单状态（禁用）
    const form = document.getElementById('trainingForm');
    const inputs = form.querySelectorAll('input, select, button, textarea');
    inputs.forEach(input => {
        if (input.type !== 'button' && !input.classList.contains('stop-btn')) {
            input.disabled = true;
        }
    });
    
    // 显示训练状态区域
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    // 创建状态显示元素
    trainingProgress.innerHTML = `
        <div class="status-item">
            <h3>训练状态: <span class="status-badge running">正在运行</span></h3>
            <p>当前轮次: ${serverStatus.current_epoch || 0}/${trainingStatus.totalEpochs}</p>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">0%</div>
        </div>
        <div class="status-item">
            <h3>训练日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    trainingControls.style.display = 'block';
    
    // 恢复日志内容
    const logOutput = document.querySelector('.log-output');
    if (trainingStatus.logs && trainingStatus.logs.length > 0) {
        console.log('恢复保存的日志，共' + trainingStatus.logs.length + '条');
        trainingStatus.logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = log.type;
            logDiv.textContent = log.content;
            logOutput.appendChild(logDiv);
        });
        logOutput.scrollTop = logOutput.scrollHeight;
    }
    
    // 更新进度条
    if (serverStatus.current_epoch && trainingStatus.totalEpochs) {
        const progress = (serverStatus.current_epoch / trainingStatus.totalEpochs) * 100;
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress.toFixed(1)}%`;
    }
    
    console.log('训练UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreTrainingUIFromLocal() {
    if (!trainingStatus.isTraining) return;
    
    console.log('根据本地状态恢复UI...');
    
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    trainingProgress.innerHTML = `
        <div class="status-item">
            <h3>训练状态: <span class="status-badge running">尝试重连中...</span></h3>
            <p>当前轮次: ${trainingStatus.currentEpoch}/${trainingStatus.totalEpochs}</p>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">重连中...</div>
        </div>
        <div class="status-item">
            <h3>训练日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    trainingControls.style.display = 'block';
    
    // 恢复日志
    const logOutput = document.querySelector('.log-output');
    if (trainingStatus.logs && trainingStatus.logs.length > 0) {
        trainingStatus.logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = log.type;
            logDiv.textContent = log.content;
            logOutput.appendChild(logDiv);
        });
        logOutput.scrollTop = logOutput.scrollHeight;
    }
}

// 恢复已完成的训练UI
function restoreCompletedTrainingUI() {
    console.log('恢复已完成的训练任务UI...');
    
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    trainingProgress.innerHTML = `
        <div class="status-item">
            <h3>训练状态: <span class="status-badge completed">已完成</span></h3>
            <p>训练完成时间: ${new Date(trainingStatus.config?.timestamp || Date.now()).toLocaleString()}</p>
        </div>
        <div class="status-item">
            <h3>训练配置:</h3>
            <pre>模型: ${trainingStatus.config?.modelSeries} ${trainingStatus.config?.modelVersion} ${trainingStatus.config?.modelTag} ${trainingStatus.config?.modelSize}
总轮次: ${trainingStatus.totalEpochs}
图像尺寸: ${trainingStatus.config?.image_size || 640}x${trainingStatus.config?.image_size || 640}  
数据集: ${trainingStatus.config?.datasetPath || '未知'}</pre>
        </div>
        <div class="status-item">
            <h3>训练日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    trainingControls.style.display = 'none';
    
    // 恢复日志
    const logOutput = document.querySelector('.log-output');
    if (trainingStatus.logs && trainingStatus.logs.length > 0) {
        console.log('恢复训练日志，共' + trainingStatus.logs.length + '条');
        trainingStatus.logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = log.type;
            logDiv.textContent = log.content;
            logOutput.appendChild(logDiv);
        });
        logOutput.scrollTop = logOutput.scrollHeight;
    }
    
    console.log('已完成任务UI恢复完成');
}

// 恢复表单状态
function restoreFormState() {
    if (trainingStatus.config) {
        console.log('恢复训练表单状态:', trainingStatus.config);
        
        // 字段名映射（后端字段名 -> 前端元素ID）
        const fieldMapping = {
            'device': 'device',
            'dataset_path': 'datasetPath',
            'epochs': 'epochs',
            'batch_size': 'batchSize',
            'num_classes': 'numClasses',
            'labels': 'labels',
            'image_size': 'imageSize',
            'kpt_num': 'kptNum',
            'kpt_dim': 'kptDim'
        };
        
        // 先恢复非级联选择字段
        Object.keys(trainingStatus.config).forEach(key => {
            if (!['modelSeries', 'modelVersion', 'modelTag', 'modelSize'].includes(key)) {
                const elementId = fieldMapping[key] || key;
                const element = document.getElementById(elementId);
                if (element && trainingStatus.config[key] !== undefined && trainingStatus.config[key] !== null) {
                    if (key === 'labels' && Array.isArray(trainingStatus.config[key])) {
                        element.value = trainingStatus.config[key].join('\n');
                    } else {
                        element.value = trainingStatus.config[key];
                    }
                    console.log(`恢复字段 ${key} -> ${elementId}: ${trainingStatus.config[key]}`);
                }
            }
        });
        
        // 按顺序恢复级联选择字段
        restoreCascadeFields();
    }
}

// 恢复级联选择字段
function restoreCascadeFields() {
    const config = trainingStatus.config;
    
    // 第一步：恢复模型系列
    if (config.modelSeries) {
        console.log('恢复模型系列:', config.modelSeries);
        const modelSeriesSelect = document.getElementById('modelSeries');
        if (modelSeriesSelect) {
            modelSeriesSelect.value = config.modelSeries;
            
            // 第二步：更新版本选项并恢复版本选择
            updateVersionOptions(config.modelSeries);
            
            if (config.modelVersion) {
                setTimeout(() => {
                    console.log('恢复模型版本:', config.modelVersion);
                    const modelVersionSelect = document.getElementById('modelVersion');
                    if (modelVersionSelect) {
                        modelVersionSelect.value = config.modelVersion;
                        
                        // 第三步：更新Tag选项并恢复Tag选择
                        updateTagOptions(config.modelSeries, config.modelVersion);
                        
                        if (config.modelTag) {
                            setTimeout(() => {
                                console.log('恢复模型Tag:', config.modelTag);
                                const modelTagSelect = document.getElementById('modelTag');
                                if (modelTagSelect) {
                                    modelTagSelect.value = config.modelTag;
                                    
                                    // 第四步：更新大小选项并恢复大小选择
                                    updateSizeOptions(config.modelSeries, config.modelVersion, config.modelTag);
                                    
                                    if (config.modelSize) {
                                        setTimeout(() => {
                                            console.log('恢复模型大小:', config.modelSize);
                                            const modelSizeSelect = document.getElementById('modelSize');
                                            if (modelSizeSelect) {
                                                modelSizeSelect.value = config.modelSize;
                                            }
                                        }, 100);
                                    }
                                }
                            }, 100);
                        }
                    }
                }, 100);
            }
        }
    }
}

// 询问用户是否恢复已完成的训练任务
async function askUserRestoreTraining() {
    return new Promise((resolve) => {
        const timeStr = new Date(trainingStatus.config?.timestamp || Date.now()).toLocaleString();
        let taskInfo = `任务时间: ${timeStr}`;
        
        if (trainingStatus.config) {
            taskInfo += `\n模型类型: ${trainingStatus.config.modelSeries || '未知'}`;
            taskInfo += `\n模型版本: ${trainingStatus.config.modelVersion || '未知'}`;
            taskInfo += `\n数据集: ${trainingStatus.config.datasetPath || '未知'}`;
            taskInfo += `\n训练轮次: ${trainingStatus.totalEpochs || '未知'}`;
        }
        
        const modal = createRestoreModal(taskInfo, resolve);
        document.body.appendChild(modal);
    });
}

// 询问用户是否查看刚完成的训练结果
async function askUserViewTrainingResult() {
    return new Promise((resolve) => {
        const modal = createViewResultModal(resolve);
        document.body.appendChild(modal);
    });
}

// 创建恢复任务模态框
function createRestoreModal(taskInfo, resolve) {
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
                <button id="restoreYes" style="
                    background-color: #ff8c00;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 10px;
                    font-size: 14px;
                ">查看结果</button>
                <button id="restoreNo" style="
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
    
    modal.querySelector('#restoreYes').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
    };
    
    modal.querySelector('#restoreNo').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
    };
    
    return modal;
}

// 创建查看结果模态框
function createViewResultModal(resolve) {
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
            <h3 style="color: #28a745; margin-bottom: 15px;">任务已完成！</h3>
            <p style="color: #666; margin: 15px 0;">是否要查看任务结果？</p>
            <div style="margin-top: 20px;">
                <button id="viewYes" style="
                    background-color: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 10px;
                    font-size: 14px;
                ">查看结果</button>
                <button id="viewNo" style="
                    background-color: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 10px;
                    font-size: 14px;
                ">关闭</button>
            </div>
        </div>
    `;
    
    modal.querySelector('#viewYes').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
    };
    
    modal.querySelector('#viewNo').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
    };
    
    return modal;
}

// 重置表单字段
function resetFormFields(fieldIds) {
    console.log('重置字段:', fieldIds);
    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            if (field.tagName === 'SELECT') {
                // 根据字段类型设置不同的默认文本
                let defaultText = '请选择';
                if (id === 'modelVersion') {
                    defaultText = '请先选择模型系列';
                } else if (id === 'modelTag') {
                    defaultText = '请先选择模型版本';
                } else if (id === 'modelSize') {
                    defaultText = '请先选择模型Tag';
                }
                field.innerHTML = `<option value="">${defaultText}</option>`;
                console.log(`重置${id}字段，设置默认文本: ${defaultText}`);
            } else {
                field.value = '';
                console.log(`重置${id}字段值`);
            }
        } else {
            console.warn(`找不到字段: ${id}`);
        }
    });
}

// 处理表单提交
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (trainingStatus.isTraining) {
        alert('已有训练任务在运行中');
        return;
    }
    
    const formData = new FormData(event.target);
    const epochs = parseInt(formData.get('epochs'));
    const config = Object.fromEntries(formData.entries());
    
    // 保存配置到状态
    trainingStatus.update({
        totalEpochs: epochs,
        config: config,
        logs: [], // 清空之前的日志
        status: 'idle'
    });
    
    submitTrainingForm(formData);
}

// 提交训练表单
function submitTrainingForm(formData) {
    console.log('提交训练表单...');
    
    fetch('/model-training', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('训练启动成功');
            
            // 更新状态
            trainingStatus.update({
                isTraining: true,
                totalEpochs: data.config.epochs,
                currentEpoch: 0,
                status: 'running'
            });
            
            // 更新UI
            showTrainingStarted(data.config);
            
            // 开始轮询状态
            setTimeout(pollTrainingStatus, 2000);
        } else {
            alert('启动训练失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('提交训练失败:', error);
        alert('提交训练失败: ' + error.message);
    });
}

// 显示训练开始状态
function showTrainingStarted(config) {
    const form = document.getElementById('trainingForm');
    const inputs = form.querySelectorAll('input, select, button, textarea');
    inputs.forEach(input => {
        if (input.type !== 'button' && !input.classList.contains('stop-btn')) {
            input.disabled = true;
        }
    });

    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    trainingProgress.innerHTML = `
        <div class="status-item">
            <h3>训练状态: <span class="status-badge running">正在运行</span></h3>
            <p>当前轮次: 0/${config.epochs}</p>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">0%</div>
        </div>
        <div class="status-item">
            <h3>训练配置:</h3>
            <pre>模型: ${config.model_info.series} ${config.model_info.version} ${config.model_info.tag} ${config.model_info.size}
设备: ${config.device}
轮次: ${config.epochs}
批次大小: ${config.batch_size}
图像尺寸: ${config.image_size}x${config.image_size}
数据集: ${config.dataset_path}</pre>
        </div>
        <div class="status-item">
            <h3>训练日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    trainingControls.style.display = 'block';
}

// 更新版本选项
function updateVersionOptions(modelSeries) {
    console.log('updateVersionOptions called with:', modelSeries);
    
    const versionSelect = document.getElementById('modelVersion');
    if (!versionSelect) {
        console.error('找不到modelVersion选择框');
        return;
    }
    
    const versions = modelConfigs[modelSeries]?.versions || [];
    console.log('找到的版本:', versions);
    
    versionSelect.innerHTML = '<option value="">请选择版本</option>';
    versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version.value;
        option.textContent = version.label;
        versionSelect.appendChild(option);
        console.log('添加版本选项:', version.label);
    });
    
    console.log('版本选项更新完成，总共添加了', versions.length, '个选项');
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
    
    // 隐藏关键点配置
        const kptShapeGroup = document.getElementById('kptShapeGroup');
    if (kptShapeGroup) {
            kptShapeGroup.style.display = 'none';
        }
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
                if (statusBadge) {
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在运行';
                }
                
                // 更新当前轮次到状态管理
                if (data.current_epoch !== undefined) {
                    trainingStatus.update({
                        currentEpoch: data.current_epoch
                    });
                }
                
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
                    
                    if (progressBar) {
                    progressBar.style.transition = 'width 0.5s ease-in-out';
                    progressBar.style.width = `${progress}%`;
                    progressBar.textContent = `${progress.toFixed(1)}%`;
                    }
                    if (currentEpoch) {
                    currentEpoch.textContent = `当前轮次: ${data.current_epoch}/${trainingStatus.totalEpochs}`;
                    }
                }
                
                // 更新日志并保存到状态
                const logOutput = document.querySelector('.log-output');
                let hasNewLogs = false;
                
                if (data.stdout) {
                    const lines = data.stdout.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            const stdoutDiv = document.createElement('div');
                            stdoutDiv.className = 'stdout';
                            stdoutDiv.textContent = line;
                            if (logOutput) {
                            logOutput.appendChild(stdoutDiv);
                        }
                            
                            // 保存到状态（限制日志数量避免内存过大）
                            trainingStatus.logs.push({
                                type: 'stdout',
                                content: line,
                                timestamp: Date.now()
                            });
                            hasNewLogs = true;
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
                            if (logOutput) {
                            logOutput.appendChild(stderrDiv);
                        }
                            
                            // 保存到状态
                            trainingStatus.logs.push({
                                type: 'stderr',
                                content: line,
                                timestamp: Date.now()
                            });
                            hasNewLogs = true;
                        }
                    });
                }
                
                // 限制日志数量（保持最近1000条）
                if (trainingStatus.logs.length > 1000) {
                    trainingStatus.logs = trainingStatus.logs.slice(-800);
                }
                
                // 如果有新日志，保存状态
                if (hasNewLogs) {
                    trainingStatus.save();
                }
                
                // 自动滚动到底部
                if (logOutput) {
                logOutput.scrollTop = logOutput.scrollHeight;
                }
                
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
            
            // 如果是网络错误，更新状态为重连中
            const statusBadge = document.querySelector('.status-badge');
            if (statusBadge && trainingStatus.isTraining) {
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '重连中...';
            }
            
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollTrainingStatus, retryTime);
        });
}

// 更新训练完成状态
function updateTrainingComplete(data) {
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    // 更新状态管理 - 保留配置信息用于后续恢复
    trainingStatus.update({
        isTraining: false,
        status: 'completed',
        completedAt: Date.now()
    });
    
    if (trainingControls) {
    trainingControls.style.display = 'none';
    }
    
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
    statusBadge.className = 'status-badge completed';
    statusBadge.textContent = '已完成';
    }
    
    // 重新启用表单
    enableTrainingForm();
    
    console.log('训练已完成，状态已保存用于后续恢复');
}

// 更新训练停止状态
function updateTrainingStopped(data) {
    const trainingProgress = document.getElementById('trainingProgress');
    const trainingControls = document.querySelector('.training-controls');
    
    // 更新状态管理
    trainingStatus.update({
        isTraining: false,
        status: 'stopped'
    });
    
    if (trainingControls) {
    trainingControls.style.display = 'none';
    }
    
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
    statusBadge.className = 'status-badge stopped';
    statusBadge.textContent = '已停止';
    }
    
    // 重新启用表单
    enableTrainingForm();
    
    console.log('训练已停止');
}

// 重新启用训练表单
function enableTrainingForm() {
    const form = document.getElementById('trainingForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, button, textarea');
        inputs.forEach(input => {
            if (input.type !== 'button' || input.classList.contains('submit-btn') || input.classList.contains('reset-btn')) {
                input.disabled = false;
            }
        });
    }
}

// 停止训练
function stopTraining() {
    if (!trainingStatus.isTraining) return;
    
    if (!confirm('确定要停止训练吗？')) return;
    
    // 更新状态为停止中
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = 'status-badge running';
        statusBadge.textContent = '停止中...';
    }
    
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
                // 恢复状态
                if (statusBadge) {
                    statusBadge.className = 'status-badge running';
                    statusBadge.textContent = '正在运行';
                }
            }
        })
        .catch(error => {
            console.error('停止训练失败:', error);
            alert('停止训练失败，请重试\n' + error.message);
            // 恢复状态
            if (statusBadge) {
                statusBadge.className = 'status-badge running';
                statusBadge.textContent = '正在运行';
            }
        });
}

let currentPath = '/';
const modal = document.getElementById('fileBrowserModal');

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

// 更新数据集结构显示
function updateDatasetStructureDisplay(modelSeries) {
    const yoloStructure = document.getElementById('yolo-structure');
    const classificationStructure = document.getElementById('classification-structure');
    
    if (modelSeries === 'classification') {
        yoloStructure.style.display = 'none';
        classificationStructure.style.display = 'block';
    } else {
        yoloStructure.style.display = 'block';
        classificationStructure.style.display = 'none';
    }
} 