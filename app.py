from flask import Flask, render_template, request, jsonify, send_file
from util.training import TrainingConfig, training_process
from util.exporting import ExportConfig, exporting_process
from util.device import detect_device
from util.filesystem import list_directory, create_yaml_config
from util.quantization import QuantizationConfig, checker_process
from util.conversion import ConversionConfig, conversion_process
from util.detection import DetectionConfig, detection_process
from util.delete import DeleteConfig, delete_process
from util.testing import TestingConfig, testing_process
from util.board_monitor import board_monitor
import threading
import os
from pathlib import Path
import shutil
import tempfile
from datetime import datetime

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
    try:
        config = TrainingConfig.from_form(request.form)
        config.validate()
        
        # 只有YOLO模型需要YAML配置文件
        yaml_path = None
        if config.model_series == 'yolo':
            kpt_shape = [config.kpt_num, config.kpt_dim] if config.model_tag == 'pose' else None
            yaml_path = create_yaml_config(
                config.dataset_path,
                config.num_classes,
                config.labels,
                kpt_shape
            )
        
        def run_training():
            try:
                training_process.start(config, yaml_path)
            except Exception as e:
                print(f"训练过程出错: {str(e)}")
                
        training_thread = threading.Thread(target=run_training)
        training_thread.daemon = True  
        training_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': '训练已启动',
            'config': {
                'epochs': config.epochs,
                'batch_size': config.batch_size,
                'device': config.device,
                'dataset_path': config.dataset_path,
                'image_size': config.image_size,
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
    try:
        config = ExportConfig.from_form(request.form)
        config.validate()
        
        def run_export():
            try:
                exporting_process.start(config)
            except Exception as e:
                print(f"导出过程出错: {str(e)}")
                
        export_thread = threading.Thread(target=run_export)
        export_thread.daemon = True  
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
                'export_format': config.export_format,
                'image_size': config.image_size
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
    try:
        config = QuantizationConfig.from_form(request.form)
        config.validate()
        def run_checker():
            try:
                checker_process.start(config)
            except Exception as e:
                print(f"检查过程出错: {str(e)}")
                
        checker_thread = threading.Thread(target=run_checker)
        checker_thread.daemon = True  
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
    
    try:
        print(request.form)
        config = ConversionConfig.from_form_data(request.form)
        config.validate()
        def run_conversion():
            try:
                conversion_process.start(config)
            except Exception as e:
                print(f"转换过程出错: {str(e)}")
                
        conversion_thread = threading.Thread(target=run_conversion)
        conversion_thread.daemon = True 
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
                'cal_data_dir': config.cal_data_dir,
                'scale_value': config.scale_value,
                'node_info': config.node_info
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
            'message': f'输入数据格式错误: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'转换失败: {str(e)}'
        }), 500

@app.route('/model_testing', methods=['GET', 'POST'])
def model_testing():
    """模型测试页面"""
    if request.method == 'GET':
        return render_template('model_testing.html')
    try:
        config = TestingConfig.from_form(request.form)
        config.validate()
        
        def run_testing():
            try:
                testing_process.start(config)
            except Exception as e:
                print(f"测试过程出错: {str(e)}")
                
        testing_thread = threading.Thread(target=run_testing)
        testing_thread.daemon = True  
        testing_thread.start()
        
        return jsonify({
            'status': 'success',
            'message': '测试已启动',
            'config': {
                'model_info': {
                    'series': config.model_series,
                    'version': config.model_version,
                    'tag': config.model_tag
                },
                'model_path': config.model_path,
                'image_path': config.image_path,
                'num_classes': config.num_classes
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
            'message': f'启动测试失败: {str(e)}',
            'error_type': 'internal_error'
        }), 500

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

@app.route('/model-detection', methods=['GET', 'POST'])
def model_detection():
    """模型检测页面"""
    if request.method == 'POST':
        try:
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
        include_files = data.get('include_files', False)  
        file_pattern = data.get('file_pattern')  
        
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
    """提供模型可视化图片"""
    try:
        # 构建图片的完整路径
        base_dir = Path(__file__).parent
        image_full_path = base_dir / "logs" / "detection_output" / image_path
        
        if not image_full_path.exists():
            print(f"图片文件不存在: {image_full_path}")
            return "图片文件不存在", 404
            
        print(f"提供图片文件: {image_full_path}")
        return send_file(str(image_full_path), mimetype='image/png')
        
    except Exception as e:
        print(f"提供图片文件时出错: {str(e)}")
        return str(e), 500

@app.route('/test-result-image/<path:image_name>')
def serve_test_result_image(image_name):
    """提供测试结果图片服务"""
    try:
        # 获取项目根目录
        base_dir = Path(__file__).parent
        
        # 测试结果图片路径
        image_path = base_dir / "logs" / "test_output" / image_name
        
        # 确保文件存在且在项目目录内（安全检查）
        image_path = image_path.resolve()
        base_dir = base_dir.resolve()
        
        if not str(image_path).startswith(str(base_dir)):
            return "Access denied", 403
            
        if not image_path.exists():
            print(f"测试结果图片不存在: {image_path}")
            return "Image not found", 404
            
        print(f"提供测试结果图片: {image_path}")
        return send_file(str(image_path), mimetype='image/jpeg')
        
    except Exception as e:
        print(f"提供测试结果图片时出错: {str(e)}")
        return f"Error serving test result image: {str(e)}", 500

@app.route('/original-image')
def serve_original_image():
    """提供原始测试图片服务"""
    try:
        image_path = request.args.get('path')
        if not image_path:
            return "Missing path parameter", 400
            
        # 检查文件是否存在
        image_path = Path(image_path)
        if not image_path.exists():
            print(f"原始图片不存在: {image_path}")
            return "Image not found", 404
            
        print(f"提供原始图片: {image_path}")
        return send_file(str(image_path))
        
    except Exception as e:
        print(f"提供原始图片时出错: {str(e)}")
        return f"Error serving original image: {str(e)}", 500

@app.route('/model-delete', methods=['GET', 'POST'])
def model_delete():
    """模型去量化页面"""
    if request.method == 'GET':
        return render_template('model_delete.html')

@app.route('/start-delete-detect', methods=['POST'])
def start_delete_detect():
    """开始检测反量化节点"""
    try:
        config = DeleteConfig.from_form(request.form)
        config.validate()
        delete_process.start_detect(config)
        return jsonify({
            'status': 'success',
            'message': '检测已启动'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/start-delete-remove', methods=['POST'])
def start_delete_remove():
    """开始移除反量化节点"""
    try:
        config = DeleteConfig.from_form(request.form)
        config.validate()
        delete_process.start_remove(config)
        return jsonify({
            'status': 'success',
            'message': '移除已启动'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/delete-status')
def get_delete_status():
    """获取去量化状态"""
    try:
        return jsonify(delete_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取状态失败: {str(e)}'
        }), 500

@app.route('/stop-delete', methods=['POST'])
def stop_delete():
    """停止去量化进程"""
    try:
        delete_process.stop()
        return jsonify({
            'status': 'success',
            'message': '进程已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止失败: {str(e)}'
        }), 500

@app.route('/download-logs')
def download_logs():
    """打包下载logs文件夹"""
    try:
        # 获取logs文件夹路径
        base_dir = Path(__file__).parent
        logs_dir = base_dir / 'logs'
        
        if not logs_dir.exists():
            return '日志文件夹不存在', 404
            
        # 创建临时目录用于存放zip文件
        with tempfile.TemporaryDirectory() as temp_dir:
            # 生成zip文件名（包含时间戳）
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            zip_filename = f'logs_{timestamp}.zip'
            zip_path = os.path.join(temp_dir, zip_filename)
            
            # 创建zip文件
            shutil.make_archive(
                os.path.splitext(zip_path)[0],  # 不包含扩展名的路径
                'zip',                          # 压缩格式
                logs_dir                        # 要压缩的目录
            )
            
            # 发送文件
            return send_file(
                zip_path,
                as_attachment=True,
                download_name=zip_filename,
                mimetype='application/zip'
            )
            
    except Exception as e:
        return str(e), 500

@app.route('/api/testing-status')
def get_testing_status():
    """获取测试状态"""
    try:
        return jsonify(testing_process.get_status())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取测试状态失败: {str(e)}'
        }), 500

@app.route('/api/stop-testing', methods=['POST'])
def api_stop_testing():
    """停止测试"""
    try:
        testing_process.stop()
        return jsonify({
            'status': 'success',
            'message': '测试已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'停止测试失败: {str(e)}'
        }), 500

@app.route('/api/board-connect', methods=['POST'])
def board_connect():
    """连接到开发板"""
    try:
        print("收到开发板连接请求")
        data = request.get_json()
        
        if not data:
            print("请求数据为空")
            return jsonify({
                'status': 'error',
                'message': '请求数据格式错误'
            }), 400
        
        ip = data.get('ip', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        port = int(data.get('port', 22))
        
        print(f"连接参数: ip={ip}, username={username}, port={port}")
        
        if not all([ip, username, password]):
            print("连接参数不完整")
            return jsonify({
                'status': 'error',
                'message': 'IP地址、用户名和密码不能为空'
            }), 400
        
        # 检查是否为测试模式
        test_only = data.get('test_only', False)
        if test_only:
            print("仅测试网络连通性...")
            # 仅测试网络连通性
            try:
                import socket
                socket.setdefaulttimeout(3)
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex((ip, port))
                sock.close()
                
                if result == 0:
                    return jsonify({
                        'status': 'success',
                        'message': f'网络连通性正常 ({ip}:{port})'
                    })
                else:
                    return jsonify({
                        'status': 'error',
                        'message': f'无法连接到 {ip}:{port}，请检查网络和IP地址'
                    })
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': f'网络测试失败: {str(e)}'
                })
        
        print("调用board_monitor.connect()...")
        result = board_monitor.connect(ip, username, password, port)
        print(f"连接结果: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"API处理异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'连接失败: {str(e)}'
        }), 500

@app.route('/api/board-disconnect', methods=['POST'])
def board_disconnect():
    """断开开发板连接"""
    try:
        board_monitor.disconnect()
        return jsonify({
            'status': 'success',
            'message': '已断开连接'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'断开连接失败: {str(e)}'
        }), 500

@app.route('/api/board-status')
def board_status():
    """获取开发板状态"""
    try:
        status = board_monitor.get_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取状态失败: {str(e)}'
        }), 500

@app.route('/api/board-connection-info')
def board_connection_info():
    """获取开发板连接信息"""
    try:
        if board_monitor.connected:
            # 获取设备信息
            board_info = board_monitor._get_board_info()
            board_info.update(board_monitor.device_info)
            
            return jsonify({
                'status': 'connected',
                'connection_info': board_monitor.connection_info,
                'board_info': board_info,
                'message': '已连接'
            })
        else:
            return jsonify({
                'status': 'disconnected',
                'message': '未连接'
            })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'获取连接信息失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
