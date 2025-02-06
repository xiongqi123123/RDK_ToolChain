# (伪)RDK可视化模型转换工具

> 作者：SkyXZ
>
> CSDN：[SkyXZ～-CSDN博客](https://blog.csdn.net/xiongqi123123?spm=1000.2115.3001.5343)
>
> 博客园：[SkyXZ - 博客园](https://www.cnblogs.com/SkyXZ)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;之前在使用的RDK X3的时候，吴诺老师@wunuo发布了[新一代量化转换工具链使用教程](https://developer.d-robotics.cc/forumDetail/219287410792732160?key=1)，这个工具非常的方便，能非常快速的完成X3上模型的量化，唯一的缺点便是不支持X5，于是我便想着仿照老师的X3可视化工具链来弄一个适配X5的可视化量化转换工具链，我的初步构想便是这个可视化工具链能够逐步适配地瓜ModelZoo里的所有模型，能够更加轻松便捷的服务新拿到RDK的同学们，<font color="orange">于是在经过一段时间的努力后，我的工具链初版完成啦！</font>，但是很遗憾目前仅支持Yolov5-V2.0的版本，其他的版本将会在不久的将来陆续的适配！！！

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;现在这个版本非常的粗糙，本来都有点不敢发出来的，希望大家能够多多提出意见帮助这个项目改进！（qaq：JS太难了）

项目地址：https://github.com/xiongqi123123/RDK_ToolChain.git

使用方法：

1. 直接使用：

```bash
# step 1 ：clone 仓库
https://github.com/xiongqi123123/RDK_ToolChain.git
# step 2 ：下载RDK OE包并解压
wget -c ftp://x5ftp@vrftp.horizon.ai/OpenExplorer/v1.2.8_release/horizon_x5_open_explorer_v1.2.8-py310_20240926.tar.gz --ftp-password=x5ftp@123$%
tar -zxvf horizon_x5_open_explorer_v1.2.8-py310_20240926.tar.gz
# step 2 : 安装依赖
#将OE包中的package/host/ 复制进项目下的util工具包内
cp -r horizon_x5_open_explorer_v1.2.8-py310_20240926/package/host/* ../../../../Learning/ToolChain/util/
pip3 install -r requirements.txt 
pip3 install -e util/host/ai_toolchain/*
# step 3 ：运行即可
python3 app.py
```

2. Docker使用：正在制作镜像ing

![image-20250206181408794](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250206181436795-617338803.png)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在模型训练界面我们可以选择我们需要训练的模型以及数据集的地址直接开始训练！

![image-20250206181610544](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250206181638032-186662150.png)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;其他部分展示如下：

![image-20250206181724380](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250206181751903-1846498819.png)

![image-20250206181732796](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250206181800320-1382504892.png)

![image-20250206181744179](https://img2023.cnblogs.com/blog/3505969/202502/3505969-20250206181811837-1846913704.png)