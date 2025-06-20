# RDK Next-Generation Model Conversion Visualization Tool! It's Here!!!

> Author: SkyXZ  
> CSDN: [SkyXZ～-CSDN Blog](https://blog.csdn.net/xiongqi123123?spm=1000.2115.3001.5343)  
> Blog Garden: [SkyXZ - Blog Garden](https://www.cnblogs.com/SkyXZ)

[English](README.md) | [简体中文](README_cn.md)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Previously, when using the RDK X3, Teacher Wu Nuo (@wunuo) released the [New Generation Quantization Conversion Toolchain Tutorial](https://developer.d-robotics.cc/forumDetail/219287410792732160?key=1). This tool was incredibly convenient and allowed for quick model quantization on the X3. However, the only drawback was that it didn't support the X5. So, I decided to create a similar toolchain for the X5, inspired by Teacher Wu's X3 visualization tool. My goal was to make this visualization toolchain adaptable to all models in the Digua ModelZoo, offering a one-stop solution from model training to conversion and deployment. This would make it easier and more convenient for new RDK users.<font color="orange">After some time and effort, I'm proud to announce the first version of my toolchain is now ready!</font>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The current new toolchain has been upgraded to V2.0, with optimized UI display and added page persistence functionality - the system automatically records current logs and background processes when you switch pages, and automatically restores them when you return! It also supports online training and export for most classification models. Most importantly, the visualization toolchain now supports direct inference on development machines using the intermediate product "quantion.onnx" from model compilation, allowing for quick validation of quantized model performance!!!

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hope everyone can provide feedback and suggestions to help improve this project!!! (qaq: JS is really hard!) Device management functionality will be added in the future!!!

- Project URL: https://github.com/xiongqi123123/RDK_ToolChain.git (Please give it a Star~ The repository only contains the frontend and backend code; model and weight files have not been modified. The full version can be downloaded from the cloud drive.)
- Cloud Drive: https://pan.baidu.com/s/1fz_DueWNr3uKDLO7KkNwZw?pwd=7jy3

## Usage Instructions:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font color="red">**Default launch address: 127.0.0.1:5000**</font>

Docker installation guide: [Linux Docker and Nvidia Container Toolkit Installation Guide - SkyXZ - Blog Garden](https://www.cnblogs.com/SkyXZ/p/18710410)

1. **Using Docker (Recommended):**

```bash
# Step 1: Pull the Docker image (Aliyun repository)
docker pull crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
# Step 2: Create a folder mapping
mkdir ~/dataset
export dataset_path=~/dataset
# Run-Method-1: Create a temporary container (modify --shm-size configuration as needed)
docker run -it --rm --gpus all --shm-size=32g --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
# Run-Method-2: Create a permanent container (modify --shm-size configuration as needed)
docker run -it --rm --gpus all --shm-size={your memory size e.g., 32g} --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
```

2. **Build Docker Image Manually:**

```bash
# Step 1: Download the source code from Baidu Cloud (only front-end and back-end implementations in the repository)
https://pan.baidu.com/s/1fz_DueWNr3uKDLO7KkNwZw?pwd=7jy3
# Step 2: Extract and navigate to the project directory
# Step 3: Build the Docker image
docker build -t rdk_toolchain .
# Step 4: Create a folder mapping
mkdir ~/dataset
export dataset_path=~/dataset
# Run-Method-1: Create a temporary container (modify --shm-size configuration as needed)
docker run -it --rm --gpus all --shm-size=32g --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
# Run-Method-2: Create a permanent container (modify --shm-size configuration as needed)
docker run -it --rm --gpus all --shm-size={your memory size e.g., 32g} --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
```

3. **Directly Download the Source Code:**

```bash
# Step 1: Download the source code from Baidu Cloud (only front-end and back-end implementations in the repository)
https://pan.baidu.com/s/1fz_DueWNr3uKDLO7KkNwZw?pwd=7jy3
# Step 2: Install dependencies
pip3 install -r requirements_docker.txt
# Step 3: Run the script
bash start_services.sh
```

## Important Notes:

1. When stopping a task (e.g., training), the stop button may sometimes be unresponsive. This does not mean the system is frozen! It's attempting to terminate the process, and you can click "Stop" again after a few seconds to exit.
2. Red-colored logs do not necessarily indicate errors! Check the training status indicators to determine whether the process ended due to an error.
3. <font color="red">Except for the exported ONNX model, which will be saved in the original pt model path, all other results will be stored in /app/logs.</font>

## Version Information:

### V1.0:

1. Supports quantization and conversion for all models
2. Complete implementation of YOLO series training and export in ModelZoo
3. Support for ResNet series models, FCOS, etc., coming soon (TODO for V2.0)
4. PC-side converted model inference check coming soon (TODO for V2.0)

### V2.0:

1. Supports quantization and conversion for common classification models
2. Added web page state persistence - no need to worry about losing state when switching pages!
3. Fixed some bugs, optimized some features, and improved some ugly interfaces
4. Added model size settings for training and export sections

## Features of Digua Robot RDK One-Stop Model Development Tool:

- Tool Overview:

![index](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211041612388-1237210810.gif)

- Model Training:

![train](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211102126870-668114243.gif)

- Model Export:

![export](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101319375-1721871882.gif)

- Model Quantization Check:

![quar](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101333453-1711485780.gif)

- Model Conversion:

![conven](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101354986-853288097.gif)

- Dequantization Node Removal:

![delete](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101445603-555712188.gif)

- Model Input/Output Visualization Check:

![detection](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211043209164-1280903742.gif)

## New Features Overview:

- Page Persistence:

![Page Persistence 1](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132659628-1173589162.png)

![Page Persistence 2](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132708476-1539986621.png)

- Model Online Testing:

![Model Testing](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132642500-1481771766.png)

- UI Optimization:

![UI Optimization](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132646619-178736133.png)

- Classification Model Training and Export Support:

![Classification Support](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132652390-315881097.png)

