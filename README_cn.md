# RDK新一代模型转换可视化工具！他来啦！！！

> 作者：SkyXZ
>
> CSDN：[SkyXZ～-CSDN博客](https://blog.csdn.net/xiongqi123123?spm=1000.2115.3001.5343)
>
> 博客园：[SkyXZ - 博客园](https://www.cnblogs.com/SkyXZ)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;之前在使用的RDK X3的时候，吴诺老师@wunuo发布了[新一代量化转换工具链使用教程](https://developer.d-robotics.cc/forumDetail/219287410792732160?key=1)，这个工具真的非常的方便，能非常快速的完成X3上模型的量化，唯一的缺点便是不支持X5，于是我便想着仿照老师的X3可视化工具链来弄一个适配X5的可视化量化转换工具链，我的初步构想便是这个可视化工具链能够逐步适配地瓜ModelZoo里的所有模型实现一站式从模型的训练到模型的转换最后到部署，使之能够更加轻松便捷的服务新拿到RDK的同学们，<font color="orange">于是在经过一段时间的努力后，我的工具链初版完成啦！</font>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;目前新版工具链已经升级到了V2.0版本，优化了部分的UI显示，新增了页面保持，在切换页面的时候系统会自动记录当前的日志及后台进程，在您切换回当前页面的时候会自动恢复！同时支持了大部分的分类模型的在线训练与导出，最最最重要的是！现在的可视化工具链支持使用模型编译的中间产物"quantion.onnx"直接在开发机上执行推理！可以快速验证量化后的模型效果啦！！！

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;希望大家能够多多提出意见帮助这个项目改进！！！（qaq：JS真的太难了）后续会增加开发板管理功能！！！

- 项目地址：https://github.com/xiongqi123123/RDK_ToolChain.git （求求Star~仓库中仅有前后端代码没有修改过的模型及权重文件，完整版请从网盘下载）
- 项目网盘：https://pan.baidu.com/s/1fz_DueWNr3uKDLO7KkNwZw?pwd=7jy3

### **使用方法：**

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font color="red">**默认启动地址：127.0.0.1:5000**  </font>

Docker安装详见：[Linux下Docker及Nvidia Container ToolKit安装教程 - SkyXZ - 博客园](https://www.cnblogs.com/SkyXZ/p/18710410)

1. **Docker使用（推荐）：**

```bash
# step 1 拉取docker镜像（阿里云仓库）
docker pull crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
# step 2 创建文件夹映射
mkdir ~/dataset
export dataset_path=~/dataset
# Run-Method-1 临时创建容器（自行修改--shm-size配置）
docker run -it --rm --gpus all --shm-size=32g --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
# Run-Method-2 永久创建容器（自行修改--shm-size配置）
docker run -it --rm --gpus all --shm-size={你的内存大小例如：32g} --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
```

2. **手动构建docker镜像：**

```bash
# step 1 ：从百度云下载源码（仓库中仅有前端后端实现）
https://pan.baidu.com/s/1fz_DueWNr3uKDLO7KkNwZw?pwd=7jy3
# step 2 解压并进入项目目录
# step 3 构建docker
docker build -t rdk_toolchain .
# step 4 创建文件夹映射
mkdir ~/dataset
export dataset_path=~/dataset
# Run-Method-1 临时创建容器（自行修改--shm-size配置）
docker run -it --rm --gpus all --shm-size=32g --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
# Run-Method-2 永久创建容器（自行修改--shm-size配置）
docker run -it --rm --gpus all --shm-size={你的内存大小例如：32g} --ipc=host -e PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128 -e CUDA_LAUNCH_BLOCKING=1 -p 5000:5000 -p 8080:8080 -v "$dataset_path":/data crpi-0uog49363mcubexr.cn-hangzhou.personal.cr.aliyuncs.com/skyxz/rdk_toolchain:v2.0
```

3. **直接下载源码使用：**

```bash
# step 1 ：从百度云下载源码（仓库中仅有前端后端实现）
https://pan.baidu.com/s/1fz_DueWNr3uKDLO7KkNwZw?pwd=7jy3
# step 2 : 安装依赖
pip3 install -r requirements_docker.txt
# step 3 ：运行脚本即可
bash start_services.sh
```

### **注意事项：**

1. 当停止某项操作时（如停止训练）有时停止按钮可能会卡住无反应，这不是卡死了！这是后台正在尝试杀死进程中，几秒后再次点击停止即可退出！
2. 部分日志输出为红色不一定是报错！进程是否因为报错结束请以训练状态标志为准！
3. <font color="red">除了模型导出的onnx会放在原pt模型路径下之外，其他所有运行的结果将保存在/app/logs下</font>

### **版本介绍：**

#### V1.0:

1. 已支持所有模型的量化转换操作
2. 已完成ModelZoo中YOLO全系列的训练与导出实现
3. 即将支持ResNet系列模型、FCOS等模型（TODO V2.0）
4. 即将实现PC端转换后模型推理检查（TODO V2.0）

#### V2.0：

1. 已支持常见分类模型的量化转换操作
2. 增加网页保持状态功能，切换页面不用担心状态丢失啦！
3. 修复了部分BUG，优化了部分功能，也优化了部分丑陋的界面
4. 新增了训练及导出部分模型尺寸的设置

### **地瓜机器人RDK模型一站式开发工具功能展示：**

- 工具总览：

![index](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211041612388-1237210810.gif)

- 模型训练：

![train](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211102126870-668114243.gif)

- 模型导出

![export](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101319375-1721871882.gif)

- 模型量化检查

![quar](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101333453-1711485780.gif)

- 模型转换

![conven](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101354986-853288097.gif)

- 反量化节点摘除

![delete](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211101445603-555712188.gif)

- 模型输入输出情况及可视化检查

![detection](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250211043209164-1280903742.gif)

### **新功能一览：**

- 页面保持：

![5667aff9d17558122512ef421c04ac5](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132659628-1173589162.png)

![b7788f273295383c3f53058c931cf14](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132708476-1539986621.png)

- 模型在线测试：

![87ea63e279fd7eaf29de7e93c40670a](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132642500-1481771766.png)

- UI优化：

![12cf3ace9c6478561e6efb11ce6e6f6](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132646619-178736133.png)

- 分类模型训练及导出支持：

![dc7c71d57420af1e6c15117342eb492](https://img2023.cnblogs.com/blog/3505969/202506/3505969-20250611132652390-315881097.png)