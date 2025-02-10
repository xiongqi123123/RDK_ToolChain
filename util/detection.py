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
        try:
            return cls(
                model_path=form_data.get('modelPath', '')
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"配置参数无效: {str(e)}")

    def validate(self):
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
        self._work_dir = None

    def _filter_output(self, output: str) -> str:
        """过滤和格式化输出内容"""
        if not output:
            return ""
            
        # 按行处理
        filtered_lines = []
        is_model_info = False
        current_section = None
        
        for line in output.splitlines():
            line = line.strip()
            
            # 跳过不必要的日志信息
            if any(skip in line for skip in [
                "core[", "open!", "HBRT", "DNN", "vlog_is_on",
                "cost", "builder version"
            ]):
                continue
                
            if "model file has" in line:
                filtered_lines.append("\n=== 模型信息 ===")
                is_model_info = True
                continue
                
            if is_model_info:
                if "-----" in line:
                    continue
                    
                if "[model name]" in line:
                    filtered_lines.append(f"模型名称: {line.split(':')[1].strip()}")
                    continue
                   
                if "input[" in line:
                    current_section = "输入"
                    filtered_lines.append(f"\n{current_section}信息:")
                    continue
            
                if "output[" in line:
                    current_section = "输出"
                    filtered_lines.append(f"\n{current_section}信息:")
                    continue
                
                if current_section and ":" in line:
                    key, value = line.split(":", 1)
                    key = key.strip()
                    value = value.strip()
                    
                    key_map = {
                        "name": "名称",
                        "input source": "输入来源",
                        "valid shape": "有效形状",
                        "aligned shape": "对齐形状",
                        "aligned byte size": "对齐字节大小",
                        "tensor type": "张量类型",
                        "tensor layout": "数据排布",
                        "quanti type": "量化类型",
                        "stride": "步长"
                    }
                    
                    key = key_map.get(key, key)
                    
                    if "NONE" in value:
                        value = "无"
                    elif "HB_DNN" in value:
                        value = value.split("HB_DNN_")[1]
                    
                    filtered_lines.append(f"  - {key}: {value}")
                    continue
            
        return "\n".join(filtered_lines)

    def start(self, config: DetectionConfig):
        """启动检测进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有检测进程在运行")

            try:
                
                base_dir = Path(__file__).parent.parent
                self._work_dir = base_dir / "logs" / "detection_output"
                self._work_dir.mkdir(parents=True, exist_ok=True)
        
                env = os.environ.copy()
                
                util_dir = os.path.dirname(__file__)
                host_dir = os.path.join(util_dir, 'host')
                hrt_tools_dir = os.path.join(host_dir, 'hrt_tools')
                dnn_lib_dir = os.path.join(host_dir, 'host_package/x5_x86_64_gcc_11.4.0/dnn_x86/lib')
                
                env.update({
                    "LD_LIBRARY_PATH": f"{env.get('LD_LIBRARY_PATH', '')}:{hrt_tools_dir}:{dnn_lib_dir}"
                })

                perf_cmd = [
                    "hb_perf", 
                    config.model_path
                ]
                print(f"执行模型可视化: {' '.join(perf_cmd)}")
                
                perf_process = subprocess.run(perf_cmd, 
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    check=True,
                    env=env, 
                    cwd=str(self._work_dir) 
                )
                
                if perf_process.returncode != 0:
                    raise RuntimeError(f"模型可视化失败: {perf_process.stderr}")

                hrt_exec_path = os.path.join(hrt_tools_dir, 'hrt_model_exec')
                info_cmd = [
                    hrt_exec_path,
                    "model_info",
                    "--model_file",
                    config.model_path
                ]
                print(f"获取模型信息: {' '.join(info_cmd)}")
                
                self.process = subprocess.Popen(
                    info_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,  
                    env=env,  
                    cwd=str(self._work_dir)  
                )


                for pipe in [self.process.stdout, self.process.stderr]:
                    if pipe:
                        fd = pipe.fileno()
                        fl = fcntl.fcntl(fd, fcntl.F_GETFL)
                        fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

                self.status = "running"
                self.error = None
                
            except subprocess.CalledProcessError as e:
                self.status = "error"
                self.error = f"命令执行失败: {str(e)}\n{e.stderr if hasattr(e, 'stderr') else ''}"
                raise RuntimeError(self.error)
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

            stdout_data = ""
            stderr_data = ""
            
            try:
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
        try:
            if not self._work_dir:
                print("工作目录未设置")
                return None

            perf_dir = self._work_dir / 'hb_perf_result'
            if not perf_dir.exists():
                print(f"模型可视化目录不存在: {perf_dir}")
                return None
            
            for model_dir in perf_dir.iterdir():
                if model_dir.is_dir():
                    for file in model_dir.iterdir():
                        if file.suffix.lower() == '.png':
                            # 返回相对于工作目录的路径
                            rel_path = file.relative_to(self._work_dir)
                            print(f"找到模型可视化图片: {rel_path}")
                            return str(rel_path)
                            
            print("未找到模型可视化图片")
            return None
            
        except Exception as e:
            print(f"查找模型可视化图片时出错: {str(e)}")
            return None

# 全局检测进程管理器
detection_process = DetectionProcess() 