import torch

def detect_device():
    # 检测是否有可用的CUDA设备
    gpu_available = torch.cuda.is_available()
    cuda_device_count = torch.cuda.device_count() if gpu_available else 0
    
    # 获取GPU信息
    gpu_info = []
    if gpu_available:
        for i in range(cuda_device_count):
            gpu_info.append({
                'index': i,
                'name': torch.cuda.get_device_name(i),
                'memory': torch.cuda.get_device_properties(i).total_memory
            })
    
    return {
        'gpu_available': gpu_available,
        'default_device': 'gpu' if gpu_available else 'cpu',
        'gpu_count': cuda_device_count,
        'gpu_info': gpu_info
    } 