// 全局变量
let isDetecting = false;
let isRemoving = false;
let pollTimer = null;

// 开始检测
function startDetect() {
    const modelPath = document.getElementById('modelPath').value;
    if (!modelPath) {
        alert('请选择模型文件');
        return;
    }

    const formData = new FormData();
    formData.append('modelPath', modelPath);

    // 发送检测请求
    fetch('/start-delete-detect', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            isDetecting = true;
            document.querySelector('.delete-controls').style.display = 'block';
            startPolling();
        } else {
            alert('检测启动失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('检测启动失败');
    });
}

// 开始移除
function startRemove() {
    const modelPath = document.getElementById('modelPath').value;
    const selectedNodes = [];
    
    // 获取选中的节点
    document.querySelectorAll('.node-checkbox:checked').forEach(checkbox => {
        selectedNodes.push(checkbox.value);
    });

    if (selectedNodes.length === 0) {
        alert('请选择要移除的节点');
        return;
    }

    const formData = new FormData();
    formData.append('modelPath', modelPath);
    selectedNodes.forEach(node => {
        formData.append('nodesToRemove', node);
    });

    // 发送移除请求
    fetch('/start-delete-remove', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            isRemoving = true;
            document.querySelector('.delete-controls').style.display = 'block';
            startPolling();
        } else {
            alert('移除启动失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('移除启动失败');
    });
}

// 停止进程
function stopProcess() {
    fetch('/stop-delete', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            stopPolling();
            document.querySelector('.delete-controls').style.display = 'none';
        } else {
            alert('停止失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('停止失败');
    });
}

// 开始轮询状态
function startPolling() {
    if (pollTimer) return;
    
    pollTimer = setInterval(() => {
        fetch('/delete-status')
            .then(response => response.json())
            .then(data => updateStatus(data))
            .catch(error => console.error('Error:', error));
    }, 1000);
}

// 停止轮询
function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    isDetecting = false;
    isRemoving = false;
}

// 更新状态显示
function updateStatus(data) {
    const progressDiv = document.getElementById('deleteProgress');
    const nodeSelectionDiv = document.getElementById('nodeSelection');
    const nodeListDiv = document.querySelector('.node-list');
    
    // 更新状态显示
    let statusHtml = `<div class="status-item">
        <h3>状态: ${data.status}</h3>
        <pre class="log-output">`;
    
    if (data.stdout) {
        statusHtml += `<div class="stdout">${data.stdout}</div>`;
    }
    if (data.stderr) {
        statusHtml += `<div class="stderr">${data.stderr}</div>`;
    }
    if (data.error) {
        statusHtml += `<div class="error-message">${data.error}</div>`;
    }
    statusHtml += '</pre></div>';
    
    progressDiv.innerHTML = statusHtml;

    // 如果检测完成，显示节点选择区域
    if (isDetecting && data.status === 'completed' && data.nodes && data.nodes.length > 0) {
        nodeSelectionDiv.style.display = 'block';
        let nodesHtml = '';
        data.nodes.forEach((node, index) => {
            nodesHtml += `
                <div class="node-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <label>
                        <input type="checkbox" class="node-checkbox" value="${node.name}" style="margin-right: 10px;">
                        <strong>输出:</strong> ${node.output}<br>
                        <strong>名称:</strong> ${node.name}
                    </label>
                </div>`;
        });
        nodeListDiv.innerHTML = nodesHtml;
        isDetecting = false;
        stopPolling();
    }

    // 如果移除完成，更新界面状态
    if (isRemoving && data.status === 'completed') {
        nodeSelectionDiv.style.display = 'none';
        isRemoving = false;
        stopPolling();
    }

    // 如果发生错误，停止轮询
    if (data.status === 'error') {
        stopPolling();
    }
}

// 全选/取消全选
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.node-checkbox');
    const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
    checkboxes.forEach(cb => cb.checked = anyUnchecked);
}

// 文件浏览器相关函数
function openFileBrowser() {
    document.getElementById('fileBrowserModal').style.display = 'block';
    loadDirectory('/');
}

function closeFileBrowser() {
    document.getElementById('fileBrowserModal').style.display = 'none';
}

function navigateUp() {
    const currentPath = document.getElementById('currentPath').textContent;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
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
        if (data.status === 'success') {
            updateFileList(data);
        } else {
            console.error('Failed to load directory:', data.error);
        }
    } catch (error) {
        console.error('Error loading directory:', error);
    }
}

function updateFileList(data) {
    document.getElementById('currentPath').textContent = data.current_path;
    
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = `file-item ${item.type}`;
        div.innerHTML = `<i class="fas fa-${item.type === 'directory' ? 'folder' : 'file'}"></i> ${item.name}`;
        div.onclick = () => {
            if (item.type === 'directory') {
                loadDirectory(item.path);
            } else {
                selectFile(item.path);
            }
        };
        fileList.appendChild(div);
    });
}

function selectFile(filePath) {
    document.getElementById('modelPath').value = filePath;
    closeFileBrowser();
}
