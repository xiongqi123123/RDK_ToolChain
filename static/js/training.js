// 模型配置数据
const modelConfigs = {
    yolo: {
        versions: [
            { value: "v5", label: "YOLOv5" },
            { value: "v8", label: "YOLOv8" },
            { value: "v11", label: "YOLO11"}
        ],
        tag: [
            { value: "v2.0", label: "Yolov5-V2.0" },
        ],

        sizes: [
            { value: "s", label: "s" },
            { value: "n", label: "n" },
            { value: "m", label: "m" },
            { value: "l", label: "l" },
            { value: "x", label: "x" }
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

function updateTagOption(modelSeries){
    const tagSelect = document.getElementById('modelTag');
    const tags = modelConfigs[modelSeries]?.tag || [];
    
    tagSelect.innerHTML = '<option value="">请选择模型Tag</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.value;
        option.textContent = tag.label;
        tagSelect.appendChild(option);
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
    // 模型系列选择事件
    const modelSeriesSelect = document.getElementById('modelSeries');
    modelSeriesSelect.addEventListener('change', (e) => {
        const selectedSeries = e.target.value;
        updateVersionOptions(selectedSeries);
        updateTagOption(selectedSeries);
        updateSizeOptions(selectedSeries);
        
        // 重置版本和大小选择
        document.getElementById('modelVersion').value = '';
        document.getElementById('modelTag').value = '';
        document.getElementById('modelSize').value = '';
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