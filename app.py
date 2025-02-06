from flask import Flask, render_template, request, jsonify, send_file
from util.training import TrainingConfig, training_process
from util.exporting import ExportConfig, exporting_process
from util.device import detect_device
from util.filesystem import list_directory, create_yaml_config
from util.quantization import QuantizationConfig, checker_process
from util.conversion import ConversionConfig, conversion_process
from util.detection import DetectionConfig, detection_process
import threading
import os

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

@app.route('/model-quantization', methods=['GET', 'POST'])
def model_quantization():
    """模型量化页面"""
    if request.method == 'GET':
        return render_template('model_quantization.html')
    
    # POST请求处理
    try:
        # 从表单创建配置
        config = QuantizationConfig.from_form(request.form)
        config.validate()
        
        # 在新线程中启动检查
        def run_checker():
            try:
                checker_process.start(config)
            except Exception as e:
                print(f"检查过程出错: {str(e)}")
                
        checker_thread = threading.Thread(target=run_checker)
        checker_thread.daemon = True  # 设置为守护线程
        checker_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': '检查已启动',
            'config': {
                'model_format': config.model_format,
                'march_type': config.march_type,
                'model_path': config.model_path
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
            'message': f'启动检查失败: {str(e)}',
            'error_type': 'internal_error'
        }), 500

@app.route('/model-conversion', methods=['GET', 'POST'])
def model_conversion():
    """模型转换页面"""
    if request.method == 'GET':
        return render_template('model_conversion.html')
    
    # POST请求处理
    try:
        # 从表单创建配置
        config = ConversionConfig.from_form(request.form)
        config.validate()
        
        # 在新线程中启动转换
        def run_conversion():
            try:
                conversion_process.start(config)
            except Exception as e:
                print(f"转换过程出错: {str(e)}")
                
        conversion_thread = threading.Thread(target=run_conversion)
        conversion_thread.daemon = True  # 设置为守护线程
        conversion_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': '转换已启动',
            'config': {
                'model_path': config.model_path,
                'march_type': config.march_type,
                'input_type_rt': config.input_type_rt,
                'input_type_train': config.input_type_train,
                'input_layout_train': config.input_layout_train,
                'cal_data_dir': config.cal_data_dir
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
            'message': f'启动转换失败: {str(e)}',
            'error_type': 'internal_error'
        }), 500


@app.route('/model_testing')
def model_testing():
    return render_template('model_testing.html')

@app.route('/browse')
def browse_files():
    path = request.args.get('path', '/')
    try:
        items = []
        for entry in os.scandir(path):
            item = {
                'name': entry.name,
                'path': os.path.join(path, entry.name),
                'type': 'directory' if entry.is_dir() else 'file'
            }
            items.append(item)
        return jsonify(sorted(items, key=lambda x: (x['type'] == 'file', x['name'])))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/start_testing', methods=['POST'])
def start_testing():
    data = request.get_json()
    model_path = data.get('model_path')
    image_path = data.get('image_path')
    
    if not model_path or not image_path:
        return jsonify({'error': '请提供模型文件和测试图片路径'}), 400
        
    if not os.path.exists(model_path) or not os.path.exists(image_path):
        return jsonify({'error': '文件不存在'}), 404
        
    # 这里先返回成功,实际的测试逻辑将在后端实现
    return jsonify({'status': 'success'})

@app.route('/stop_testing', methods=['POST'])
def stop_testing():
    # 这里先返回成功,实际的停止逻辑将在后端实现
    return jsonify({'status': 'success'})

@app.route('/model-detection', methods=['GET', 'POST'])
def model_detection():
    """模型检测页面"""
    if request.method == 'POST':
        try:
            # 创建配置对象
            config = DetectionConfig.from_form(request.form)
            
            # 验证配置
            config.validate()
            
            # 启动检测进程
            detection_process.start(config)
            
            return jsonify({
                'status': 'success',
                'message': '检测已启动',
                'config': {
                    'model_path': config.model_path
                }
            })
            
        except ValueError as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'error_type': 'validation_error'
            }), 400
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'启动检测失败: {str(e)}',
                'error_type': 'internal_error'
            }), 500
            
    return render_template('model_detection.html')

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

@app.route('/api/checker-status')
def get_checker_status():
    """获取检查状态"""
    try:
        return jsonify(checker_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取检查状态失败: {str(e)}'
        }), 500

@app.route('/api/stop-checker', methods=['POST'])
def stop_checker():
    """停止检查"""
    try:
        checker_process.stop()
        return jsonify({
            'status': 'success',
            'message': '检查已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止检查失败: {str(e)}'
        }), 500

@app.route('/api/conversion-status')
def get_conversion_status():
    """获取转换状态"""
    try:
        return jsonify(conversion_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取转换状态失败: {str(e)}'
        }), 500

@app.route('/api/stop-conversion', methods=['POST'])
def stop_conversion():
    """停止转换"""
    try:
        conversion_process.stop()
        return jsonify({
            'status': 'success',
            'message': '转换已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止转换失败: {str(e)}'
        }), 500

@app.route('/api/detection-status')
def get_detection_status():
    """获取检测状态"""
    try:
        return jsonify(detection_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取检测状态失败: {str(e)}'
        }), 500

@app.route('/api/stop-detection', methods=['POST'])
def stop_detection():
    """停止检测"""
    try:
        detection_process.stop()
        return jsonify({
            'status': 'success',
            'message': '检测已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止检测失败: {str(e)}'
        }), 500

@app.route('/perf_image/<path:image_path>')
def serve_perf_image(image_path):
    """提供性能分析图片"""
    try:
        # 使用相对路径
        if os.path.exists(image_path) and os.path.isfile(image_path):
            return send_file(image_path, mimetype='image/png')
        else:
            return jsonify({'error': '图片文件不存在'}), 404
    except Exception as e:
        return jsonify({'error': f'获取图片失败: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
