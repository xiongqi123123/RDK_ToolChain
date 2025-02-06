function updateDetectionComplete(data) {
    const statusDiv = document.getElementById('detectionStatus');
    statusDiv.innerHTML = '<div class="alert alert-success">检测已完成</div>';
    
    // 显示性能分析图片
    if (data.perf_image) {
        const imageContainer = document.getElementById('performanceAnalysis');
        imageContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = `/perf_image/${data.perf_image}`;
        img.className = 'img-fluid';
        img.alt = '性能分析图';
        imageContainer.appendChild(img);
    }
    
    // 显示输出日志
    if (data.stdout) {
        const outputDiv = document.getElementById('outputLog');
        outputDiv.innerHTML = `<pre>${data.stdout}</pre>`;
    }
} 