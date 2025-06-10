from dataclasses import dataclass
import subprocess
import signal
import threading
from typing import Dict, Any, Optional, List
import os
from pathlib import Path
import fcntl
import cv2
import numpy as np

@dataclass
class TestingConfig:
    model_series: str
    model_version: str
    model_tag: str
    model_path: str
    image_path: str
    num_classes: int

    @classmethod
    def from_form(cls, form_data) -> 'TestingConfig':
        """从表单数据创建配置对象"""
        try:
            return cls(
                model_series=form_data.get('modelSeries', ''),
                model_version=form_data.get('modelVersion', ''),
                model_tag=form_data.get('modelTag', ''),
                model_path=form_data.get('modelPath', ''),
                image_path=form_data.get('imagePath', ''),
                num_classes=int(form_data.get('numClasses', 0))
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"配置参数无效: {str(e)}")

    def validate(self):
        """验证配置参数"""
        if not all([self.model_series, self.model_version, self.model_tag]):
            raise ValueError("模型参数不完整")
        
        if not self.model_path:
            raise ValueError("模型文件路径不能为空")
        
        if not self.image_path:
            raise ValueError("测试图片路径不能为空")
        
        if not os.path.exists(self.model_path):
            raise ValueError(f"模型文件不存在: {self.model_path}")
        
        if not os.path.exists(self.image_path):
            raise ValueError(f"测试图片不存在: {self.image_path}")
        
        # 验证文件格式
        if not self.model_path.endswith('.onnx'):
            raise ValueError("模型文件必须是.onnx格式")
        
        if not any(self.image_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
            raise ValueError("测试图片必须是jpg或png格式")
        
        if self.num_classes <= 0:
            raise ValueError("类别数量必须大于0")


class TestingProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()

    def start(self, config: TestingConfig):
        """启动测试进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有测试进程在运行")

            try:
                base_dir = Path(__file__).parent.parent.absolute()
                if config.model_version == 'yolov5':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}_{config.model_tag}"
                    test_script = base_path / "yolov5v2.0_HBONNX.py"
                elif config.model_version == 'yolov8':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}"
                    test_script = base_path / "yolov8_HBONNX.py"
                elif config.model_version == 'yolov10':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}"
                    test_script = base_path / "yolov10_HBONNX.py"
                elif config.model_version == 'yolo11':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}"
                    test_script = base_path / "yolo11_HBONNX.py"

                if not test_script.exists():
                    raise FileNotFoundError(f"测试脚本不存在: {test_script}")

                os.chdir(base_path)

                test_cmd = [
                    "python3",
                    str(test_script),
                    "--model", config.model_path,
                    "--image", config.image_path,
                    "--num-classes", str(config.num_classes)
                ]
                
                print(f"开始测试: {' '.join(test_cmd)}")

                self.process = subprocess.Popen(
                    test_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,  # 行缓冲
                    env=dict(os.environ, PYTHONUNBUFFERED="1"), 
                    cwd=base_path
                )

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
        """停止测试进程"""
        with self._lock:
            if not self.process:
                return
            
            try:
                self.process.send_signal(signal.SIGINT)
                try:
                    self.process.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    self.process.terminate()
                    self.process.wait()
                
                self.status = "stopped"
                self.process = None
                
            except Exception as e:
                self.error = str(e)
                raise

    def get_status(self) -> Dict[str, Any]:
        """获取测试状态"""
        with self._lock:
            if not self.process:
                return {
                    'status': self.status,
                    'message': '没有正在进行的测试',
                    'error': self.error
                }
            
            return_code = self.process.poll()

            stdout_data = ""
            stderr_data = ""
            
            try:
                if self.process.stdout:
                    try:
                        while True:
                            line = self.process.stdout.readline()
                            if not line:
                                break
                            line = line.rstrip('\n')
                            print(f"测试输出: {line}")
                            stdout_data += line + '\n'
                    except (IOError, OSError) as e:
                        print(f"读取标准输出时出错: {str(e)}")
                        pass

                if self.process.stderr:
                    try:
                        while True:
                            line = self.process.stderr.readline()
                            if not line:
                                break
                            line = line.rstrip('\n')
                            print(f"测试错误: {line}")
                            stderr_data += line + '\n'
                    except (IOError, OSError) as e:
                        print(f"读取错误输出时出错: {str(e)}")
                        pass
                            
            except Exception as e:
                print(f"读取输出时发生错误: {str(e)}")

            if not stdout_data:
                stdout_data = "等待输出...\n"
            if not stderr_data:
                stderr_data = ""

            progress = 0
            if stdout_data:
                if "Loading model" in stdout_data:
                    progress = 10
                elif "Processing image" in stdout_data:
                    progress = 30
                elif "Inference completed" in stdout_data:
                    progress = 70
                elif "Results saved" in stdout_data:
                    progress = 100
            
            result = {
                'status': 'running',
                'message': '测试进行中',
                'stdout': stdout_data,
                'stderr': stderr_data,
                'progress': progress,
                'error': None
            }

            if return_code is not None:
                if return_code == 0:
                    result.update({
                        'status': 'completed',
                        'message': '测试已完成',
                        'progress': 100
                    })
                else:
                    error_msg = stderr_data if stderr_data else f'测试异常终止，返回码：{return_code}'
                    print(f"测试失败: {error_msg}")
                    result.update({
                        'status': 'stopped',
                        'message': '测试异常终止',
                        'error': error_msg
                    })

            return result

# 全局测试进程管理器
testing_process = TestingProcess()
