# 使用NVIDIA CUDA基础镜像
FROM nvcr.io/nvidia/cuda:11.6.2-cudnn8-devel-ubuntu20.04

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Shanghai

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    wget \
    curl \
    graphviz \
    graphviz-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# 复制项目文件
COPY . .

# 安装AI工具链
RUN cd util/host/ai_toolchain && \
    pip3 install -e .

# 暴露端口
EXPOSE 5000

# 设置启动命令
CMD ["python3", "app.py"] 