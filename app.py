from flask import Flask, render_template, request, jsonify
import torch
import os
from pathlib import Path

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect-device')
def detect_device():
    # 检测是否有可用的CUDA设备
    gpu_available = torch.cuda.is_available()
    cuda_device_count = torch.cuda.device_count() if gpu_available else 0
    
    # 获取GPU信息
    gpu_info = []
    if gpu_available:
        for i in range(cuda_device_count):
            gpu_info.append({
                'index': i,
                'name': torch.cuda.get_device_name(i),
                'memory': torch.cuda.get_device_properties(i).total_memory
            })
    
    return jsonify({
        'gpu_available': gpu_available,
        'default_device': 'gpu' if gpu_available else 'cpu',
        'gpu_count': cuda_device_count,
        'gpu_info': gpu_info
    })

@app.route('/model-training', methods=['GET', 'POST'])
def model_training():
    if request.method == 'POST':
        # 获取表单数据
        training_config = {
            'model_series': request.form.get('modelSeries'),
            'model_version': request.form.get('modelVersion'),
            'model_size': request.form.get('modelSize'),
            'device': request.form.get('device'),
            'dataset_path': request.form.get('datasetPath'),
            'epochs': int(request.form.get('epochs')),
            'batch_size': int(request.form.get('batchSize')),
            'num_classes': int(request.form.get('numClasses')),
            'labels': request.form.get('labels').split('\n')
        }
        print(training_config)
        # 验证数据集路径
        if not os.path.exists(training_config['dataset_path']):
            return jsonify({
                'status': 'error',
                'message': '数据集路径不存在',
                'config': training_config
            }), 400
        # 这里可以添加实际的训练逻辑
        return jsonify({
            'status': 'success',
            'message': '训练配置已接收，即将开始训练',
            'config': training_config
        })
    
    return render_template('model_training.html')

@app.route('/model-quantization')
def model_quantization():
    return render_template('model_quantization.html')

@app.route('/model-conversion')
def model_conversion():
    return render_template('model_conversion.html')

@app.route('/model-testing')
def model_testing():
    return render_template('model_testing.html')

@app.route('/development-tools')
def development_tools():
    return render_template('development_tools.html')

@app.route('/api/list-directory', methods=['POST'])
def list_directory():
    data = request.get_json()
    path = data.get('path', '/')
    
    try:
        # 确保路径安全
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path):
            return jsonify({'error': '路径不存在'}), 404
            
        items = []
        # 列出目录内容
        for item in os.scandir(abs_path):
            if item.is_dir():  # 只显示文件夹
                items.append({
                    'name': item.name,
                    'path': os.path.join(path, item.name),
                    'type': 'folder',
                    'modified': os.path.getmtime(item.path)
                })
        
        # 按名称排序
        items.sort(key=lambda x: x['name'].lower())
        
        return jsonify({
            'current_path': path,
            'items': items,
            'parent_path': os.path.dirname(path) if path != '/' else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
