import yaml
import os
def generate_dataset_yaml(dataset_path, num_classes, labels):
    """
    生成数据集的yaml配置文件
    """
    # 确保路径存在
    dataset_path = os.path.abspath(dataset_path)
    if not os.path.exists(dataset_path):
        raise ValueError(f"数据集路径不存在: {dataset_path}")
    
    # 检查数据集目录结构
    train_path = os.path.join(dataset_path, 'images/train')
    val_path = os.path.join(dataset_path, 'images/val')
    
    if not os.path.exists(train_path):
        raise ValueError(f"训练集路径不存在: {train_path}")
    if not os.path.exists(val_path):
        # 如果验证集不存在，使用训练集作为验证集
        val_path = train_path
    
    # 构建yaml配置
    yaml_config = {
        'train': train_path,
        'val': val_path,
        'nc': num_classes,  # number of classes
        'names': labels     # class names
    }
    
    # 保存yaml文件
    yaml_path = os.path.join('models/model_train/YOLO/yolov5_v2.0/data', 'custom_dataset.yaml')
    os.makedirs(os.path.dirname(yaml_path), exist_ok=True)
    
    with open(yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_config, f, allow_unicode=True)
    
    return yaml_path