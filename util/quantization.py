from dataclasses import dataclass
import subprocess
import signal
import threading
from typing import Dict, Any, Optional
import os
from pathlib import Path
import fcntl

@dataclass
class QuantizationConfig:
    model_format: str
    march_type: str
    model_path: str

    @classmethod
    def from_form(cls, form_data) -> 'QuantizationConfig':
        """从表单数据创建配置对象"""
        try:
            return cls(
                model_format=form_data.get('modelFormat', ''),
                march_type=form_data.get('marchType', ''),
                model_path=form_data.get('modelPath', '')
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"配置参数无效: {str(e)}")

    def validate(self):
        """验证配置参数"""
        if not self.model_format or self.model_format != 'onnx':
            raise ValueError("目前仅支持ONNX格式模型")
        
        if not self.march_type:
            raise ValueError("必须选择运行架构")
            
        if not self.model_path:
            raise ValueError("模型文件路径不能为空")
            
        if not os.path.exists(self.model_path):
            raise ValueError(f"模型文件不存在: {self.model_path}")
            
        if not self.model_path.lower().endswith('.onnx'):
            raise ValueError("模型文件必须是ONNX格式")


class CheckerProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()

    def start(self, config: QuantizationConfig):
        """启动检查进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有检查进程在运行")

            try:
                # 构建检查命令
                base_dir = Path(__file__).parent.parent.absolute()
                work_dir = base_dir / "logs" / "checker_output"
                work_dir.mkdir(parents=True, exist_ok=True)

                checker_cmd = [
                    "hb_mapper",
                    "checker",
                    "--model-type", "onnx",
                    "--march", config.march_type,
                    "--model", config.model_path
                ]
                
                print(f"开始检查: {' '.join(checker_cmd)}")
                print(f"工作目录: {work_dir}")
                
                # 创建进程
                self.process = subprocess.Popen(
                    checker_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,  # 行缓冲
                    env=dict(os.environ, PYTHONUNBUFFERED="1"),  # 禁用Python输出缓冲
                    cwd=str(work_dir)  # 设置工作目录
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
        """停止检查进程"""
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
        """获取检查状态"""
        with self._lock:
            if not self.process:
                print("\n=== 检查状态 ===")
                print("状态: 未运行")
                print(f"错误信息: {self.error if self.error else '无'}")
                print("================\n")
                
                return {
                    'status': self.status,
                    'message': '没有正在进行的检查',
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
                    'message': '检查进行中',
                    'stdout': filtered_stdout,
                    'stderr': filtered_stderr,
                    'error': None
                }
            elif return_code == 0:
                # 进程正常结束
                status_data = {
                    'status': 'completed',
                    'message': '检查已完成',
                    'stdout': filtered_stdout,
                    'stderr': filtered_stderr,
                    'error': None
                }
            else:
                # 进程异常结束
                error_msg = filtered_stderr if filtered_stderr else f'检查异常终止，返回码：{return_code}'
                status_data = {
                    'status': 'stopped',
                    'message': '检查异常终止',
                    'error': error_msg,
                    'stdout': filtered_stdout,
                    'stderr': filtered_stderr
                }
            
            print("\n=== 返回数据 ===")
            print(status_data)
            print("================\n")
            
            return status_data

    def _filter_output(self, output: str) -> str:
        """过滤和处理输出内容,主要返回量化节点信息和输出信息"""
        if not output:
            return ""
            
        # 按行处理
        filtered_lines = []
        is_node_info = False  # 是否在节点信息区域
        is_output_info = False  # 是否在输出信息区域
        
        for line in output.splitlines():
            line = line.strip()
            
            # 开始节点信息区域
            if "The main quantized node information:" in line:
                is_node_info = True
                filtered_lines.append(line)
                continue
                
            # 开始输出信息区域
            if "The quantized model output:" in line:
                is_node_info = False
                is_output_info = True
                filtered_lines.append("\n" + line)
                continue
                
            # 结束输出信息区域
            if "End to Horizon NN Model Convert" in line:
                is_output_info = False
                filtered_lines.append(line)
                continue
                
            # 在节点信息区域内
            if is_node_info:
                if any([
                    "===" in line,  # 分隔线
                    "---" in line,  # 分隔线
                    "Node" in line,  # 表头
                    "BPU" in line,  # 节点信息
                ]):
                    filtered_lines.append(line)
                continue
                
            # 在输出信息区域内
            if is_output_info:
                if any([
                    "===" in line,  # 分隔线
                    "---" in line,  # 分隔线
                    "Output" in line,  # 输出信息
                    "ONNX model output" in line,  # ONNX输出信息
                ]):
                    filtered_lines.append(line)
                continue
                
            # 其他重要信息
            if any([
                "End to compile the model" in line,
                "End model checking" in line,
            ]):
                filtered_lines.append(line)
                
        return "\n".join(filtered_lines)

# 全局检查进程管理器
checker_process = CheckerProcess() 