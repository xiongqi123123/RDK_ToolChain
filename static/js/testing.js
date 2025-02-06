// 全局变量
let currentBrowserTarget = null;
let currentPath = '/';
let socket = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeWebSocket();
    initializeFileBrowser();
    initializeForm();
});

// 初始化WebSocket连接
function initializeWebSocket() {
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    
    socket.on('testing_progress', function(data) {
        updateTestingProgress(data);
    });
    
    socket.on('testing_complete', function(data) {
        updateTestingComplete(data);
    });
    
    socket.on('testing_error', function(data) {
        showError(data.error);
    });
}

// 初始化文件浏览器
function initializeFileBrowser() {
    const modal = document.getElementById('fileBrowserModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = closeFileBrowser;
    
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

// 打开模型文件浏览器
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
        if (currentBrowserTarget === 'model' && !item.name.endsWith('.bin')) {
            showError('请选择.bin格式的模型文件');
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
    const modelPath = document.getElementById('modelPath').value;
    const imagePath = document.getElementById('imagePath').value;
    
    if (!modelPath || !imagePath) {
        showError('请选择模型文件和测试图片');
        return;
    }
    
    // 显示测试控制按钮
    document.querySelector('.testing-controls').style.display = 'block';
    // 隐藏之前的测试结果
    document.getElementById('testResult').style.display = 'none';
    
    // 发送测试请求
    fetch('/start_testing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model_path: modelPath,
            image_path: imagePath
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
        } else {
            updateTestingProgress({ status: '测试已开始', progress: 0 });
        }
    })
    .catch(error => {
        console.error('Error starting testing:', error);
        showError('启动测试失败');
    });
}

// 停止测试
function stopTesting() {
    fetch('/stop_testing', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            } else {
                updateTestingProgress({ status: '测试已停止', progress: 0 });
                document.querySelector('.testing-controls').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error stopping testing:', error);
            showError('停止测试失败');
        });
}

// 更新测试进度
function updateTestingProgress(data) {
    const progressDiv = document.getElementById('testingProgress');
    progressDiv.innerHTML = `
        <div class="status-message">${data.status}</div>
        ${data.progress ? `<div class="progress-bar">
            <div class="progress" style="width: ${data.progress}%"></div>
        </div>` : ''}
    `;
}

// 更新测试完成状态
function updateTestingComplete(data) {
    // 隐藏测试控制按钮
    document.querySelector('.testing-controls').style.display = 'none';
    
    // 显示测试结果
    const resultDiv = document.getElementById('testResult');
    resultDiv.style.display = 'block';
    
    // 更新图片
    if (data.original_image) {
        document.getElementById('originalImage').src = data.original_image;
    }
    if (data.processed_image) {
        document.getElementById('processedImage').src = data.processed_image;
    }
    
    // 更新检测信息
    if (data.detection_info) {
        document.getElementById('detectionInfo').innerHTML = data.detection_info;
    }
}

// 显示错误信息
function showError(message) {
    const progressDiv = document.getElementById('testingProgress');
    progressDiv.innerHTML = `<div class="error-message">${message}</div>`;
}
