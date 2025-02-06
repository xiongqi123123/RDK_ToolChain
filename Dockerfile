# 使用NVIDIA CUDA基础镜像
FROM nvcr.io/nvidia/cuda:11.6.2-cudnn8-devel-ubuntu20.04

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Shanghai

# 配置apt源为阿里云源
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3.10-distutils \
    git \
    wget \
    curl \
    graphviz \
    graphviz-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装pip
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10

# 配置pip镜像源
RUN mkdir -p /root/.pip && \
    echo "[global]" > /root/.pip/pip.conf && \
    echo "index-url = https://pypi.tuna.tsinghua.edu.cn/simple" >> /root/.pip/pip.conf && \
    echo "timeout = 1000" >> /root/.pip/pip.conf && \
    echo "trusted-host = pypi.tuna.tsinghua.edu.cn" >> /root/.pip/pip.conf

# 升级pip
RUN python3.10 -m pip install --upgrade pip

# 分步安装Python依赖
COPY requirements.txt .
RUN python3.10 -m pip install flask>=2.0.0 flask-socketio>=5.1.0 python-socketio>=5.4.0 eventlet>=0.30.0 && \
    python3.10 -m pip install pip==24.0 setuptools wheel cython==0.29.33 absl-py==1.3.0 && \
    python3.10 -m pip install torch==1.13.0 torchvision==0.14.0 -f https://download.pytorch.org/whl/cu116 && \
    python3.10 -m pip install -r requirements.txt

# 复制项目文件
COPY . .

# 安装AI工具链
WORKDIR /app/util/host/ai_toolchain
RUN python3.10 -m pip install hbdk-3.49.15-cp310-cp310-linux_x86_64.whl && \
    python3.10 -m pip install hbdk_model_verifier-3.49.15-py3-none-linux_x86_64.whl && \
    python3.10 -m pip install horizon_nn-1.1.0-cp310-cp310-linux_x86_64.whl && \
    python3.10 -m pip install horizon_nn_gpu-1.1.0-cp310-cp310-linux_x86_64.whl && \
    python3.10 -m pip install horizon_plugin_profiler-2.3.6-py3-none-any.whl && \
    python3.10 -m pip install horizon_plugin_pytorch-2.3.6+cu116.torch1130-cp310-cp310-linux_x86_64.whl && \
    python3.10 -m pip install horizon_torch_samples-2.3.8-py3-none-any.whl && \
    python3.10 -m pip install horizon_tc_ui-1.24.3-cp310-cp310-linux_x86_64.whl

# 返回工作目录
WORKDIR /app

# 暴露端口
EXPOSE 5000

# 设置启动命令
CMD ["python3.10", "app.py"] 