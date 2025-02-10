# 使用支持 CUDNN 8 的 CUDA 基础镜像
FROM nvcr.io/nvidia/cuda:11.8.0-cudnn8-devel-ubuntu22.04

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    DEBIAN_FRONTEND=noninteractive \
    CUDA_HOME=/usr/local/cuda-11.8 \
    PATH=/usr/local/cuda/bin:$PATH \
    LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/cuda/extras/CUPTI/lib64:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH 


# 设置为中国国内源
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装Python 3.10和系统依赖（添加 git 以便克隆源码）
RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
       python3.10 \
       python3.10-dev \
       python3.10-distutils \
       python3-pip \
       build-essential \
       curl \
       libx11-6 \
       libxext6 \
       libxrender1 \
       libxtst6 \
       libxi6 \
       libgl1-mesa-glx \
       python3-vtk9 \
       libvtk9-dev \
       gcc \
       g++ \
       cython3 \
       python3-numpy \
       git \
       python3.10-venv \
    && rm -rf /var/lib/apt/lists/* \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1 \
    && update-alternatives --set python3 /usr/bin/python3.10 \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10

# 设置pip源为清华源
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 创建工作目录
WORKDIR /app

# 预先安装 matplotlib 及其依赖
RUN pip install --no-cache-dir \
    matplotlib>=2.1.0 \
    python-dateutil>=2.7 \
    pillow>=8 \
    packaging>=20.0 \
    kiwisolver>=1.3.1 \
    fonttools>=4.22.0

# 安装基础依赖
RUN pip install --no-cache-dir numpy==1.26.1 cython

# 安装 pycocotools
COPY deps/cocoapi /app/deps/cocoapi
RUN cd /app/deps/cocoapi/PythonAPI && \
    python3 setup.py build_ext install && \
    cd ../..

# 复制本地 wheel 包和 requirements 文件
COPY deps/wheels/*.whl ./deps/wheels/
COPY requirements_docker.txt .

# 修改安装命令，分开执行
RUN pip install --no-cache-dir --no-deps --ignore-installed -r requirements_docker.txt

# 复制项目文件
COPY . .

# 确保CUDA相关库文件存在并更新库缓存
RUN ldconfig && \
    ln -s /usr/lib/x86_64-linux-gnu/libcudnn.so.8 /usr/local/cuda/lib64/libcudnn.so.8
RUN python3 -m venv /opt/label-studio && \
    . /opt/label-studio/bin/activate && \
    pip install --no-cache-dir label-studio==1.11.0 && \
    deactivate

# 复制并设置启动脚本权限
COPY start_services.sh /app/
RUN chmod +x /app/start_services.sh

# 暴露端口
EXPOSE 5000 8080

# 使用启动脚本
CMD ["/app/start_services.sh"]

