from flask import Flask, render_template, request, jsonify
from util.training import TrainingConfig, training_process
from util.exporting import ExportConfig, exporting_process
from util.device import detect_device
from util.filesystem import list_directory, create_yaml_config
import threading

app = Flask(__name__)

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/model-training', methods=['GET', 'POST'])
def model_training():
    """模型训练页面"""
    if request.method == 'GET':
        return render_template('model_training.html')
    
    # POST请求处理
    try:
        # 从表单创建配置
        config = TrainingConfig.from_form(request.form)
        config.validate()
        
        # 创建数据集配置文件
        yaml_path = create_yaml_config(
            config.dataset_path,
            config.num_classes,
            config.labels
        )
        
        # 在新线程中启动训练
        def run_training():
            try:
                training_process.start(config, yaml_path)
            except Exception as e:
                print(f"训练过程出错: {str(e)}")
                
        training_thread = threading.Thread(target=run_training)
        training_thread.daemon = True  # 设置为守护线程
        training_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': '训练已启动',
            'config': {
                'epochs': config.epochs,
                'batch_size': config.batch_size,
                'device': config.device,
                'dataset_path': config.dataset_path,
                'model_info': {
                    'series': config.model_series,
                    'version': config.model_version,
                    'tag': config.model_tag,
                    'size': config.model_size
                }
            }
        })
        
    except FileNotFoundError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'file_not_found'
        }), 404
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'validation_error'
        }), 400
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'启动训练失败: {str(e)}',
            'error_type': 'internal_error'
        }), 500
    
@app.route('/model-export', methods=['GET', 'POST'])
def model_export():
    """模型导出页面"""
    if request.method == 'GET':
        return render_template('model_export.html')
    # POST请求处理
    try:
        # 从表单创建配置
        config = ExportConfig.from_form(request.form)
        config.validate()
        
        # 在新线程中启动导出
        def run_export():
            try:
                exporting_process.start(config)
            except Exception as e:
                print(f"导出过程出错: {str(e)}")
                
        export_thread = threading.Thread(target=run_export)
        export_thread.daemon = True  # 设置为守护线程
        export_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': '导出已启动',
            'config': {
                'model_info': {
                    'series': config.model_series,
                    'version': config.model_version,
                    'tag': config.model_tag,
                    'size': config.model_size
                },
                'model_path': config.model_path,
                'export_format': config.export_format
            }
        })
        
    except FileNotFoundError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'file_not_found'
        }), 404
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'validation_error'
        }), 400
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'启动导出失败: {str(e)}',
            'error_type': 'internal_error'
        }), 500

@app.route('/model-quantization')
def model_quantization():
    """模型量化页面"""
    return render_template('model_quantization.html') 

@app.route('/model-conversion')
def model_conversion():
    """模型转换页面"""
    return render_template('model_conversion.html')

@app.route('/model-testing')
def model_testing():
    """模型测试页面"""
    return render_template('model_testing.html')

@app.route('/development-tools')
def development_tools():
    """开发工具页面"""
    return render_template('development_tools.html')

@app.route('/detect-device')
def get_device_info():
    """获取设备信息"""
    try:
        return jsonify(detect_device())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取设备信息失败: {str(e)}'
        }), 500

@app.route('/api/list-directory', methods=['POST'])
def handle_list_directory():
    """处理目录列表请求"""
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({
                'status': 'error',
                'message': '缺少路径参数'
            }), 400
            
        path = data['path']
        include_files = data.get('include_files', False)  # 获取include_files参数
        file_pattern = data.get('file_pattern')  # 获取file_pattern参数
        
        result = list_directory(
            path=path,
            include_files=include_files,
            file_pattern=file_pattern
        )
        
        if result.get('status') == 'error':
            return jsonify(result), 404
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取目录列表失败: {str(e)}'
        }), 500

@app.route('/api/training-status')
def get_training_status():
    """获取训练状态"""
    try:
        return jsonify(training_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取训练状态失败: {str(e)}'
        }), 500

@app.route('/api/stop-training', methods=['POST'])
def stop_training():
    """停止训练"""
    try:
        training_process.stop()
        return jsonify({
            'status': 'success',
            'message': '训练已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止训练失败: {str(e)}'
        }), 500

@app.route('/api/export-status')
def get_export_status():
    """获取导出状态"""
    try:
        return jsonify(exporting_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取导出状态失败: {str(e)}'
        }), 500

@app.route('/api/stop-export', methods=['POST'])
def stop_export():
    """停止导出"""
    try:
        exporting_process.stop()
        return jsonify({
            'status': 'success',
            'message': '导出已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止导出失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
