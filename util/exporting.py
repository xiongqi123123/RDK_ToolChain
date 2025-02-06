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
                base_path = base_dir / "models" / "model_train" / "YOLO" / f"{config.model_version}_{config.model_tag}"
                
                export_script = base_path / "export.py"
                
                # 检查文件是否存在
                if not export_script.exists():
                    raise FileNotFoundError(f"导出脚本不存在: {export_script}")
                
                # 切换到导出脚本所在目录
                os.chdir(base_path)
                
                # 构建导出命令
                export_cmd = [
                    "python3",
                    "export.py",
                    "--weights", config.model_path,
                    "--img-size", "640",  # 添加默认图像大小
                    "--batch-size", "1"    # 添加默认批次大小
                ]
                
                # 根据导出格式添加相应参数
                if config.export_format == 'onnx':
                    # v2.0版本会自动导出为ONNX格式，不需要额外参数
                    pass
                elif config.export_format == 'trt':
                    print("警告：YOLOv5 v2.0不直接支持TensorRT导出，需要先导出ONNX然后使用TensorRT工具转换")
                elif config.export_format == 'ncnn':
                    print("警告：YOLOv5 v2.0不直接支持NCNN导出，需要先导出ONNX然后使用NCNN工具转换")
                
                print(f"开始导出: {' '.join(export_cmd)}")
                
                # 创建进程
                self.process = subprocess.Popen(
                    export_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,  # 行缓冲
                    env=dict(os.environ, PYTHONUNBUFFERED="1"),  # 禁用Python输出缓冲
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
        """停止导出进程"""
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
        """获取导出状态"""
        with self._lock:
            if not self.process:
                return {
                    'status': self.status,
                    'message': '没有正在进行的导出',
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
            
            # 解析导出进度
            progress = 0
            if stdout_data:
                # 这里可以根据实际的输出格式添加进度解析逻辑
                pass
            
            if return_code is None:
                # 进程仍在运行
                return {
                    'status': 'running',
                    'message': '导出进行中',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'progress': progress,
                    'error': None
                }
            elif return_code == 0:
                # 进程正常结束
                return {
                    'status': 'completed',
                    'message': '导出已完成',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'progress': 100,
                    'error': None
                }
            else:
                # 进程异常结束
                error_msg = stderr_data if stderr_data else f'导出异常终止，返回码：{return_code}'
                return {
                    'status': 'stopped',
                    'message': '导出异常终止',
                    'error': error_msg,
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'progress': progress
                }

# 全局导出进程管理器
exporting_process = ExportProcess()