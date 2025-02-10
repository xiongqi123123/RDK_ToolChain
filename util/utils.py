import yaml
import os
def generate_dataset_yaml(dataset_path, num_classes, labels):
    """
    生成数据集的yaml配置文件
    """
    dataset_path = os.path.abspath(dataset_path)
    if not os.path.exists(dataset_path):
        raise ValueError(f"数据集路径不存在: {dataset_path}")
    
    train_path = os.path.join(dataset_path, 'images/train')
    val_path = os.path.join(dataset_path, 'images/val')
    
    if not os.path.exists(train_path):
        raise ValueError(f"训练集路径不存在: {train_path}")
    if not os.path.exists(val_path):
        val_path = train_path
    
    yaml_config = {
        'train': train_path,
        'val': val_path,
        'nc': num_classes, 
        'names': labels if isinstance(labels, list) else [labels]  
    }
    
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    yaml_path = os.path.join(base_dir, 'models/model_train/YOLO/yolov5_v2.0/data', 'custom_dataset.yaml')
    os.makedirs(os.path.dirname(yaml_path), exist_ok=True)
    
    with open(yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_config, f, allow_unicode=True, default_flow_style=None)
    
    return yaml_path