// 模型配置数据
const modelConfigs = {
    resnet: {
        versions: [
            { value: "18", label: "ResNet-18" },
            { value: "34", label: "ResNet-34" },
            { value: "50", label: "ResNet-50" },
            { value: "101", label: "ResNet-101" },
            { value: "152", label: "ResNet-152" }
        ],
        sizes: [
            { value: "224", label: "224x224" },
            { value: "384", label: "384x384" },
            { value: "448", label: "448x448" }
        ]
    },
    yolo: {
        versions: [
            { value: "v2", label: "YOLOv2" },
            { value: "v3", label: "YOLOv3" },
            { value: "v4", label: "YOLOv4" },
            { value: "v5", label: "YOLOv5" },
            { value: "v6", label: "YOLOv6" },
            { value: "v7", label: "YOLOv7" },
            { value: "v8", label: "YOLOv8" }
        ],
        sizes: [
            { value: "tiny", label: "Tiny (最小)" },
            { value: "small", label: "Small (小型)" },
            { value: "medium", label: "Medium (中型)" },
            { value: "large", label: "Large (大型)" },
            { value: "xlarge", label: "XLarge (超大)" }
        ]
    },
    vgg: {
        versions: [
            { value: "11", label: "VGG-11" },
            { value: "13", label: "VGG-13" },
            { value: "16", label: "VGG-16" },
            { value: "19", label: "VGG-19" }
        ],
        sizes: [
            { value: "224", label: "224x224" },
            { value: "384", label: "384x384" }
        ]
    },
    mobilenet: {
        versions: [
            { value: "v1", label: "MobileNet V1" },
            { value: "v2", label: "MobileNet V2" },
            { value: "v3", label: "MobileNet V3" }
        ],
        sizes: [
            { value: "small", label: "Small (小型)" },
            { value: "medium", label: "Medium (中型)" },
            { value: "large", label: "Large (大型)" }
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

// 更新大小选项
function updateSizeOptions(modelSeries) {
    const sizeSelect = document.getElementById('modelSize');
    const sizes = modelConfigs[modelSeries]?.sizes || [];
    
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
    // 创建隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip,.tar,.gz';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // 模型系列选择事件
    const modelSeriesSelect = document.getElementById('modelSeries');
    modelSeriesSelect.addEventListener('change', (e) => {
        const selectedSeries = e.target.value;
        updateVersionOptions(selectedSeries);
        updateSizeOptions(selectedSeries);
        
        // 重置版本和大小选择
        document.getElementById('modelVersion').value = '';
        document.getElementById('modelSize').value = '';
    });

    // 浏览按钮点击事件
    const browseBtn = document.querySelector('.browse-btn');
    const datasetPathInput = document.getElementById('datasetPath');

    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择改变事件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            datasetPathInput.value = file.path || file.name;
        }
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

// 更新训练状态
function updateTrainingStatus(data) {
    const trainingProgress = document.getElementById('trainingProgress');
    
    // 创建或更新状态显示
    trainingProgress.innerHTML = `
        <div class="status-item">
            <h3>训练配置</h3>
            <pre>${JSON.stringify(data.config, null, 2)}</pre>
        </div>
        <div class="status-item">
            <h3>状态</h3>
            <p>${data.message}</p>
        </div>
    `;
} 