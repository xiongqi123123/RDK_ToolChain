from dataclasses import dataclass
import subprocess
import signal
import threading
from typing import Dict, Any, Optional, List
import os
from pathlib import Path
import fcntl
import re

@dataclass
class DeleteConfig:
    model_path: str
    nodes_to_remove: List[str]

    @classmethod
    def from_form(cls, form_data) -> 'DeleteConfig':
        """从表单数据创建配置对象"""
        try:
            return cls(
                model_path=form_data.get('modelPath', ''),
                nodes_to_remove=form_data.getlist('nodesToRemove') if form_data.getlist('nodesToRemove') else []
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


class DeleteProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()
        self._work_dir = None
        self.dequant_nodes = []  # 存储检测到的反量化节点信息

    def _parse_dequant_node(self, log_text: str) -> List[Dict[str, str]]:
        """解析日志中的反量化节点信息"""
        nodes = []
        print(f"开始解析日志文本:\n{log_text}")
        
        try:

            base_dir = Path(__file__).parent.parent
            log_file = base_dir / "logs" / "delete_output" / "hb_model_modifier.log"
            if log_file.exists():
                with open(log_file, 'r') as f:
                    log_content = f.read()
                print(f"读取日志文件内容:\n{log_content}")
                
                nodes = []

                pattern = r'input:\s*"([^"]+)"\s*\ninput:\s*"([^"]+)"\s*\noutput:\s*"([^"]+)"\s*\nname:\s*"([^"]+)"\s*\nop_type:\s*"Dequantize"'
                matches = re.finditer(pattern, log_content, re.MULTILINE)
                
                for match in matches:
                    input1, input2, output, name = match.groups()
                    print(f"找到反量化节点:")
                    print(f"  - 输入1: {input1}")
                    print(f"  - 输入2: {input2}")
                    print(f"  - 输出: {output}")
                    print(f"  - 名称: {name}")
                    nodes.append({
                        'output': output,
                        'name': name,
                        'input1': input1,
                        'input2': input2
                    })
                
                print(f"共找到 {len(nodes)} 个反量化节点")
            else:
                print(f"日志文件不存在: {log_file}")
                
        except Exception as e:
            print(f"解析日志文件时出错: {str(e)}")
        
        return nodes

    def start_detect(self, config: DeleteConfig):
        """开始检测反量化节点"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有检测进程在运行")

            try:
                # 设置工作目录
                base_dir = Path(__file__).parent.parent
                self._work_dir = base_dir / "logs" / "delete_output"
                self._work_dir.mkdir(parents=True, exist_ok=True)
                print(f"工作目录: {self._work_dir}")
                

                cmd = [
                    "hb_model_modifier",
                    config.model_path
                ]
                print(f"执行节点检测命令: {' '.join(cmd)}")
                print(f"当前工作目录: {os.getcwd()}")
                

                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1, 
                    cwd=str(self._work_dir)
                )
                print(f"进程已启动，PID: {self.process.pid}")

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

    def start_remove(self, config: DeleteConfig):
        """开始移除反量化节点"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有移除进程在运行")

            try:
                cmd = ["hb_model_modifier", config.model_path]
                for node in config.nodes_to_remove:
                    cmd.extend(["-r", node])
                
                print(f"执行节点移除: {' '.join(cmd)}")
                
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1,
                    cwd=str(self._work_dir)
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
        """停止进程"""
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
        """获取进程状态"""
        with self._lock:
            if not self.process:
                return {
                    'status': self.status,
                    'message': '没有正在进行的进程',
                    'error': self.error,
                    'nodes': self.dequant_nodes
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
                            stdout_data += line
                            print(f"标准输出: {line.strip()}")
                    except (IOError, OSError) as e:
                        print(f"读取标准输出时出错: {e}")
                        pass

                if self.process.stderr:
                    try:
                        while True:
                            line = self.process.stderr.readline()
                            if not line:
                                break
                            stderr_data += line
                            print(f"标准错误: {line.strip()}")
                    except (IOError, OSError) as e:
                        print(f"读取标准错误时出错: {e}")
                        pass
                            
            except Exception as e:
                print(f"读取输出时发生错误: {str(e)}")
            
            if return_code is None:
                # 进程仍在运行
                status_data = {
                    'status': 'running',
                    'message': '进程运行中',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'error': None,
                    'nodes': self.dequant_nodes
                }
            elif return_code == 0:
                # 进程正常结束
                # 解析反量化节点信息
                self.dequant_nodes = self._parse_dequant_node(stderr_data)
                
                status_data = {
                    'status': 'completed',
                    'message': '进程已完成',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'error': None,
                    'nodes': self.dequant_nodes
                }
            else:
                # 进程异常结束
                error_msg = stderr_data if stderr_data else f'进程异常终止，返回码：{return_code}'
                status_data = {
                    'status': 'error',
                    'message': '进程异常终止',
                    'error': error_msg,
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'nodes': self.dequant_nodes
                }
            
            return status_data

# 全局进程管理器
delete_process = DeleteProcess()
