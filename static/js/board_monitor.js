// 开发板监控小组件
class BoardMonitorWidget {
    constructor() {
        this.widget = null;
        this.isMinimized = true;
        this.isConnected = false;
        this.statusInterval = null;
        this.connectionSettings = {
            ip: '',
            username: '',
            password: '',
            port: 22
        };
        
        this.init();
    }
    
    init() {
        this.createWidget();
        this.bindEvents();
        this.loadSettings();
        // 检查服务器端的连接状态
        this.checkServerConnectionStatus();
    }
    
    createWidget() {
        // 创建浮窗HTML结构
        const widgetHTML = `
            <div class="board-monitor-widget minimized" id="boardMonitorWidget">
                <div class="monitor-header" onclick="boardMonitor.toggleMinimize()" style="cursor: pointer;">
                    <div class="monitor-title">
                        <i class="fas fa-microchip"></i>
                        <span>开发板监控</span>
                        <div class="connection-status disconnected" id="connectionStatus"></div>
                    </div>
                </div>
                
                <!-- 设备信息栏 -->
                <div class="device-info-bar" id="deviceInfoBar" style="display: none;">
                    <span class="device-name-top" id="deviceNameTop">-</span>
                    <div class="device-info-right">
                        <span class="device-ip-top" id="deviceIPTop">-</span>
                        <button class="disconnect-btn-small" onclick="boardMonitor.disconnect()" id="disconnectBtnSmall" title="断开连接">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="monitor-content" id="monitorContent">
                    <!-- 连接表单 -->
                    <div class="connection-form" id="connectionForm">
                        <div class="form-row">
                            <div class="form-group-mini">
                                <label>IP地址</label>
                                <input type="text" id="boardIP" placeholder="192.168.1.100" value="">
                                <small style="font-size: 10px; color: #666;">WSL用户可使用 172.18.64.1 + 端口代理</small>
                            </div>
                            <div class="form-group-mini" style="flex: 0 0 80px;">
                                <label>端口</label>
                                <input type="number" id="boardPort" placeholder="22" value="22">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group-mini">
                                <label>用户名</label>
                                <input type="text" id="boardUsername" placeholder="root" value="">
                            </div>
                            <div class="form-group-mini">
                                <label>密码</label>
                                <input type="password" id="boardPassword" placeholder="password" value="">
                            </div>
                        </div>
                        <div class="connect-actions">
                            <button class="connect-btn" onclick="boardMonitor.testConnection()" id="testBtn" style="margin-bottom: 5px;">
                                <i class="fas fa-satellite-dish"></i> 测试连接
                            </button>
                            <button class="connect-btn" onclick="boardMonitor.connect()" id="connectBtn">
                                <i class="fas fa-plug"></i> 连接
                            </button>
                            <button class="disconnect-btn" onclick="boardMonitor.disconnect()" id="disconnectBtn" style="display: none;">
                                <i class="fas fa-unlink"></i> 断开
                            </button>
                        </div>
                    </div>
                    
                    <!-- 状态消息 -->
                    <div class="status-message hidden" id="statusMessage"></div>
                    
                    <!-- 状态显示区域 -->
                    <div class="status-display hidden" id="statusDisplay">

                        
                        <!-- 监控指标 -->
                        <div class="monitor-metrics" id="monitorMetrics">
                            <!-- 内容将根据设备类型动态生成 -->
                        </div>
                        
                        <div class="last-update">
                            最后更新: <span id="lastUpdateTime">-</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        this.widget = document.getElementById('boardMonitorWidget');
    }
    
    bindEvents() {
        // 绑定回车键连接
        const inputs = ['boardIP', 'boardUsername', 'boardPassword', 'boardPort'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.connect();
                }
            });
        });
    }
    
    toggleMinimize() {
        const widget = document.getElementById('boardMonitorWidget');
        const content = document.getElementById('monitorContent');
        
        if (this.isMinimized) {
            // 展开
            widget.classList.remove('minimized');
            widget.classList.add('maximized');
            content.style.display = 'block';
            this.isMinimized = false;
        } else {
            // 最小化
            widget.classList.remove('maximized');
            widget.classList.add('minimized');
            content.style.display = 'none';
            this.isMinimized = true;
        }
    }
    
    async testConnection() {
        const ip = document.getElementById('boardIP').value.trim();
        const port = parseInt(document.getElementById('boardPort').value) || 22;
        
        if (!ip) {
            this.showMessage('请填写IP地址', 'error');
            return;
        }
        
        const testBtn = document.getElementById('testBtn');
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';
        this.showMessage('正在测试网络连通性...', 'info');
        
        try {
            // 使用一个简单的网络测试API
            const response = await fetch('/api/board-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ip: ip,
                    username: 'test',  // 临时用户名
                    password: 'test',  // 临时密码
                    port: port,
                    test_only: true    // 标记为仅测试连通性
                })
            });
            
            if (response.status === 400) {
                // 如果返回400，说明至少网络是通的，只是认证失败
                this.showMessage(`网络连通性正常 (${ip}:${port})`, 'success');
            } else {
                const result = await response.json();
                if (result.message && result.message.includes('网络')) {
                    this.showMessage(result.message, 'error');
                } else {
                    this.showMessage(`网络连通性正常 (${ip}:${port})`, 'success');
                }
            }
        } catch (error) {
            this.showMessage('网络连接失败: ' + error.message, 'error');
        }
        
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-satellite-dish"></i> 测试连接';
    }
    
    async connect() {
        const ip = document.getElementById('boardIP').value.trim();
        const username = document.getElementById('boardUsername').value.trim();
        const password = document.getElementById('boardPassword').value.trim();
        const port = parseInt(document.getElementById('boardPort').value) || 22;
        
        if (!ip || !username || !password) {
            this.showMessage('请填写完整的连接信息', 'error');
            return;
        }
        
        this.showMessage('正在连接...', 'info');
        this.setConnectionStatus('connecting');
        this.setConnectButtonState(true);
        
        try {
            console.log('发送连接请求到:', '/api/board-connect');
            console.log('连接参数:', { ip, username, port });
            
            // 设置连接超时控制器 - 增加超时时间适应WSL环境
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
            
            const response = await fetch('/api/board-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ip: ip,
                    username: username,
                    password: password,
                    port: port
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('响应状态:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('连接结果:', result);
            
            if (result.status === 'success') {
                this.isConnected = true;
                this.connectionSettings = { ip, username, password, port };
                this.setConnectionStatus('connected');
                this.showMessage(result.message, 'success');
                this.showConnectionForm(false);
                this.showStatusDisplay(true);
                // 显示设备信息栏
                this.showDeviceInfoBar(result.board_info);
                // 根据设备类型生成监控布局
                this.generateMonitorLayout(result.board_info);
                this.saveSettings();
                this.startStatusMonitoring();
            } else {
                this.setConnectionStatus('disconnected');
                this.showMessage(result.message || '连接失败', 'error');
            }
        } catch (error) {
            console.error('连接错误:', error);
            this.setConnectionStatus('disconnected');
            
            let errorMessage = '连接失败: ';
            if (error.name === 'AbortError') {
                errorMessage += '连接超时，请检查网络或增加超时时间';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += '网络请求失败，请检查服务器状态';
            } else {
                errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        }
        
        this.setConnectButtonState(false);
    }
    
    async disconnect(serverDisconnect = true) {
        if (serverDisconnect) {
            try {
                await fetch('/api/board-disconnect', {
                    method: 'POST'
                });
            } catch (error) {
                console.error('断开连接请求失败:', error);
            }
        }
        
        this.isConnected = false;
        this.setConnectionStatus('disconnected');
        this.showMessage(serverDisconnect ? '已断开连接' : '已停止监控', 'info');
        this.showConnectionForm(true);
        this.showStatusDisplay(false);
        this.hideDeviceInfoBar();
        this.stopStatusMonitoring();
    }
    
    startStatusMonitoring() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        
        // 立即获取一次状态
        this.updateStatus();
        
        // 每3秒更新一次状态
        this.statusInterval = setInterval(() => {
            this.updateStatus();
        }, 3000);
    }
    
    stopStatusMonitoring() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }
    
    async updateStatus() {
        if (!this.isConnected) return;
        
        try {
            const response = await fetch('/api/board-status');
            const result = await response.json();
            
            if (result.status === 'connected' && result.data) {
                this.displayStatus(result.data);
                this.updateLastUpdateTime();
            } else if (result.status === 'disconnected') {
                this.disconnect();
            } else if (result.status === 'error') {
                this.showMessage(result.message, 'error');
                // 如果有上次的数据，继续显示
                if (result.last_data) {
                    this.displayStatus(result.last_data);
                }
            }
        } catch (error) {
            console.error('获取状态失败:', error);
            this.showMessage('获取状态失败: ' + error.message, 'error');
        }
    }
    
    displayStatus(data) {
        // 更新CPU使用率
        if (data.cpu !== undefined) {
            const cpuElement = document.getElementById('cpuValue');
            if (cpuElement) {
                cpuElement.textContent = data.cpu.toFixed(1);
            }
        }
        
        // 更新BPU使用率
        if (data.bpu !== undefined) {
            const bpuElement = document.getElementById('bpuValue');
            if (bpuElement) {
                if (typeof data.bpu === 'object') {
                    // 新的BPU数据格式，显示平均值
                    bpuElement.textContent = data.bpu.average.toFixed(1);
                } else {
                    // 兼容旧格式
                    bpuElement.textContent = data.bpu.toFixed(1);
                }
            }
        } else {
            const bpuElement = document.getElementById('bpuValue');
            if (bpuElement) {
                bpuElement.textContent = 'N/A';
            }
        }
        
        // 更新温度（仅在无GPU设备中显示）
        if (data.temperature !== undefined) {
            const tempElement = document.getElementById('tempValue');
            if (tempElement) {
                tempElement.textContent = data.temperature.toFixed(1);
                
                // 根据温度改变颜色
                if (data.temperature > 80) {
                    tempElement.style.color = '#f44336';
                } else if (data.temperature > 60) {
                    tempElement.style.color = '#FF9800';
                } else {
                    tempElement.style.color = '#FF5722';
                }
            }
        }
        
        // 更新GPU使用率（仅在有GPU设备中显示）
        if (data.bpu && typeof data.bpu === 'object' && data.bpu.gpu !== undefined) {
            const gpuElement = document.getElementById('gpuValue');
            if (gpuElement) {
                gpuElement.textContent = data.bpu.gpu.toFixed(1);
            }
        }
        
        // 更新内存信息
        if (data.memory) {
            const memoryElement = document.getElementById('memoryValue');
            if (memoryElement) {
                memoryElement.textContent = data.memory.usage_percent.toFixed(1);
            }
        }
    }
    
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('lastUpdateTime').textContent = timeString;
    }
    
    setConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = `connection-status ${status}`;
    }
    
    setConnectButtonState(disabled) {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        
        if (disabled) {
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 连接中...';
        } else {
            connectBtn.disabled = false;
            connectBtn.innerHTML = '<i class="fas fa-plug"></i> 连接';
        }
        
        if (this.isConnected) {
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';
        } else {
            connectBtn.style.display = 'block';
            disconnectBtn.style.display = 'none';
        }
    }
    
    showMessage(message, type) {
        const messageElement = document.getElementById('statusMessage');
        messageElement.textContent = message;
        messageElement.className = `status-message ${type}`;
        messageElement.classList.remove('hidden');
        
        // 3秒后自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                messageElement.classList.add('hidden');
            }, 3000);
        }
    }
    
    showConnectionForm(show) {
        const form = document.getElementById('connectionForm');
        if (show) {
            form.classList.remove('hidden');
        } else {
            form.classList.add('hidden');
        }
    }
    
    showStatusDisplay(show) {
        const display = document.getElementById('statusDisplay');
        if (show) {
            display.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
        }
    }
    

    
    showDeviceInfoBar(boardInfo) {
        const deviceInfoBar = document.getElementById('deviceInfoBar');
        const deviceNameTop = document.getElementById('deviceNameTop');
        const deviceIPTop = document.getElementById('deviceIPTop');
        
        if (boardInfo && boardInfo.device_display_name) {
            deviceNameTop.textContent = boardInfo.device_display_name;
        } else {
            deviceNameTop.textContent = '未知设备';
        }
        
        deviceIPTop.textContent = this.connectionSettings.ip;
        deviceInfoBar.style.display = 'flex';
    }
    
    hideDeviceInfoBar() {
        const deviceInfoBar = document.getElementById('deviceInfoBar');
        deviceInfoBar.style.display = 'none';
    }
    
    generateMonitorLayout(boardInfo) {
        const metricsContainer = document.getElementById('monitorMetrics');
        
        // 判断设备类型
        const deviceName = boardInfo.device_display_name || '';
        const hasGPU = deviceName.includes('X5') || deviceName.includes('S100');
        
        let html = '';
        
        if (hasGPU) {
            // X5/S100 等有GPU的设备：第一行CPU+GPU，第二行BPU+内存
            html = `
                <!-- 第一行 -->
                <div class="metric-card cpu">
                    <div class="metric-label">CPU使用率</div>
                    <div class="metric-value" id="cpuValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
                
                <div class="metric-card gpu">
                    <div class="metric-label">GPU使用率</div>
                    <div class="metric-value" id="gpuValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
                
                <!-- 第二行 -->
                <div class="metric-card bpu">
                    <div class="metric-label">BPU使用率</div>
                    <div class="metric-value" id="bpuValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
                
                <div class="metric-card memory">
                    <div class="metric-label">内存使用率</div>
                    <div class="metric-value" id="memoryValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
            `;
        } else {
            // X3/Ultra 等无GPU的设备：第一行CPU+温度，第二行BPU+内存
            html = `
                <!-- 第一行 -->
                <div class="metric-card cpu">
                    <div class="metric-label">CPU使用率</div>
                    <div class="metric-value" id="cpuValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
                
                <div class="metric-card temperature">
                    <div class="metric-label">CPU温度</div>
                    <div class="metric-value" id="tempValue">-</div>
                    <div class="metric-unit">°C</div>
                </div>
                
                <!-- 第二行 -->
                <div class="metric-card bpu">
                    <div class="metric-label">BPU使用率</div>
                    <div class="metric-value" id="bpuValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
                
                <div class="metric-card memory">
                    <div class="metric-label">内存使用率</div>
                    <div class="metric-value" id="memoryValue">-</div>
                    <div class="metric-unit">%</div>
                </div>
            `;
        }
        
        metricsContainer.innerHTML = html;
    }
    
    saveSettings() {
        // 保存连接设置到localStorage（不保存密码）
        const settings = {
            ip: this.connectionSettings.ip,
            username: this.connectionSettings.username,
            port: this.connectionSettings.port
        };
        localStorage.setItem('boardMonitorSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        // 从localStorage加载设置
        try {
            const saved = localStorage.getItem('boardMonitorSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                document.getElementById('boardIP').value = settings.ip || '';
                document.getElementById('boardUsername').value = settings.username || '';
                document.getElementById('boardPort').value = settings.port || 22;
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
    
    async checkServerConnectionStatus() {
        try {
            console.log('检查服务器端连接状态...');
            const response = await fetch('/api/board-connection-info');
            const result = await response.json();
            
            if (result.status === 'connected') {
                console.log('发现服务器端已连接，恢复连接状态');
                this.isConnected = true;
                this.connectionSettings = result.connection_info;
                this.setConnectionStatus('connected');
                // 静默恢复，不显示提示消息
                this.showConnectionForm(false);
                this.showStatusDisplay(true);
                
                // 恢复表单数据
                if (result.connection_info) {
                    document.getElementById('boardIP').value = result.connection_info.ip || '';
                    document.getElementById('boardUsername').value = result.connection_info.username || '';
                    document.getElementById('boardPort').value = result.connection_info.port || 22;
                    // 密码不显示，保持为空
                    document.getElementById('boardPassword').value = '';
                }
                
                // 显示设备信息栏并生成布局
                if (result.board_info) {
                    this.showDeviceInfoBar(result.board_info);
                    this.generateMonitorLayout(result.board_info);
                }
                
                // 开始监控
                this.startStatusMonitoring();
            } else {
                console.log('服务器端未连接');
                this.setConnectionStatus('disconnected');
            }
        } catch (error) {
            console.error('检查服务器连接状态失败:', error);
            this.setConnectionStatus('disconnected');
        }
    }

    // 页面卸载时清理资源（不断开服务器连接，保持全局状态）
    cleanup() {
        this.stopStatusMonitoring();
        // 不调用disconnect，保持服务器端连接状态
    }
}

// 全局实例
let boardMonitor;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    boardMonitor = new BoardMonitorWidget();
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (boardMonitor) {
        boardMonitor.cleanup();
    }
}); 