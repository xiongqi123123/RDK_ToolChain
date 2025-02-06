from dataclasses import dataclass
import subprocess
import signal
import threading
from typing import Dict, Any, Optional
import os
from pathlib import Path
import fcntl
import tempfile
import shutil
import matplotlib.pyplot as plt
import numpy as np

@dataclass
class DetectionConfig:
    model_path: str

    @classmethod
    def from_form(cls, form_data) -> 'DetectionConfig':
        """从表单数据创建配置对象"""
        try:
            return cls(
                model_path=form_data.get('modelPath', '')
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"配置参数无效: {str(e)}")

    def validate(self):
        """验证配置参数"""
        if not self.model_path:
            raise ValueError("模型文件路径不能为空")
            
        if not os.path.exists(self.model_path):
            raise ValueError(f"模型文件不存在: {self.model_path}")
            
        if not self.model_path.lower().endswith('.bin'):
            raise ValueError("模型文件必须是BIN格式")


class DetectionProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()
        self._output_dir = None
        self._perf_image = None

    def _generate_perf_image(self, perf_data):
        """生成性能分析图"""
        try:
            # 创建图表
            plt.figure(figsize=(10, 6))
            
            # 解析性能数据
            layers = perf_data['layers']
            times = perf_data['times']
            
            # 创建条形图
            y_pos = np.arange(len(layers))
            plt.barh(y_pos, times)
            
            # 设置标签
            plt.yticks(y_pos, layers)
            plt.xlabel('执行时间 (ms)')
            plt.title('模型层级性能分析')
            
            # 保存图片
            image_path = os.path.join(self._output_dir, 'performance.png')
            plt.savefig(image_path, bbox_inches='tight')
            plt.close()
            
            return image_path
            
        except Exception as e:
            print(f"生成性能分析图失败: {str(e)}")
            return None

    def _filter_output(self, output: str) -> str:
        """过滤和处理输出内容"""
        if not output:
            return ""
            
        filtered_lines = []
        lines = output.splitlines()
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 保留所有输出,方便调试
            filtered_lines.append(line)
                
        return "\n".join(filtered_lines)

    def start(self, config: DetectionConfig):
        """启动检测进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有检测进程在运行")

            try:
                # 创建输出目录
                self._output_dir = os.path.join(os.getcwd(), 'logs', 'detection_output')
                os.makedirs(self._output_dir, exist_ok=True)
                
                # 构建检测命令
                detection_cmd = [
                    "hb_perf",
                    config.model_path
                ]
                
                print(f"开始检测: {' '.join(detection_cmd)}")
                
                # 创建进程
                self.process = subprocess.Popen(
                    detection_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,  # 行缓冲
                    env=dict(os.environ, PYTHONUNBUFFERED="1")  # 禁用Python输出缓冲
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
        """停止检测进程"""
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
        """获取检测状态"""
        with self._lock:
            if not self.process:
                print("\n=== 检测状态 ===")
                print("状态: 未运行")
                print(f"错误信息: {self.error if self.error else '无'}")
                print("================\n")
                
                return {
                    'status': self.status,
                    'message': '没有正在进行的检测',
                    'error': self.error
                }
            
            return_code = self.process.poll()
            print(f"\n=== 进程状态 ===")
            print(f"返回码: {return_code}")
            
            # 非阻塞方式读取输出
            stdout_data = ""
            stderr_data = ""
            
            try:
                # 读取所有可用输出
                if self.process.stdout:
                    try:
                        print("\n=== 标准输出 ===")
                        while True:
                            line = self.process.stdout.readline()
                            if not line:
                                break
                            stdout_data += line
                            print(f"STDOUT: {line.strip()}")
                    except (IOError, OSError) as e:
                        print(f"读取标准输出时出错: {str(e)}")
                        pass

                if self.process.stderr:
                    try:
                        print("\n=== 标准错误 ===")
                        while True:
                            line = self.process.stderr.readline()
                            if not line:
                                break
                            stderr_data += line
                            print(f"STDERR: {line.strip()}")
                    except (IOError, OSError) as e:
                        print(f"读取标准错误时出错: {str(e)}")
                        pass
                            
            except Exception as e:
                error_msg = f"读取输出时发生错误: {str(e)}"
                print(f"\n=== 错误 ===")
                print(error_msg)
            
            # 解析和过滤输出
            filtered_stdout = self._filter_output(stdout_data)
            filtered_stderr = self._filter_output(stderr_data)
            
            print("\n=== 过滤后的输出 ===")
            print("标准输出:")
            print(filtered_stdout)
            print("\n标准错误:")
            print(filtered_stderr)
            
            if return_code is None:
                # 进程仍在运行
                status_data = {
                    'status': 'running',
                    'message': '检测进行中',
                    'stdout': filtered_stdout,
                    'stderr': filtered_stderr,
                    'error': None
                }
            elif return_code == 0:
                # 进程正常结束
                # 查找性能分析图
                perf_image = self._find_perf_image()
                
                status_data = {
                    'status': 'completed',
                    'message': '检测已完成',
                    'stdout': filtered_stdout,
                    'stderr': filtered_stderr,
                    'error': None,
                    'perf_image': perf_image
                }
            else:
                # 进程异常结束
                error_msg = filtered_stderr if filtered_stderr else f'检测异常终止，返回码：{return_code}'
                status_data = {
                    'status': 'stopped',
                    'message': '检测异常终止',
                    'error': error_msg,
                    'stdout': filtered_stdout,
                    'stderr': filtered_stderr
                }
            
            print("\n=== 返回数据 ===")
            print(status_data)
            print("================\n")
            
            return status_data

    def _find_perf_image(self) -> Optional[str]:
        """查找模型可视化图片"""
        try:
            # 查找 hb_perf_result 目录
            perf_dir = 'hb_perf_result'  # 使用相对路径
            if not os.path.exists(perf_dir):
                print(f"模型可视化目录不存在: {perf_dir}")
                return None
                
            # 遍历子目录
            for model_dir in os.listdir(perf_dir):
                model_path = os.path.join(perf_dir, model_dir)
                if os.path.isdir(model_path):
                    # 查找 .png 文件
                    for file in os.listdir(model_path):
                        if file.endswith('.png'):
                            image_path = os.path.join(model_path, file)
                            print(f"找到模型可视化图片: {image_path}")
                            return image_path  # 返回相对路径
                            
            print("未找到模型可视化图片")
            return None
            
        except Exception as e:
            print(f"查找模型可视化图片时出错: {str(e)}")
            return None

# 全局检测进程管理器
detection_process = DetectionProcess() 