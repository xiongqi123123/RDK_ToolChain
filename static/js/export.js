
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

// 导出状态管理 - 使用通用状态管理工具
const exportStateManager = new PageStateManager('export');
const exportRestorer = new PageRestorer(
    exportStateManager,
    '/api/export-status',
    '/api/stop-export'
);

// 页面加载时恢复状态
document.addEventListener('DOMContentLoaded', function() {
    console.log('导出页面加载完成，开始初始化...');
    
    // 先恢复保存的状态
    exportStateManager.load();
    
    // 初始化页面
    initializeExportPage();
    
    // 检查服务器状态并恢复UI
    checkAndRestoreExportState();
});

// 初始化导出页面
function initializeExportPage() {
    console.log('开始初始化导出页面...');
    
    // 绑定模型选择事件
    const modelSeriesSelect = document.getElementById('modelSeries');
    if (modelSeriesSelect) {
        console.log('绑定导出页面modelSeries事件');
        modelSeriesSelect.onchange = function() {
            console.log('export modelSeries changed to:', this.value);
            // 先重置后续字段，再更新当前字段的选项
            resetExportFormFields(['modelTag', 'modelSize']);
            updateVersionOptions(this.value);
        };
    }
    
    const modelVersionSelect = document.getElementById('modelVersion');
    if (modelVersionSelect) {
        console.log('绑定导出页面modelVersion事件');
        modelVersionSelect.onchange = function() {
            console.log('export modelVersion changed to:', this.value);
            const modelSeries = document.getElementById('modelSeries').value;
            // 先重置后续字段，再更新当前字段的选项
            resetExportFormFields(['modelSize']);
            updateTagOptions(modelSeries, this.value);
        };
    }
    
    const modelTagSelect = document.getElementById('modelTag');
    if (modelTagSelect) {
        console.log('绑定导出页面modelTag事件');
        modelTagSelect.onchange = function() {
            console.log('export modelTag changed to:', this.value);
            const modelSeries = document.getElementById('modelSeries').value;
            const selectedVersion = document.getElementById('modelVersion').value;
            updateSizeOptions(modelSeries, selectedVersion, this.value);
        };
    }
    
    // 绑定文件浏览器按钮事件
    const browseBtn = document.querySelector('.browse-btn');
    if (browseBtn) {
        browseBtn.onclick = openFileBrowser;
        console.log('绑定导出页面浏览按钮事件');
    }
    
    // 绑定表单提交事件
    const exportForm = document.getElementById('exportForm');
    if (exportForm) {
        exportForm.onsubmit = handleExportFormSubmit;
        console.log('绑定导出页面表单提交事件');
    }
    
    console.log('导出页面初始化完成');
}

// 检查并恢复导出状态
async function checkAndRestoreExportState() {
    const result = await exportRestorer.checkAndRestore();
    
    if (result.shouldRestore) {
        if (result.serverStatus) {
            // 根据服务器状态恢复UI
            restoreExportUI(result.serverStatus);
            
            // 如果不是刚完成的任务，开始轮询
            if (!result.justCompleted) {
                setTimeout(pollExportStatus, 1000);
            }
        } else if (result.restoreCompleted) {
            // 恢复已完成的任务状态
            restoreCompletedExportUI();
        } else if (result.networkError) {
            // 网络错误，根据本地状态恢复
            restoreExportUIFromLocal();
            setTimeout(pollExportStatus, 5000);
        }
    }
    
    // 恢复表单状态
    restoreFormState();
}

// 根据服务器状态恢复导出UI
function restoreExportUI(serverStatus) {
    console.log('开始恢复导出UI...');
    
    // 禁用表单
    DOMUtils.toggleForm('#exportForm', true);
    
    // 显示导出状态区域
    const exportProgress = document.getElementById('exportProgress');
    const exportControls = document.querySelector('.export-controls');
    
    const statusHtml = `
        <div class="status-item">
            <h3>导出状态: <span class="status-badge running">正在导出</span></h3>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">0%</div>
        </div>
        <div class="status-item">
            <h3>导出日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#exportProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.export-controls', true);
    
    // 恢复日志内容
    const logs = exportStateManager.getState().logs;
    if (logs && logs.length > 0) {
        console.log('恢复导出日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('.log-output', logs);
    }
    
    console.log('导出UI恢复完成');
}

// 根据本地状态恢复UI（网络错误时使用）
function restoreExportUIFromLocal() {
    if (!exportStateManager.isRunning()) return;
    
    console.log('根据本地状态恢复导出UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>导出状态: <span class="status-badge running">尝试重连中...</span></h3>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">重连中...</div>
        </div>
        <div class="status-item">
            <h3>导出日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#exportProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.export-controls', true);
    
    // 恢复日志
    const logs = exportStateManager.getState().logs;
    if (logs && logs.length > 0) {
        DOMUtils.restoreLogsToContainer('.log-output', logs);
    }
}

// 恢复已完成的导出UI
function restoreCompletedExportUI() {
    const savedState = exportStateManager.getState();
    console.log('恢复已完成的导出任务UI...');
    
    const statusHtml = `
        <div class="status-item">
            <h3>导出状态: <span class="status-badge completed">已完成</span></h3>
            <p>导出已于: ${new Date(savedState.timestamp).toLocaleString()} 完成</p>
        </div>
        <div class="status-item">
            <h3>导出日志:</h3>
            <div class="log-output" id="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#exportProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.export-controls', false);
    
    // 恢复日志
    const logs = savedState.logs;
    if (logs && logs.length > 0) {
        console.log('恢复导出日志，共' + logs.length + '条');
        DOMUtils.restoreLogsToContainer('#log-output', logs);
    }
    
    console.log('已完成任务UI恢复完成');
}

// 恢复表单状态
function restoreFormState() {
    const savedConfig = exportStateManager.getState().config;
    if (savedConfig) {
        console.log('恢复导出表单状态:', savedConfig);
        
        // 字段名映射（后端字段名 -> 前端元素ID）
        const fieldMapping = {
            'model_path': 'modelPath',
            'export_format': 'exportFormat',
            'image_size': 'imageSize'
        };
        
        // 先恢复非级联选择字段
        Object.keys(savedConfig).forEach(key => {
            if (!['modelSeries', 'modelVersion', 'modelTag', 'modelSize'].includes(key)) {
                const elementId = fieldMapping[key] || key;
                const element = document.getElementById(elementId);
                if (element && savedConfig[key] !== undefined && savedConfig[key] !== null) {
                    element.value = savedConfig[key];
                    console.log(`恢复导出字段 ${key} -> ${elementId}: ${savedConfig[key]}`);
                }
            }
        });
        
        // 按顺序恢复级联选择字段
        restoreExportCascadeFields();
    }
}

// 恢复导出级联选择字段
function restoreExportCascadeFields() {
    const savedConfig = exportStateManager.getState().config;
    
    // 第一步：恢复模型系列
    if (savedConfig.modelSeries) {
        console.log('恢复导出模型系列:', savedConfig.modelSeries);
        const modelSeriesSelect = document.getElementById('modelSeries');
        if (modelSeriesSelect) {
            modelSeriesSelect.value = savedConfig.modelSeries;
            
            // 第二步：更新版本选项并恢复版本选择
            updateVersionOptions(savedConfig.modelSeries);
            
            if (savedConfig.modelVersion) {
                setTimeout(() => {
                    console.log('恢复导出模型版本:', savedConfig.modelVersion);
                    const modelVersionSelect = document.getElementById('modelVersion');
                    if (modelVersionSelect) {
                        modelVersionSelect.value = savedConfig.modelVersion;
                        
                        // 第三步：更新Tag选项并恢复Tag选择
                        updateTagOptions(savedConfig.modelSeries, savedConfig.modelVersion);
                        
                        if (savedConfig.modelTag) {
                            setTimeout(() => {
                                console.log('恢复导出模型Tag:', savedConfig.modelTag);
                                const modelTagSelect = document.getElementById('modelTag');
                                if (modelTagSelect) {
                                    modelTagSelect.value = savedConfig.modelTag;
                                    
                                    // 第四步：更新大小选项并恢复大小选择
                                    updateSizeOptions(savedConfig.modelSeries, savedConfig.modelVersion, savedConfig.modelTag);
                                    
                                    if (savedConfig.modelSize) {
                                        setTimeout(() => {
                                            console.log('恢复导出模型大小:', savedConfig.modelSize);
                                            const modelSizeSelect = document.getElementById('modelSize');
                                            if (modelSizeSelect) {
                                                modelSizeSelect.value = savedConfig.modelSize;
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

// 重置导出表单字段
function resetExportFormFields(fieldIds) {
    console.log('重置导出字段:', fieldIds);
    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field && field.tagName === 'SELECT') {
            let defaultText = '请选择';
            if (id === 'modelVersion') {
                defaultText = '请先选择模型系列';
            } else if (id === 'modelTag') {
                defaultText = '请先选择模型版本';
            } else if (id === 'modelSize') {
                defaultText = '请先选择模型Tag';
            }
            field.innerHTML = `<option value="">${defaultText}</option>`;
            console.log(`重置导出${id}字段，设置默认文本: ${defaultText}`);
        }
    });
}

// 处理导出表单提交
function handleExportFormSubmit(event) {
    event.preventDefault();
    
    if (exportStateManager.isRunning()) {
        alert('已有导出任务在运行中');
        return;
    }
    
    const formData = new FormData(event.target);
    const config = Object.fromEntries(formData.entries());
    
    // 保存配置到状态
    exportStateManager.update({
        config: config,
        logs: [] // 清空之前的日志
    });
    
    submitExportForm(formData);
}

// 提交导出表单
function submitExportForm(formData) {
    console.log('提交导出表单...');
    
    fetch('/model-export', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('导出启动成功');
            
            // 更新状态
            exportStateManager.update({
                isRunning: true,
                status: 'running'
            });
            
            // 更新UI
            showExportStarted(data.config);
            
            // 开始轮询状态
            setTimeout(pollExportStatus, 2000);
        } else {
            alert('启动导出失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('提交导出失败:', error);
        alert('提交导出失败: ' + error.message);
    });
}

// 显示导出开始状态
function showExportStarted(config) {
    // 禁用表单
    DOMUtils.toggleForm('#exportForm', true);

    const statusHtml = `
        <div class="status-item">
            <h3>导出状态: <span class="status-badge running">正在导出</span></h3>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%">0%</div>
        </div>
        <div class="status-item">
            <h3>导出配置:</h3>
            <pre>模型: ${config.model_info.series} ${config.model_info.version} ${config.model_info.tag} ${config.model_info.size}
模型路径: ${config.model_path}
导出格式: ${config.export_format}
图像尺寸: ${config.image_size}x${config.image_size}</pre>
        </div>
        <div class="status-item">
            <h3>导出日志:</h3>
            <div class="log-output"></div>
        </div>
    `;
    
    DOMUtils.updateElement('#exportProgress', statusHtml, true);
    DOMUtils.toggleDisplay('.export-controls', true);
}

// 更新版本选项
function updateVersionOptions(modelSeries) {
    console.log('导出页面 updateVersionOptions called with:', modelSeries);
    
    const versionSelect = document.getElementById('modelVersion');
    if (!versionSelect) {
        console.error('找不到导出页面modelVersion选择框');
        return;
    }
    
    const versions = modelConfigs[modelSeries]?.versions || [];
    console.log('导出页面找到的版本:', versions);
    
    versionSelect.innerHTML = '<option value="">请选择版本</option>';
    versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version.value;
        option.textContent = version.label;
        versionSelect.appendChild(option);
        console.log('导出页面添加版本选项:', version.label);
    });
    
    console.log('导出页面版本选项更新完成，总共添加了', versions.length, '个选项');
}

// 更新Tag选项
function updateTagOptions(modelSeries, selectedVersion) {
    console.log('导出页面 updateTagOptions called with:', modelSeries, selectedVersion);
    
    const tagSelect = document.getElementById('modelTag');
    if (!tagSelect) {
        console.error('找不到导出页面modelTag选择框');
        return;
    }
    
    // 根据选中的version找到对应的配置
    const versionConfig = modelConfigs[modelSeries]?.versions.find(v => v.value === selectedVersion);
    const tags = versionConfig?.tags || [];
    console.log('导出页面找到的Tag:', tags);
    
    tagSelect.innerHTML = '<option value="">请选择模型Tag</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.value;
        option.textContent = tag.label;
        tagSelect.appendChild(option);
        console.log('导出页面添加Tag选项:', tag.label);
    });
    
    console.log('导出页面Tag选项更新完成，总共添加了', tags.length, '个选项');
}

// 更新大小选项
function updateSizeOptions(modelSeries, selectedVersion, selectedTag) {
    console.log('导出页面 updateSizeOptions called with:', modelSeries, selectedVersion, selectedTag);
    
    const sizeSelect = document.getElementById('modelSize');
    if (!sizeSelect) {
        console.error('找不到导出页面modelSize选择框');
        return;
    }
    
    // 根据选中的version和tag找到对应的配置
    const versionConfig = modelConfigs[modelSeries]?.versions.find(v => v.value === selectedVersion);
    const tagConfig = versionConfig?.tags.find(t => t.value === selectedTag);
    const sizes = tagConfig?.sizes || [];
    console.log('导出页面找到的Size:', sizes);
    
    sizeSelect.innerHTML = '<option value="">请选择大小</option>';
    sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size.value;
        option.textContent = size.label;
        sizeSelect.appendChild(option);
        console.log('导出页面添加Size选项:', size.label);
    });
    
    console.log('导出页面Size选项更新完成，总共添加了', sizes.length, '个选项');
}

// 轮询导出状态
function pollExportStatus() {
    if (!exportStateManager.isRunning()) return;
    
    fetch('/api/export-status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('收到导出状态数据:', data);
            
            if (data.status === 'running') {
                // 更新状态标签
                DOMUtils.updateClass('.status-badge', 'status-badge running');
                DOMUtils.updateElement('.status-badge', '正在导出');
                
                // 更新进度条
                if (data.progress !== undefined) {
                    const progressBar = DOMUtils.getElement('.progress-bar');
                    if (progressBar) {
                        progressBar.style.width = `${data.progress}%`;
                        progressBar.textContent = `${data.progress.toFixed(1)}%`;
                    }
                }
                
                // 更新日志并保存到状态
                let hasNewLogs = false;
                
                if (data.stdout) {
                    const lines = data.stdout.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            DOMUtils.addLogToContainer('.log-output', 'stdout', line);
                            exportStateManager.addLog('stdout', line);
                            hasNewLogs = true;
                        }
                    });
                }
                
                if (data.stderr) {
                    const lines = data.stderr.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            DOMUtils.addLogToContainer('.log-output', 'stderr', line);
                            exportStateManager.addLog('stderr', line);
                            hasNewLogs = true;
                        }
                    });
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
            
            // 如果是网络错误，更新状态为重连中
            DOMUtils.updateClass('.status-badge', 'status-badge running');
            DOMUtils.updateElement('.status-badge', '重连中...');
            
            const retryTime = error.message.includes('404') ? 5000 : 1000;
            setTimeout(pollExportStatus, retryTime);
        });
}

// 更新导出完成状态
function updateExportComplete(data) {
    // 更新状态管理
    exportStateManager.update({
        isRunning: false,
        status: 'completed'
    });
    
    DOMUtils.toggleDisplay('.export-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge completed');
    DOMUtils.updateElement('.status-badge', '已完成');
    
    // 重新启用表单
    DOMUtils.toggleForm('#exportForm', false);
    
    console.log('导出已完成');
}

// 更新导出停止状态
function updateExportStopped(data) {
    // 更新状态管理
    exportStateManager.update({
        isRunning: false,
        status: 'stopped'
    });
    
    DOMUtils.toggleDisplay('.export-controls', false);
    DOMUtils.updateClass('.status-badge', 'status-badge stopped');
    DOMUtils.updateElement('.status-badge', '已停止');
    
    // 重新启用表单
    DOMUtils.toggleForm('#exportForm', false);
    
    console.log('导出已停止');
}

// 停止导出
async function stopExport() {
    const result = await exportRestorer.stopTask('确定要停止导出吗？');
    
    if (result.success) {
        updateExportStopped(result.data);
    } else {
        alert('停止导出失败: ' + result.error);
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
                file_pattern: '*.pt, *.pth'
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
