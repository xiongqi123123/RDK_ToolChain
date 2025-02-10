from dataclasses import dataclass
import subprocess
import signal
import threading
from typing import Dict, Any, Optional, List
import os
from pathlib import Path
import fcntl


@dataclass
class ExportConfig:
    model_series: str
    model_version: str
    model_tag: str
    model_size: str
    model_path: str
    export_format: str

    @classmethod
    def from_form(cls, form_data) -> 'ExportConfig':
        """从表单数据创建配置对象"""
        try:
            return cls(
                model_series=form_data.get('modelSeries', ''),
                model_version=form_data.get('modelVersion', ''),
                model_tag=form_data.get('modelTag', ''),
                model_size=form_data.get('modelSize', ''),
                model_path=form_data.get('modelPath', ''),
                export_format=form_data.get('exportFormat', '')
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"配置参数无效: {str(e)}")

    def validate(self):
        """验证配置参数"""
        if not all([self.model_series, self.model_version, self.model_tag, self.model_size]):
            raise ValueError("模型参数不完整")
        
        if not self.model_path:
            raise ValueError("模型文件路径不能为空")
            
        if not os.path.exists(self.model_path):
            raise ValueError(f"模型文件不存在: {self.model_path}")
            
        if not self.export_format:
            raise ValueError("导出格式不能为空")


class ExportProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()

    def start(self, config: ExportConfig):
        """启动导出进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有导出进程在运行")

            try:
                base_dir = Path(__file__).parent.parent.absolute()
                if config.model_version == 'yolov5':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}_{config.model_tag}"
                    export_script = base_path / "export.py"
                elif config.model_version == 'yolov8':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}"
                    export_script = base_path / "export.py"
                elif config.model_version == 'yolov10':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}"
                    export_script = base_path / "export.py"
                elif config.model_version == 'yolo11':
                    base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}"
                    export_script = base_path / "export.py"
                

                if not export_script.exists():
                    raise FileNotFoundError(f"导出脚本不存在: {export_script}")

                os.chdir(base_path)

                export_cmd = [
                    "python3",
                    "export.py",
                    "--weights", config.model_path,
                    "--img-size", "640",  
                    "--batch-size", "1"   
                ]
                
                # if config.export_format == 'onnx':
                #     # v2.0版本会自动导出为ONNX格式，不需要额外参数
                #     pass
                
                print(f"开始导出: {' '.join(export_cmd)}")

                self.process = subprocess.Popen(
                    export_cmd,
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
        """停止导出进程"""
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
        """获取导出状态"""
        with self._lock:
            if not self.process:
                return {
                    'status': self.status,
                    'message': '没有正在进行的导出',
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
                            print(f"导出输出: {line}")
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
                            print(f"导出错误: {line}")
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
                if "Loading weights from" in stdout_data:
                    progress = 10
                elif "PyTorch: starting from" in stdout_data:
                    progress = 20
                elif "Starting ONNX export" in stdout_data:
                    progress = 30
                elif "ONNX: export success" in stdout_data:
                    progress = 100
                elif "Export complete" in stdout_data:
                    progress = 100
            
            result = {
                'status': 'running',
                'message': '导出进行中',
                'stdout': stdout_data,
                'stderr': stderr_data,
                'progress': progress,
                'error': None
            }

            if return_code is not None:
                if return_code == 0:
                    result.update({
                        'status': 'completed',
                        'message': '导出已完成',
                        'progress': 100
                    })
                else:
                    error_msg = stderr_data if stderr_data else f'导出异常终止，返回码：{return_code}'
                    print(f"导出失败: {error_msg}")
                    result.update({
                        'status': 'stopped',
                        'message': '导出异常终止',
                        'error': error_msg
                    })

            return result

# 全局导出进程管理器
exporting_process = ExportProcess()