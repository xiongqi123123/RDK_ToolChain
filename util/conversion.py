from dataclasses import dataclass
import subprocess
import signal
import threading
from typing import Dict, Any, Optional
import os
from pathlib import Path
import fcntl
import yaml
import tempfile

@dataclass
class ConversionConfig:
    model_path: str
    march_type: str
    input_type_rt: str
    input_type_train: str
    input_layout_train: str
    cal_data_dir: str
    norm_type: str
    scale_value: str  # 改为字符串类型以支持多值
    mean_value: str = None  # 改为字符串类型以支持多值
    remove_node_type: str = None  # 添加remove_node_type字段
    node_info: Dict[str, Dict[str, str]] = None  # 修改为字典类型

    @classmethod
    def from_form_data(cls, form_data: dict) -> 'ConversionConfig':
        """从表单数据创建配置对象"""
        try:
            # 处理节点信息
            node_info = {}
            if 'nodePath[]' in form_data:
                paths = form_data.getlist('nodePath[]')
                input_types = form_data.getlist('nodeInputType[]')
                output_types = form_data.getlist('nodeOutputType[]')
                
                for i in range(len(paths)):
                    if paths[i]:  
                        node_info[paths[i]] = {
                            'ON': 'BPU',  
                            'InputType': input_types[i],  
                            'OutputType': output_types[i]  
                        }
            # 处理mean_value，只有选择data_mean_and_scale时才需要
            mean_value = None
            if form_data.get('normType') == 'data_mean_and_scale' and 'meanValue' in form_data:
                mean_value = form_data['meanValue'].strip()
            
            # 处理scale_value，可能是单个值或逗号分隔的多个值
            scale_value = form_data['scaleValue'].strip()
            
            # 处理remove_node_type（可选）
            remove_node_type = form_data.get('removeNodeType', '').strip() or None
            
            return cls(
                model_path=form_data['modelPath'],
                march_type=form_data['marchType'],
                input_type_rt=form_data['inputTypeRt'],
                input_type_train=form_data['inputTypeTrain'],
                input_layout_train=form_data['inputLayoutTrain'],
                cal_data_dir=form_data['calDataDir'],
                norm_type=form_data['normType'],
                scale_value=scale_value,
                mean_value=mean_value,
                remove_node_type=remove_node_type,
                node_info=node_info
            )
        except (KeyError, ValueError) as e:
            raise ValueError(f'表单数据无效: {str(e)}')

    def validate(self):
        if not self.model_path:
            raise ValueError("模型文件路径不能为空")
            
        if not os.path.exists(self.model_path):
            raise ValueError(f"模型文件不存在: {self.model_path}")
            
        if not self.model_path.lower().endswith('.onnx'):
            raise ValueError("模型文件必须是ONNX格式")
            
        if not self.march_type:
            raise ValueError("必须选择运行架构")
            
        if not self.input_type_rt:
            raise ValueError("必须选择运行时输入格式")
            
        if not self.input_type_train:
            raise ValueError("必须选择训练时输入格式")
            
        if not self.input_layout_train:
            raise ValueError("必须选择数据排布")
            
        if not self.norm_type:
            raise ValueError("必须选择标准化类型")
            
        if self.norm_type not in ['data_scale', 'data_mean_and_scale']:
            raise ValueError("标准化类型必须是 'data_scale' 或 'data_mean_and_scale'")
            
        if not self.cal_data_dir:
            raise ValueError("校准数据集路径不能为空")
            
        if not os.path.exists(self.cal_data_dir):
            raise ValueError(f"校准数据集路径不存在: {self.cal_data_dir}")

    def _generate_input_parameters(self) -> Dict[str, Any]:
        """生成input_parameters配置"""
        # 处理scale_value：将逗号分隔转换为空格分隔
        scale_value_formatted = self._format_value_string(self.scale_value)
        
        input_params = {
            'input_type_rt': self.input_type_rt,
            'input_type_train': self.input_type_train,
            'input_layout_train': self.input_layout_train.upper(),
            'norm_type': self.norm_type,
            'scale_value': scale_value_formatted
        }
        
        # 如果是data_mean_and_scale类型，添加mean_value
        if self.norm_type == 'data_mean_and_scale' and self.mean_value:
            mean_value_formatted = self._format_value_string(self.mean_value)
            input_params['mean_value'] = mean_value_formatted
            
        return input_params
    
    def _format_value_string(self, value_str: str) -> str:
        """将逗号分隔的字符串转换为空格分隔的字符串"""
        if not value_str:
            return value_str
        
        # 移除多余的空格，按逗号分隔，然后用空格连接
        values = [v.strip() for v in value_str.split(',')]
        return ' '.join(values)

    def generate_yaml(self) -> str:
        """生成YAML配置文件"""
        base_dir = Path(__file__).parent.parent.absolute()
        work_dir = base_dir / "logs" / "convert_output"
        work_dir.mkdir(parents=True, exist_ok=True)

        model_parameters = {
            'onnx_model': self.model_path,
            'march': self.march_type,
            'layer_out_dump': False,
            'working_dir': str(work_dir),
            'output_model_file_prefix': 'converted_model',
            'node_info': self.node_info  # 直接使用字典
        }
        
        # 如果有remove_node_type，添加到配置中
        if self.remove_node_type:
            # 处理remove_node_type：将逗号分隔转换为空格分隔（如果需要的话）
            formatted_remove_node_type = self._format_value_string(self.remove_node_type)
            model_parameters['remove_node_type'] = formatted_remove_node_type
        
        config = {
            'model_parameters': model_parameters,
            'input_parameters': self._generate_input_parameters(),
            'calibration_parameters': {
                'cal_data_dir': self.cal_data_dir,
                'cal_data_type': 'float32',
                'calibration_type': 'default',
                'preprocess_on': True
            },
            'compiler_parameters': {
                'compile_mode': 'latency',
                'debug': False,
                'optimize_level': 'O3'
            }
        }
        print(config)
        # 创建临时YAML文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            yaml.safe_dump(config, f, default_flow_style=False)
            return f.name


class ConversionProcess:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.error = None
        self._lock = threading.Lock()
        self._yaml_file = None
        self._output_dir = None

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
            filtered_lines.append(line)# 保留所有输出,方便调试
                
        return "\n".join(filtered_lines)

    def start(self, config: ConversionConfig):
        """启动转换进程"""
        with self._lock:
            if self.process and self.process.poll() is None:
                raise RuntimeError("已有转换进程在运行")

            try:
                # 创建输出目录
                self._output_dir = os.path.join(os.getcwd(), 'logs', 'convert_output')
                os.makedirs(self._output_dir, exist_ok=True)
                
                self._yaml_file = config.generate_yaml()
                print(f"\n=== 配置信息 ===")
                print(f"YAML配置文件: {self._yaml_file}")
                print(f"输出目录: {self._output_dir}")
                
                if not os.path.exists(self._yaml_file):
                    raise FileNotFoundError(f"配置文件未生成: {self._yaml_file}")
                convert_cmd = [
                    "hb_mapper",
                    "makertbin",
                    "--model-type", "onnx",
                    "--config", self._yaml_file
                ]
                
                print(f"\n=== 执行命令 ===")
                print(f"命令: {' '.join(convert_cmd)}")
                
                self.process = subprocess.Popen(
                    convert_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    bufsize=1, 
                    env=dict(os.environ, PYTHONUNBUFFERED="1")  
                )

                # 设置非阻塞模式
                for pipe in [self.process.stdout, self.process.stderr]:
                    if pipe:
                        fd = pipe.fileno()
                        fl = fcntl.fcntl(fd, fcntl.F_GETFL)
                        fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

                self.status = "running"
                self.error = None
                print("转换进程已启动")
                
            except Exception as e:
                self.status = "error"
                self.error = str(e)
                print(f"\n=== 错误 ===")
                print(f"启动失败: {str(e)}")
                raise

    def stop(self):
        """停止转换进程"""
        with self._lock:
            if not self.process:
                return
            
            try:
                print("\n=== 停止进程 ===")
                self.process.send_signal(signal.SIGINT)
                try:
                    self.process.wait(timeout=30)
                    print("进程已正常停止")
                except subprocess.TimeoutExpired:
                    print("进程未响应,强制终止")
                    self.process.terminate()
                    self.process.wait()
                
                self.status = "stopped"
                self.process = None
                
            except Exception as e:
                self.error = str(e)
                print(f"停止失败: {str(e)}")
                raise
            finally:
                if self._yaml_file and os.path.exists(self._yaml_file):
                    try:
                        os.unlink(self._yaml_file)
                        print(f"已删除临时配置文件: {self._yaml_file}")
                    except Exception as e:
                        print(f"删除配置文件失败: {str(e)}")

    def get_status(self) -> Dict[str, Any]:
        """获取转换状态"""
        with self._lock:
            if not self.process:
                print("\n=== 转换状态 ===")
                print("状态: 未运行")
                print(f"错误信息: {self.error if self.error else '无'}")
                print("================\n")
                
                return {
                    'status': self.status,
                    'message': '没有正在进行的转换',
                    'error': self.error
                }
            
            return_code = self.process.poll()
            print(f"\n=== 进程状态 ===")
            print(f"返回码: {return_code}")
            print(f"YAML配置文件: {self._yaml_file}")
            print(f"输出目录: {self._output_dir}")
            
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
                            print(line.strip())
                    except (IOError, OSError) as e:
                        print(f"读取标准输出时出错: {str(e)}")

                if self.process.stderr:
                    try:
                        print("\n=== 标准错误 ===")
                        while True:
                            line = self.process.stderr.readline()
                            if not line:
                                break
                            stderr_data += line
                            print(line.strip())
                    except (IOError, OSError) as e:
                        print(f"读取标准错误时出错: {str(e)}")
                            
            except Exception as e:
                error_msg = f"读取输出时发生错误: {str(e)}"
                print(f"\n=== 错误 ===")
                print(error_msg)
            

            if return_code is None:
                # 进程仍在运行
                status_data = {
                    'status': 'running',
                    'message': '转换进行中',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'error': None
                }
            elif return_code == 0:
                # 进程正常结束
                status_data = {
                    'status': 'completed',
                    'message': '转换已完成',
                    'stdout': stdout_data,
                    'stderr': stderr_data,
                    'error': None
                }
                # 清理临时文件
                if self._yaml_file and os.path.exists(self._yaml_file):
                    try:
                        os.unlink(self._yaml_file)
                        print(f"已删除临时配置文件: {self._yaml_file}")
                    except Exception as e:
                        print(f"删除配置文件失败: {str(e)}")
            else:
                # 进程异常结束
                error_msg = stderr_data if stderr_data else f'转换异常终止，返回码：{return_code}'
                status_data = {
                    'status': 'stopped',
                    'message': '转换异常终止',
                    'error': error_msg,
                    'stdout': stdout_data,
                    'stderr': stderr_data
                }
                # 清理临时文件
                if self._yaml_file and os.path.exists(self._yaml_file):
                    try:
                        os.unlink(self._yaml_file)
                        print(f"已删除临时配置文件: {self._yaml_file}")
                    except Exception as e:
                        print(f"删除配置文件失败: {str(e)}")
            
            print("\n=== 返回数据 ===")
            print(status_data)
            print("================\n")
            
            return status_data

# 全局转换进程管理器
conversion_process = ConversionProcess()
