#!/usr/bin/env python3
"""
快速SSH连接测试脚本
用于验证开发板连接是否正常
"""

import paramiko
import sys
import socket

def test_ssh_connection(ip, port, username, password):
    """测试SSH连接"""
    print(f"测试SSH连接: {username}@{ip}:{port}")
    
    try:
        # 首先测试网络连通性
        print("1. 测试网络连通性...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((ip, port))
        sock.close()
        
        if result != 0:
            print(f"❌ 网络连接失败，错误码: {result}")
            return False
        else:
            print("✅ 网络连接正常")
        
        # 创建SSH客户端
        print("2. 创建SSH连接...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 连接
        ssh.connect(
            hostname=ip,
            port=port,
            username=username,
            password=password,
            timeout=5,
            auth_timeout=5,
            banner_timeout=5
        )
        print("✅ SSH连接成功")
        
        # 测试命令执行
        print("3. 测试命令执行...")
        stdin, stdout, stderr = ssh.exec_command('echo "test"; uname -a', timeout=10)
        
        # 设置读取超时
        stdout.channel.settimeout(5.0)
        stderr.channel.settimeout(5.0)
        
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        
        print(f"✅ 命令输出: {output}")
        if error:
            print(f"错误输出: {error}")
        
        ssh.close()
        print("✅ 连接测试完成")
        return True
        
    except paramiko.AuthenticationException as e:
        print(f"❌ 认证失败: {e}")
        return False
    except paramiko.SSHException as e:
        print(f"❌ SSH错误: {e}")
        return False
    except socket.timeout as e:
        print(f"❌ 连接超时: {e}")
        return False
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

if __name__ == "__main__":
    # 测试参数（根据您的实际情况修改）
    IP = "172.18.64.1"  # 通过代理访问
    PORT = 22222        # 代理端口
    USERNAME = "root"   # 开发板用户名
    PASSWORD = "your_password"  # 请替换为实际密码
    
    if len(sys.argv) >= 5:
        IP = sys.argv[1]
        PORT = int(sys.argv[2])
        USERNAME = sys.argv[3]
        PASSWORD = sys.argv[4]
    
    print("=== SSH连接测试 ===")
    print(f"目标: {USERNAME}@{IP}:{PORT}")
    
    success = test_ssh_connection(IP, PORT, USERNAME, PASSWORD)
    
    if success:
        print("\n🎉 测试成功！开发板连接正常")
    else:
        print("\n❌ 测试失败，请检查连接参数")
        print("\n建议检查：")
        print("1. 开发板是否开机并连接到网络")
        print("2. SSH服务是否启动 (sudo systemctl status ssh)")
        print("3. IP地址和端口是否正确")
        print("4. 用户名和密码是否正确")
        print("5. 防火墙是否阻挡了连接")
