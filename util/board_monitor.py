import paramiko
import json
import re
import time
import socket
from typing import Dict, Any, Optional
import threading
import logging
import sys

# 只在需要时启用SSH调试日志
# logging.basicConfig(level=logging.DEBUG)
# paramiko.util.log_to_file('/tmp/paramiko.log', level=logging.DEBUG)

class BoardMonitor:
    def __init__(self):
        self.ssh_client: Optional[paramiko.SSHClient] = None
        self.connected = False
        self.connection_info = {}
        self.last_status = {}
        self._lock = threading.Lock()
        self.device_name = ""
        self.device_num = -1
        self.device_info = {}
        
    def connect(self, ip: str, username: str, password: str, port: int = 22) -> Dict[str, Any]:
        """连接到开发板"""
        with self._lock:
            try:
                print(f"[DEBUG] 开始连接流程，时间: {time.time()}")
                print(f"尝试连接到开发板: {username}@{ip}:{port}")
                
                # 首先检查网络连通性
                print("检查网络连通性...")
                if not self._check_network_connectivity(ip, port):
                    raise Exception(f"无法连接到 {ip}:{port}，请检查网络连接和IP地址")
                
                print("网络连通性检查完成，继续下一步...")
                
                # 断开现有连接（不使用锁，因为已经在锁内）
                print("断开现有连接...")
                if self.ssh_client:
                    try:
                        self.ssh_client.close()
                    except:
                        pass
                    finally:
                        self.ssh_client = None
                        self.connected = False
                        self.connection_info = {}
                print("现有连接已断开")
                
                # 预先添加主机密钥以避免交互提示
                try:
                    import subprocess
                    import os
                    print("预先获取主机密钥...")
                    # 使用ssh-keyscan获取主机密钥并添加到known_hosts
                    cmd = f"ssh-keyscan -p {port} {ip}"
                    print(f"执行命令: {cmd}")
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
                    print(f"ssh-keyscan 返回码: {result.returncode}")
                    if result.stdout:
                        print(f"ssh-keyscan 输出: {result.stdout[:100]}...")
                    if result.stderr:
                        print(f"ssh-keyscan 错误: {result.stderr}")
                        
                    if result.returncode == 0 and result.stdout:
                        # 将密钥追加到known_hosts文件
                        ssh_dir = os.path.expanduser("~/.ssh")
                        if not os.path.exists(ssh_dir):
                            os.makedirs(ssh_dir, mode=0o700)
                            print(f"创建SSH目录: {ssh_dir}")
                        known_hosts_file = os.path.join(ssh_dir, "known_hosts")
                        with open(known_hosts_file, "a") as f:
                            f.write(result.stdout)
                        print(f"主机密钥已添加到: {known_hosts_file}")
                    else:
                        print(f"获取主机密钥失败，返回码: {result.returncode}")
                except Exception as e:
                    print(f"添加主机密钥时出错（可忽略）: {type(e).__name__}: {e}")
                
                # 创建新的SSH客户端
                self.ssh_client = paramiko.SSHClient()
                # 自动接受未知主机密钥，避免首次连接的交互提示
                self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                
                print("正在建立SSH连接...")
                print(f"连接参数: hostname={ip}, port={port}, username={username}, timeout=20")
                
                # 连接到开发板，增加超时时间适应WSL环境
                start_time = time.time()
                self.ssh_client.connect(
                    hostname=ip,
                    port=port,
                    username=username,
                    password=password,
                    timeout=20,           # 进一步增加连接超时
                    auth_timeout=15,      # 增加认证超时
                    banner_timeout=15,    # 增加横幅超时
                    look_for_keys=False,  # 不查找SSH密钥
                    allow_agent=False     # 不使用SSH代理
                )
                connect_time = time.time() - start_time
                print(f"SSH连接建立耗时: {connect_time:.2f}秒")
                
                print("SSH连接已建立，正在测试连接...")
                
                # 检查连接状态
                transport = self.ssh_client.get_transport()
                if transport is None:
                    raise Exception("SSH transport 为空")
                
                if not transport.is_active():
                    raise Exception("SSH transport 不活跃")
                
                print("SSH transport 状态正常，执行测试命令...")
                
                try:
                    # 使用简单的测试命令
                    stdin, stdout, stderr = self.ssh_client.exec_command('echo "test"', timeout=15)
                    
                    # 设置读取超时
                    stdout.channel.settimeout(10.0)
                    stderr.channel.settimeout(10.0)
                    
                    print("命令已发送，等待结果...")
                    
                    result = stdout.read().decode().strip()
                    error_output = stderr.read().decode().strip()
                    
                    print(f"连接测试结果: '{result}'")
                    if error_output:
                        print(f"连接测试错误输出: '{error_output}'")
                    
                    # 只要能执行命令并返回结果就认为连接成功
                    if result == "test":
                        self.connected = True
                        self.connection_info = {
                            'ip': ip,
                            'username': username,
                            'port': port
                        }
                        print("连接成功！")
                        
                        # 识别设备类型
                        device_info = self._detect_device_type()
                        self.device_info = device_info
                        
                        board_info = self._get_board_info()
                        board_info.update(device_info)
                        
                        return {
                            'status': 'success',
                            'message': '连接成功',
                            'board_info': board_info
                        }
                    else:
                        raise Exception(f"连接测试失败，预期得到'test'，实际得到: '{result}'")
                        
                except socket.timeout:
                    raise Exception("命令执行超时")
                except Exception as e:
                    print(f"命令执行异常: {type(e).__name__}: {str(e)}")
                    raise
                    
            except paramiko.AuthenticationException as e:
                print(f"认证失败: {str(e)}")
                self.connected = False
                self.ssh_client = None
                return {
                    'status': 'error',
                    'message': f'认证失败，请检查用户名和密码'
                }
            except paramiko.SSHException as e:
                print(f"SSH连接错误: {str(e)}")
                self.connected = False
                self.ssh_client = None
                return {
                    'status': 'error',
                    'message': f'SSH连接错误: {str(e)}'
                }
            except Exception as e:
                print(f"连接失败: {str(e)}")
                self.connected = False
                self.ssh_client = None
                return {
                    'status': 'error',
                    'message': f'连接失败: {str(e)}'
                }
    
    def disconnect(self):
        """断开连接"""
        with self._lock:
            if self.ssh_client:
                try:
                    self.ssh_client.close()
                except:
                    pass
                finally:
                    self.ssh_client = None
                    self.connected = False
                    self.connection_info = {}
    
    def _detect_device_type(self) -> Dict[str, str]:
        """识别设备类型"""
        if not self.connected or not self.ssh_client:
            return {}
        
        try:
            # 读取设备树信息
            stdin, stdout, stderr = self.ssh_client.exec_command('cat /sys/firmware/devicetree/base/model')
            tree = stdout.read().decode().strip()
            print(f"设备树信息: {tree}")
            
            if "X3" in tree:
                self.device_name = "rdkx3"
                self.device_num = 0
                device_display_name = "RDK X3 (Module)"
                print(f"自动识别设备: {device_display_name}")
            elif "Journey 5" in tree:
                self.device_name = "rdkultra"
                self.device_num = 1
                device_display_name = "RDK Ultra"
                print(f"自动识别设备: {device_display_name}")
            elif "X5" in tree:
                self.device_name = "rdkx5"
                self.device_num = 2
                device_display_name = "RDK X5"
                print(f"自动识别设备: {device_display_name}")
            elif "S100" in tree:
                self.device_name = "rdks100"
                self.device_num = 3
                device_display_name = "RDK S100"
                print(f"自动识别设备: {device_display_name}")
            else:
                self.device_name = "unknown"
                self.device_num = -1
                device_display_name = "未支持的设备"
                print(f"未识别的设备: {tree}")
            
            return {
                'device_name': self.device_name,
                'device_num': self.device_num,
                'device_display_name': device_display_name,
                'device_tree': tree
            }
        except Exception as e:
            print(f"设备识别失败: {e}")
            return {
                'device_name': 'unknown',
                'device_num': -1,
                'device_display_name': '识别失败',
                'device_tree': ''
            }

    def _get_board_info(self) -> Dict[str, str]:
        """获取开发板基本信息"""
        if not self.connected or not self.ssh_client:
            return {}
        
        try:
            # 获取系统信息
            stdin, stdout, stderr = self.ssh_client.exec_command('uname -a')
            uname_info = stdout.read().decode().strip()
            
            # 获取发行版信息
            stdin, stdout, stderr = self.ssh_client.exec_command('cat /etc/os-release | grep PRETTY_NAME')
            os_info = stdout.read().decode().strip()
            os_name = os_info.split('=')[1].strip('"') if '=' in os_info else 'Unknown'
            
            return {
                'system': uname_info,
                'os': os_name
            }
        except:
            return {}
    
    def get_status(self) -> Dict[str, Any]:
        """获取开发板状态信息"""
        if not self.connected or not self.ssh_client:
            return {
                'status': 'disconnected',
                'message': '未连接到开发板'
            }
        
        try:
            status_data = {}
            
            # 获取CPU使用率
            cpu_usage = self._get_cpu_usage()
            if cpu_usage is not None:
                status_data['cpu'] = cpu_usage
            
            # 获取内存使用情况
            memory_info = self._get_memory_info()
            if memory_info:
                status_data['memory'] = memory_info
            
            # 获取温度信息
            temperature = self._get_temperature()
            if temperature is not None:
                status_data['temperature'] = temperature
            
            # 获取BPU使用率（RDK特有）
            bpu_usage = self._get_bpu_usage()
            if bpu_usage is not None:
                status_data['bpu'] = bpu_usage
            
            # 获取系统负载
            load_avg = self._get_load_average()
            if load_avg:
                status_data['load'] = load_avg
            
            self.last_status = status_data
            return {
                'status': 'connected',
                'data': status_data,
                'connection_info': self.connection_info,
                'timestamp': int(time.time())
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'获取状态失败: {str(e)}',
                'last_data': self.last_status
            }
    
    def _check_network_connectivity(self, ip: str, port: int) -> bool:
        """检查网络连通性"""
        try:
            socket.setdefaulttimeout(8)  # 增加网络检查超时
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex((ip, port))
            sock.close()
            if result == 0:
                print(f"网络连通性检查通过: {ip}:{port}")
                return True
            else:
                print(f"网络连通性检查失败: {ip}:{port}, 错误码: {result}")
                return False
        except Exception as e:
            print(f"网络连通性检查异常: {str(e)}")
            return False
    
    def _execute_command(self, command: str) -> Optional[str]:
        """执行SSH命令并返回结果"""
        try:
            stdin, stdout, stderr = self.ssh_client.exec_command(command)
            result = stdout.read().decode().strip()
            return result if result else None
        except:
            return None
    
    def _get_cpu_usage(self) -> Optional[float]:
        """获取CPU使用率"""
        # 使用top命令获取CPU使用率
        result = self._execute_command("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1")
        if result:
            try:
                return float(result)
            except:
                pass
        
        # 备用方法：使用vmstat
        result = self._execute_command("vmstat 1 2 | tail -1 | awk '{print 100-$15}'")
        if result:
            try:
                return float(result)
            except:
                pass
        
        return None
    
    def _get_memory_info(self) -> Optional[Dict[str, float]]:
        """获取内存信息"""
        result = self._execute_command("free -m | grep Mem")
        if result:
            try:
                # 解析内存信息
                parts = result.split()
                total = int(parts[1])
                used = int(parts[2])
                free = int(parts[3])
                available = int(parts[6]) if len(parts) > 6 else free
                
                return {
                    'total': total,
                    'used': used,
                    'free': free,
                    'available': available,
                    'usage_percent': round((used / total) * 100, 1)
                }
            except:
                pass
        
        return None
    
    def _get_temperature(self) -> Optional[float]:
        """根据设备类型获取CPU温度"""
        if self.device_name == "rdkx3":
            return self._get_temperature_rdkx3()
        elif self.device_name == "rdkultra":
            return self._get_temperature_rdkultra()
        elif self.device_name == "rdkx5":
            return self._get_temperature_rdkx5()
        elif self.device_name == "rdks100":
            return self._get_temperature_rdks100()
        else:
            return self._get_temperature_generic()
    
    def _get_temperature_rdkx3(self) -> Optional[float]:
        """获取RDK X3的CPU温度"""
        result = self._execute_command("cat /sys/class/hwmon/hwmon0/temp1_input")
        if result:
            try:
                temp = int(result.strip()) / 1000.0
                if 0 < temp < 150:
                    return round(temp, 1)
            except:
                pass
        return None
    
    def _get_temperature_rdkultra(self) -> Optional[float]:
        """获取RDK Ultra的CPU温度"""
        result = self._execute_command("cat /sys/devices/virtual/thermal/thermal_zone8/temp")
        if result:
            try:
                temp = int(result.strip()) / 1000.0
                if 0 < temp < 150:
                    return round(temp, 1)
            except:
                pass
        return None
    
    def _get_temperature_rdkx5(self) -> Optional[float]:
        """获取RDK X5的CPU温度"""
        result = self._execute_command("cat /sys/class/hwmon/hwmon0/temp3_input")
        if result:
            try:
                temp = int(result.strip()) / 1000.0
                if 0 < temp < 150:
                    return round(temp, 1)
            except:
                pass
        return None
    
    def _get_temperature_rdks100(self) -> Optional[float]:
        """获取RDK S100的CPU温度"""
        result = self._execute_command("cat /sys/devices/virtual/thermal/thermal_zone0/temp")
        if result:
            try:
                temp = int(result.strip()) / 1000.0
                if 0 < temp < 150:
                    return round(temp, 1)
            except:
                pass
        return None
    
    def _get_temperature_generic(self) -> Optional[float]:
        """通用温度获取方法"""
        # 尝试多种方法获取温度
        commands = [
            "cat /sys/class/thermal/thermal_zone0/temp",
            "cat /sys/devices/virtual/thermal/thermal_zone0/temp",
            "cat /sys/class/hwmon/hwmon0/temp1_input",
            "cat /sys/class/hwmon/hwmon0/temp3_input"
        ]
        
        for cmd in commands:
            result = self._execute_command(cmd)
            if result:
                try:
                    # 温度通常以毫度为单位
                    temp = int(result) / 1000.0
                    if 0 < temp < 150:  # 合理的温度范围
                        return round(temp, 1)
                except:
                    continue
        
        # 尝试通过sensors命令
        result = self._execute_command("sensors | grep 'Core 0' | awk '{print $3}' | cut -d'+' -f2 | cut -d'°' -f1")
        if result:
            try:
                return float(result)
            except:
                pass
        
        return None
    
    def _get_bpu_usage(self) -> Optional[Dict[str, float]]:
        """根据设备类型获取BPU使用率"""
        if self.device_name == "rdkx3":
            return self._get_bpu_usage_rdkx3()
        elif self.device_name == "rdkultra":
            return self._get_bpu_usage_rdkultra()
        elif self.device_name == "rdkx5":
            return self._get_bpu_usage_rdkx5()
        elif self.device_name == "rdks100":
            return self._get_bpu_usage_rdks100()
        else:
            return self._get_bpu_usage_generic()
    
    def _get_bpu_usage_rdkx3(self) -> Optional[Dict[str, float]]:
        """获取RDK X3的BPU使用率"""
        try:
            bpu0_result = self._execute_command("cat /sys/devices/system/bpu/bpu0/ratio")
            bpu1_result = self._execute_command("cat /sys/devices/system/bpu/bpu1/ratio")
            
            if bpu0_result and bpu1_result:
                bpu0 = float(bpu0_result.strip())
                bpu1 = float(bpu1_result.strip())
                return {
                    'bpu0': bpu0,
                    'bpu1': bpu1,
                    'average': (bpu0 + bpu1) / 2
                }
        except:
            pass
        return None
    
    def _get_bpu_usage_rdkultra(self) -> Optional[Dict[str, float]]:
        """获取RDK Ultra的BPU使用率"""
        try:
            bpu0_result = self._execute_command("cat /sys/devices/system/bpu/bpu0/ratio")
            bpu1_result = self._execute_command("cat /sys/devices/system/bpu/bpu1/ratio")
            
            if bpu0_result and bpu1_result:
                bpu0 = float(bpu0_result.strip())
                bpu1 = float(bpu1_result.strip())
                return {
                    'bpu0': bpu0,
                    'bpu1': bpu1,
                    'average': (bpu0 + bpu1) / 2
                }
        except:
            pass
        return None
    
    def _get_bpu_usage_rdkx5(self) -> Optional[Dict[str, float]]:
        """获取RDK X5的BPU和GPU使用率"""
        try:
            bpu0_result = self._execute_command("cat /sys/devices/system/bpu/bpu0/ratio")
            
            # 获取GPU使用率
            gpu_result = self._execute_command("cat /sys/kernel/debug/gc/load")
            gpu_load = 0
            if gpu_result:
                for line in gpu_result.split('\n'):
                    if 'load' in line and ':' in line:
                        try:
                            gpu_load = int(line.split(':')[1].strip().rstrip('%'))
                            break
                        except:
                            continue
            
            if bpu0_result:
                bpu0 = float(bpu0_result.strip())
                return {
                    'bpu0': bpu0,
                    'gpu': gpu_load,
                    'average': bpu0
                }
        except:
            pass
        return None
    
    def _get_bpu_usage_rdks100(self) -> Optional[Dict[str, float]]:
        """获取RDK S100的BPU使用率"""
        try:
            bpu0_result = self._execute_command("cat /sys/devices/system/bpu/bpu0/ratio")
            
            if bpu0_result:
                bpu0 = float(bpu0_result.strip())
                return {
                    'bpu0': bpu0,
                    'average': bpu0
                }
        except:
            pass
        return None
    
    def _get_bpu_usage_generic(self) -> Optional[Dict[str, float]]:
        """通用BPU使用率获取方法"""
        # 尝试获取BPU状态
        commands = [
            "cat /sys/devices/system/bpu/bpu0/ratio",
            "cat /sys/kernel/debug/bpu/bpu_status",
            "hrut_somstatus | grep BPU",
            "cat /proc/bpu/bpu_status"
        ]
        
        for cmd in commands:
            result = self._execute_command(cmd)
            if result and result.strip():
                try:
                    # 尝试解析BPU使用率
                    if "idle" in result.lower():
                        return {'average': 0.0}
                    elif "running" in result.lower():
                        return {'average': 50.0}
                    # 尝试提取数字
                    numbers = re.findall(r'\d+\.?\d*', result)
                    if numbers:
                        usage = float(numbers[0])
                        if 0 <= usage <= 100:
                            return {'average': usage}
                except:
                    continue
        
        return None
    
    def _get_load_average(self) -> Optional[Dict[str, float]]:
        """获取系统负载"""
        result = self._execute_command("uptime | awk -F'load average:' '{print $2}'")
        if result:
            try:
                loads = [float(x.strip()) for x in result.split(',')]
                if len(loads) >= 3:
                    return {
                        '1min': loads[0],
                        '5min': loads[1],
                        '15min': loads[2]
                    }
            except:
                pass
        
        return None

# 全局监控实例
board_monitor = BoardMonitor() 