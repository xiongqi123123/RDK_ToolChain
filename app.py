from flask import Flask, render_template, request, jsonify
import torch
import os
from pathlib import Path
from util.utils import generate_dataset_yaml
import subprocess
import signal
import threading
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import fcntl

app = Flask(__name__)

@dataclass
class TrainingConfig:
    model_series: str
    model_version: str
    model_tag: str
    model_size: str
    device: str
    dataset_path: str
    epochs: int
    batch_size: int
    num_classes: int
    labels: List[str]

    @classmethod
    def from_form(cls, form_data) -> 'TrainingConfig':
        """从表单数据创建配置对象"""
        try:
            return cls(
                model_series=form_data.get('modelSeries', ''),
                model_version=form_data.get('modelVersion', ''),
                model_tag=form_data.get('modelTag', ''),
                model_size=form_data.get('modelSize', ''),
                device=form_data.get('device', 'cpu'),
                dataset_path=form_data.get('datasetPath', ''),
                epochs=int(form_data.get('epochs', 0)),
                batch_size=int(form_data.get('batchSize', 0)),
                num_classes=int(form_data.get('numClasses', 0)),
                labels=form_data.get('labels', '').strip().split('\n') if form_data.get('labels') else []
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"配置参数无效: {str(e)}")

    def validate(self):
        """验证配置参数"""
        if not all([self.model_series, self.model_version, self.model_tag, self.model_size]):
            raise ValueError("模型参数不完整")
        
        if not self.dataset_path:
            raise ValueError("数据集路径不能为空")
        
        if self.epochs <= 0:
            raise ValueError("训练轮次必须大于0")
        
        if self.batch_size <= 0:
            raise ValueError("batch_size必须大于0")
        
        if self.num_classes <= 0:
            raise ValueError("类别数量必须大于0")
        
        if len(self.labels) != self.num_classes:
            raise ValueError(f"标签数量({len(self.labels)})与类别数量({self.num_classes})不匹配")

class TrainingProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()

    def start(self, config: TrainingConfig, yaml_path: str):
        """启动训练进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有训练进程在运行")

            try:
                base_dir = Path(__file__).parent.absolute()
                base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}_{config.model_tag}"
                
                train_script = base_path / "train.py"
                model_config = base_path / "models" / f"yolov5{config.model_size}.yaml"
                
                # 检查文件是否存在
                if not train_script.exists():
                    raise FileNotFoundError(f"训练脚本不存在: {train_script}")
                if not model_config.exists():
                    raise FileNotFoundError(f"模型配置文件不存在: {model_config}")
                if not Path(yaml_path).exists():
                    raise FileNotFoundError(f"数据集配置文件不存在: {yaml_path}")
                
                # 切换到训练脚本所在目录
                os.chdir(base_path)
                
                # 获取相对路径
                rel_model_config = os.path.relpath(model_config, base_path)
                rel_yaml_path = os.path.relpath(yaml_path, base_path)
                
                # 设置设备参数
                device = "0" if config.device == 'gpu' else "cpu"
                
                train_cmd = [
                    "python",
                    "train.py",
                    "--cfg", rel_model_config,
                    "--data", rel_yaml_path,
                    "--epochs", str(config.epochs),
                    "--batch-size", str(config.batch_size),
                    "--img", "640",
                    "--device", device
                ]
                
                print(f"开始训练: {' '.join(train_cmd)}")
                
                # 创建进程
                self.process = subprocess.Popen(
                    train_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,  # 行缓冲
                    env=dict(os.environ, PYTHONUNBUFFERED="1"),  # 禁用 Python 输出缓冲
                    cwd=base_path
                )

                # 设置非阻塞模式
                for pipe in [self.process.stdout, self.process.stderr]:
                    if pipe:
                        fd = pipe.fileno()
                        fl = fcntl.fcntl(fd, fcntl.F_GETFL)
                        fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

                self.status = "running"
                self.error = None
                
            except Exception as e:
                self.status = "error"
                self.error = str(e)
                raise

    def stop(self):
        """停止训练进程"""
        with self._lock:
            if not self.process:
                return
            
            try:
                # 先尝试优雅地停止
                self.process.send_signal(signal.SIGINT)
                try:
                    self.process.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    # 如果超时，强制终止
                    self.process.terminate()
                    self.process.wait()
                
                self.status = "stopped"
                self.process = None
                
            except Exception as e:
                self.error = str(e)
                raise

    def get_status(self) -> Dict[str, Any]:
        """获取训练状态"""
        with self._lock:
            if not self.process:
                return {
                    'status': self.status,
                    'message': '没有正在进行的训练',
                    'error': self.error
                }
            
            return_code = self.process.poll()
            
            # 非阻塞方式读取输出
            stdout_data = ""
            stderr_data = ""
            
            try:
                # 读取所有可用输出
                if self.process.stdout:
                    try:
                        while True:
                            line = self.process.stdout.readline()
                            if not line:
                                break
                            stdout_data += line
                    except (IOError, OSError):
                        pass

                if self.process.stderr:
                    try:
                        while True:
                            line = self.process.stderr.readline()
                            if not line:
                                break
                            stderr_data += line
                    except (IOError, OSError):
                        pass
                            
            except Exception as e:
                print(f"读取输出时发生错误: {str(e)}")
            
            # 打印完整的输出内容
            print("\n========== 完整输出内容 ==========")
            print("标准输出:")
            print(stdout_data)
            print("\n标准错误:")
            print(stderr_data)
            print("================================\n")
            
            # 解析训练进度
            current_epoch = 0
            if stderr_data:  # 从stderr中解析
                lines = stderr_data.split('\n')
                print(f"总行数: {len(lines)}")
                
                for i, line in enumerate(lines):
                    line = line.strip()
                    if not line:
                        continue
                        
                    print(f"第{i+1}行: {line}")
                    
                    # 跳过表头行
                    if "Epoch" in line:
                        continue
                        
                    # 检查是否是训练进度行
                    parts = line.split()
                    if len(parts) >= 7:  # 训练输出行通常有7列或更多
                        try:
                            # 第一部分应该是 "1/99" 这样的格式
                            first_part = parts[0]
                            if '/' in first_part:
                                current, total = map(int, first_part.split('/'))
                                if total > 0:  # 确保是有效的epoch数据
                                    current_epoch = current
                                    print(f"找到当前epoch: {current_epoch}/{total}")
                                    break  # 找到最新的epoch就可以退出了
                        except Exception as e:
                            print(f"解析行时出错: {str(e)}, 行内容: {line}")
                            continue
            
            print(f"最终解析结果 - current_epoch: {current_epoch}")
            print("=== 解析结束 ===\n")
            
            if return_code is None:
                # 进程仍在运行
                return {
                    'status': 'running',
                    'message': '训练进行中',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'current_epoch': current_epoch,
                    'error': None
                }
            elif return_code == 0:
                # 进程正常结束
                return {
                    'status': 'completed',
                    'message': '训练已完成',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'current_epoch': current_epoch,
                    'error': None
                }
            else:
                # 进程异常结束
                error_msg = stderr_data if stderr_data else f'训练异常终止，返回码：{return_code}'
                return {
                    'status': 'stopped',
                    'message': '训练异常终止',
                    'error': error_msg,
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'current_epoch': current_epoch
                }

# 全局训练进程管理器
training_process = TrainingProcess()

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
    if request.method == 'GET':
        return render_template('model_training.html')
    
    try:
        # 1. 创建并验证训练配置
        config = TrainingConfig.from_form(request.form)
        config.validate()
        
        # 2. 生成数据集配置
        yaml_path = generate_dataset_yaml(
            config.dataset_path,
            config.num_classes,
            config.labels
        )
        
        # 3. 启动训练进程（异步）
        def run_training():
            try:
                training_process.start(config, yaml_path)
                if training_process.process:
                    training_process.process.wait()
            except Exception as e:
                print(f"训练过程出错: {str(e)}")
        
        training_thread = threading.Thread(target=run_training)
        training_thread.start()
        
        # 4. 返回成功响应
        return jsonify({
            'status': 'success',
            'message': '训练任务已启动',
            'config': vars(config),
            'yaml_path': yaml_path
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error': str(e)
        }), 500

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

@app.route('/api/training-status')
def get_training_status():
    return jsonify(training_process.get_status())

@app.route('/api/stop-training', methods=['POST'])
def stop_training():
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
        })

if __name__ == '__main__':
    app.run(debug=True)
