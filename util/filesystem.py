import os
from pathlib import Path
from typing import List, Dict, Optional
import yaml
import glob

def list_directory(path: str, include_files: bool = False, file_pattern: Optional[str] = None) -> Dict:
    """列出指定目录下的内容
    
    Args:
        path: 目录路径
        include_files: 是否包含文件
        file_pattern: 文件匹配模式（例如：*.pt）
    """
    try:
        print(f"正在列出目录: {path}")
        print(f"包含文件: {include_files}")
        print(f"文件模式: {file_pattern}")
        
        # 确保路径存在
        if not os.path.exists(path):
            raise FileNotFoundError(f"路径不存在: {path}")
            
        # 确保是目录
        if not os.path.isdir(path):
            raise NotADirectoryError(f"不是目录: {path}")
            
        # 获取目录内容
        items = []
        
        # 添加目录
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                items.append({
                    'name': item,
                    'path': item_path,
                    'type': 'directory'
                })
                print(f"找到目录: {item_path}")
        
        # 添加文件（如果需要）
        if include_files:
            if file_pattern:
                # 处理多个文件模式
                patterns = [p.strip() for p in file_pattern.strip('{}').split(',')]
                print(f"处理文件模式: {patterns}")
                
                for pattern in patterns:
                    full_pattern = os.path.join(path, pattern)
                    print(f"搜索模式: {full_pattern}")
                    matching_files = glob.glob(full_pattern)
                    print(f"匹配到的文件: {matching_files}")
                    
                    for file_path in matching_files:
                        if os.path.isfile(file_path):
                            items.append({
                                'name': os.path.basename(file_path),
                                'path': file_path,
                                'type': 'file'
                            })
                            print(f"添加文件: {file_path}")
            else:
                # 列出所有文件
                for item in os.listdir(path):
                    item_path = os.path.join(path, item)
                    if os.path.isfile(item_path):
                        items.append({
                            'name': item,
                            'path': item_path,
                            'type': 'file'
                        })
                        print(f"添加文件: {item_path}")
                
        # 按类型和名称排序，并去重
        seen = set()
        unique_items = []
        for item in items:
            item_key = (item['path'], item['type'])
            if item_key not in seen:
                seen.add(item_key)
                unique_items.append(item)
        
        unique_items.sort(key=lambda x: (x['type'] != 'directory', x['name'].lower()))
        
        print(f"最终项目列表: {unique_items}")
        return {
            'status': 'success',
            'current_path': path,
            'items': unique_items
        }
        
    except Exception as e:
        print(f"发生错误: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }

def verify_dataset_structure(dataset_path: str) -> None:
    """验证数据集目录结构"""
    # 检查必需的目录
    required_dirs = [
        os.path.join(dataset_path, 'images', 'train'),
        os.path.join(dataset_path, 'images', 'val'),
        os.path.join(dataset_path, 'labels', 'train'),
        os.path.join(dataset_path, 'labels', 'val')
    ]
    
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            raise FileNotFoundError(f"数据集目录结构不完整，缺少目录: {dir_path}")

def create_yaml_config(dataset_path: str, num_classes: int, labels: List[str], kpt_shape: Optional[List[int]]) -> str:
    """创建YAML配置文件"""
    try:
        print(f"创建YAML配置文件: {dataset_path}, {num_classes}, {labels}, {kpt_shape}")
        # 确保数据集路径存在
        dataset_path = os.path.abspath(dataset_path)
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"数据集路径不存在: {dataset_path}")
            
        # 检查训练和验证集目录
        train_path = os.path.join(dataset_path, 'images', 'train')
        val_path = os.path.join(dataset_path, 'images', 'val')
        
        if not os.path.exists(train_path):
            raise FileNotFoundError(f"训练集目录不存在: {train_path}")
        if not os.path.exists(val_path):
            raise FileNotFoundError(f"验证集目录不存在: {val_path}")
            
        # 创建配置文件内容
        config = {
            'train': train_path,  # 训练集的绝对路径
            'val': val_path,      # 验证集的绝对路径
            'nc': num_classes,    # 类别数量
            'names': labels       # 类别名称列表
        }
        if kpt_shape:
            config['kpt_shape'] = kpt_shape
        print(config)
        # 保存配置文件
        config_dir = Path(__file__).parent.parent / "models" / "model_train" / "YOLO" / "yolov5_v2.0" / "data"
        config_dir.mkdir(parents=True, exist_ok=True)
        
        yaml_path = config_dir / "custom_dataset.yaml"
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.safe_dump(config, f, allow_unicode=True, sort_keys=False)
            
        return str(yaml_path)
        
    except Exception as e:
        raise RuntimeError(f"创建配置文件失败: {str(e)}") 