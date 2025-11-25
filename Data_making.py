python
import os
import shutil
import glob
import numpy as np
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
from PIL import Image
from tqdm import tqdm
import matplotlib.pyplot as plt
import gc
import warnings
from fastai.vision.all import *
from ultralytics import YOLO

warnings.filterwarnings('ignore')

# ==========================================
# CONFIGURATION
# ==========================================
class Config:
    # INPUT PATHS
    SRC_PLANTVILLAGE = '/kaggle/input/plantvillage-dataset/color'
    SRC_PLANTDOC = '/kaggle/input/plantdec' # Adjust to your specific PlantDoc path
    
    # WORKING DIRECTORIES
    WORK_DIR = '/kaggle/working/pipeline_v2'
    
    # 1. CLASSIFIER DATA
    CLF_DATA_DIR = os.path.join(WORK_DIR, 'classifier_data')
    
    # 2. YOLO STAGE 1 DATA (PlantVillage Pseudo-Labels)
    YOLO_PV_DIR = os.path.join(WORK_DIR, 'yolo_stage1_pv')
    
    # 3. YOLO STAGE 2 DATA (PlantDoc Real Labels)
    YOLO_PD_DIR = os.path.join(WORK_DIR, 'yolo_stage2_pd')
    
    # PARAMETERS
    IMG_SIZE = 224      # Classifier size
    YOLO_SIZE = 416     # YOLO size
    CLF_EPOCHS = 8
    YOLO_S1_EPOCHS = 25 # Pre-training
    YOLO_S2_EPOCHS = 50 # Fine-tuning (Needs more to adapt to real boxes)
    
cfg = Config()

def ensure_dir(path):
    if os.path.exists(path): shutil.rmtree(path)
    os.makedirs(path, exist_ok=True)

def free_memory():
    gc.collect()
    torch.cuda.empty_cache()

print("🚀 Pipeline Configured.")

# ==========================================
# PART 1: PREPARE PLANTVILLAGE (BINARY)
# ==========================================
def prepare_plantvillage_binary():
    print("\n[1/6] Preparing PlantVillage for Binary Classification...")
    ensure_dir(cfg.CLF_DATA_DIR)
    os.makedirs(os.path.join(cfg.CLF_DATA_DIR, 'healthy'), exist_ok=True)
    os.makedirs(os.path.join(cfg.CLF_DATA_DIR, 'diseased'), exist_ok=True)
    
    diseased_count = 0
    healthy_count = 0
    
    # Keywords indicating health
    healthy_keywords = ['healthy', 'leaf'] 
    # Explicit disease keywords to avoid ambiguity
    disease_keywords = ['blight', 'rust', 'spot', 'rot', 'mold', 'virus', 'mildew', 'scab', 'mosaic', 'curl', 'mite']

    for folder in os.listdir(cfg.SRC_PLANTVILLAGE):
        src_folder = os.path.join(cfg.SRC_PLANTVILLAGE, folder)
        if not os.path.isdir(src_folder): continue
        
        folder_lower = folder.lower()
        
        # Determine class
        is_healthy = False
        if 'healthy' in folder_lower:
            is_healthy = True
        elif not any(x in folder_lower for x in disease_keywords):
            # If it's just "Peach_Leaf" with no disease info, assume healthy or skip
            # For PlantVillage, usually folders without "healthy" are diseased
            is_healthy = False 
            
        target_dir = 'healthy' if is_healthy else 'diseased'
        dst_folder = os.path.join(cfg.CLF_DATA_DIR, target_dir)
        
        files = os.listdir(src_folder)
        # Limit samples per class to speed up if needed, or take all
        for f in files:
            if f.lower().endswith(('.jpg', '.png', '.jpeg')):
                shutil.copy(os.path.join(src_folder, f), os.path.join(dst_folder, f"{folder}_{f}"))
                if is_healthy: healthy_count += 1
                else: diseased_count += 1
                
    print(f"✓ Data Prepared: Healthy: {healthy_count}, Diseased: {diseased_count}")
    return cfg.CLF_DATA_DIR

# ==========================================
# PART 2: TRAIN CLASSIFIER
# ==========================================
def train_binary_classifier(data_path):
    print("\n[2/6] Training Binary Classifier (FastAI)...")
    
    dls = ImageDataLoaders.from_folder(
        data_path,
        valid_pct=0.2,
        seed=42,
        item_tfms=Resize(cfg.IMG_SIZE),
        batch_tfms=[*aug_transforms(size=cfg.IMG_SIZE, min_scale=0.75), Normalize.from_stats(*imagenet_stats)],
        bs=32
    )
    
    # Using ResNet18 for speed and good feature extraction
    learn = vision_learner(dls, resnet18, metrics=accuracy)
    learn.fine_tune(cfg.CLF_EPOCHS)
    
    print("✓ Classifier trained.")
    return learn

# ==========================================
# PART 3: GRAD-CAM & BBOX GENERATION
# ==========================================
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model.eval()
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def __call__(self, x, class_idx=None):
        self.model.zero_grad()
        output = self.model(x)
        
        if class_idx is None:
            class_idx = torch.argmax(output)
            
        score = output[0, class_idx]
        score.backward()
        
        gradients = self.gradients
        activations = self.activations
        
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * activations, dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=(x.shape[2], x.shape[3]), mode='bilinear', align_corners=False)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-7)
        
        return cam.squeeze().detach().cpu().numpy()

def generate_pseudo_labels(learn):
    print("\n[3/6] Generating Pseudo-Labels (Grad-CAM)...")
    
    # Setup Output Dirs
    images_dir = os.path.join(cfg.YOLO_PV_DIR, 'images', 'train')
    labels_dir = os.path.join(cfg.YOLO_PV_DIR, 'labels', 'train')
    # Use valid as train for stage 1 to maximize data, or split it. 
    # Here we put everything in train for Stage 1 pre-training.
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)
    
    # Hook into the model
    # For ResNet, layer4[-1] is usually the last conv block
    target_layer = learn.model[0][-1][-1] 
    grad_cam = GradCAM(learn.model, target_layer)
    
    # Get only diseased images
    diseased_path = os.path.join(cfg.CLF_DATA_DIR, 'diseased')
    image_files = glob.glob(os.path.join(diseased_path, '*.*'))
    
    count = 0
    
    for img_path in tqdm(image_files, desc="Creating BBoxes"):
        try:
            # Preprocess
            img_pil = Image.open(img_path).convert('RGB')
            orig_w, orig_h = img_pil.size
            
            # FastAI Transform logic for inference
            t_img = torch.tensor(np.array(img_pil.resize((cfg.IMG_SIZE, cfg.IMG_SIZE)))).permute(2,0,1).float()/255.0
            t_img = Normalize.from_stats(*imagenet_stats)(t_img.unsqueeze(0)).to(default_device())
            
            # Generate CAM
            mask = grad_cam(t_img, class_idx=1) # 1 is diseased in our binary setup (0=healthy, 1=diseased)
            
            # Enhanced Thresholding
            mask = (mask * 255).astype(np.uint8)
            # Otsu's thresholding often works better than fixed
            _, thresh = cv2.threshold(mask, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Find Contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            bboxes = []
            for cnt in contours:
                area = cv2.contourArea(cnt)
                # Filter small noise (relative to resized cam)
                if area > 50: 
                    x, y, w, h = cv2.boundingRect(cnt)
                    
                    # Scale back to original image size
                    scale_x = orig_w / cfg.IMG_SIZE
                    scale_y = orig_h / cfg.IMG_SIZE
                    
                    real_x = x * scale_x
                    real_y = y * scale_y
                    real_w = w * scale_x
                    real_h = h * scale_y
                    
                    # YOLO Format: class x_center y_center w h (normalized)
                    x_c = (real_x + real_w/2) / orig_w
                    y_c = (real_y + real_h/2) / orig_h
                    w_n = real_w / orig_w
                    h_n = real_h / orig_h
                    
                    # Constraint: Class is always 0 (diseased) for YOLO
                    bboxes.append(f"0 {x_c:.6f} {y_c:.6f} {w_n:.6f} {h_n:.6f}")
            
            if bboxes:
                # Save Image
                shutil.copy(img_path, os.path.join(images_dir, os.path.basename(img_path)))
                # Save Label
                txt_name = os.path.splitext(os.path.basename(img_path))[0] + ".txt"
                with open(os.path.join(labels_dir, txt_name), 'w') as f:
                    f.write('\n'.join(bboxes))
                count += 1
                
        except Exception as e:
            continue
            
    print(f"✓ Generated {count} pseudo-labeled diseased images.")
    return cfg.YOLO_PV_DIR

# ==========================================
# PART 4: YOLO STAGE 1 (PRE-TRAINING)
# ==========================================
def train_yolo_stage1(data_dir):
    print("\n[4/6] YOLO Stage 1: Pre-training on PlantVillage...")
    
    # Create YAML
    yaml_path = os.path.join(data_dir, 'pv_stage1.yaml')
    with open(yaml_path, 'w') as f:
        f.write(f"path: {data_dir}\n")
        f.write("train: images/train\n")
        f.write("val: images/train\n") # Use train as val just for technical execution (we don't care about metrics here yet)
        f.write("names:\n  0: diseased\n")
        
    model = YOLO('yolov8n.pt')
    
    model.train(
        data=yaml_path,
        epochs=cfg.YOLO_S1_EPOCHS,
        imgsz=cfg.YOLO_SIZE,
        batch=32,
        project=cfg.WORK_DIR,
        name='yolo_stage1',
        verbose=True
    )
    
    # Return path to best weights
    return os.path.join(cfg.WORK_DIR, 'yolo_stage1', 'weights', 'best.pt')

# ==========================================
# PART 5: PREPARE PLANTDOC (REAL LABELS)
# ==========================================
def process_plantdoc():
    print("\n[5/6] Processing PlantDoc Labels (Merging to single class)...")
    
    # We need to copy PlantDoc to working dir to modify labels safely
    ensure_dir(cfg.YOLO_PD_DIR)
    
    # Structure: test, train, valid folders
    splits = ['train', 'valid', 'test']
    
    for split in splits:
        src_split = os.path.join(cfg.SRC_PLANTDOC, split)
        if not os.path.exists(src_split): continue
        
        # Paths
        src_imgs = os.path.join(src_split, 'images')
        src_lbls = os.path.join(src_split, 'labels')
        
        dst_imgs = os.path.join(cfg.YOLO_PD_DIR, 'images', split)
        dst_lbls = os.path.join(cfg.YOLO_PD_DIR, 'labels', split)
        
        os.makedirs(dst_imgs, exist_ok=True)
        os.makedirs(dst_lbls, exist_ok=True)
        
        # Copy Images
        if os.path.exists(src_imgs):
            for img in os.listdir(src_imgs):
                shutil.copy(os.path.join(src_imgs, img), os.path.join(dst_imgs, img))
        
        # Process Labels
        if os.path.exists(src_lbls):
            for lbl in os.listdir(src_lbls):
                with open(os.path.join(src_lbls, lbl), 'r') as f:
                    lines = f.readlines()
                
                new_lines = []
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        # Force class ID to 0 (Diseased)
                        # Keep coordinates same
                        new_line = f"0 {parts[1]} {parts[2]} {parts[3]} {parts[4]}"
                        new_lines.append(new_line)
                
                if new_lines:
                    with open(os.path.join(dst_lbls, lbl), 'w') as f:
                        f.write('\n'.join(new_lines))
    
    print("✓ PlantDoc labels converted to single class (0).")
    return cfg.YOLO_PD_DIR

# ==========================================
# PART 6: YOLO STAGE 2 (FINE-TUNING)
# ==========================================
def train_yolo_stage2(stage1_weights, pd_data_dir):
    print("\n[6/6] YOLO Stage 2: Fine-Tuning on PlantDoc...")
    
    yaml_path = os.path.join(pd_data_dir, 'data_finetune.yaml')
    with open(yaml_path, 'w') as f:
        f.write(f"path: {pd_data_dir}\n")
        f.write("train: images/train\n")
        f.write("val: images/valid\n")
        f.write("test: images/test\n")
        f.write("names:\n  0: diseased\n")
        
    # Load Stage 1 weights
    model = YOLO(stage1_weights)
    
    # Train
    results = model.train(
        data=yaml_path,
        epochs=cfg.YOLO_S2_EPOCHS,
        imgsz=cfg.YOLO_SIZE,
        batch=16, # Smaller batch for fine-tuning often helps
        lr0=0.005, # Lower learning rate for fine-tuning
        project=cfg.WORK_DIR,
        name='yolo_final_stage2',
        augment=True,
        verbose=True
    )
    
    print("✓ Training Complete!")
    return model

# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    # 1. Prepare Classification Data
    clf_data = prepare_plantvillage_binary()
    
    # 2. Train Classifier
    learner = train_binary_classifier(clf_data)
    
    # 3. Generate BBox Data (PlantVillage)
    pv_yolo_dir = generate_pseudo_labels(learner)
    
    # Cleanup Classifier to free GPU
    del learner
    free_memory()
    
    # 4. Stage 1 Training (PlantVillage)
    stage1_weights = train_yolo_stage1(pv_yolo_dir)
    
    # 5. Prepare PlantDoc Data
    pd_yolo_dir = process_plantdoc()
    
    # 6. Stage 2 Fine-Tuning (PlantDoc)
    final_model = train_yolo_stage2(stage1_weights, pd_yolo_dir)
    
    print(f"\n🏆 Final Model Saved at: {os.path.join(cfg.WORK_DIR, 'yolo_final_stage2', 'weights', 'best.pt')}")
    
    # Optional: Verification on Test Set
    metrics = final_model.val(split='test')
    print(f"Final mAP50-95: {metrics.box.map}")
    print(f"Final mAP50: {metrics.box.map50}")
    # Optional: Verification on Test Set (Enhanced)
    # Optional: Verification on Test Set (Enhanced)
    print("\n📊 Final Model Evaluation on Test Set:")
    metrics = final_model.val(split='test')  # This runs validation if not already cached
    
    # Extract box metrics (single-class, so index 0)
    box_metrics = metrics.box
    precision = box_metrics.p[0]      # Precision @ IoU=0.5
    recall = box_metrics.r[0]         # Recall @ IoU=0.5
    f1_score = box_metrics.f1[0]      # F1 @ IoU=0.5 (built-in)
    
    # Print key metrics
    print(f"mAP@[IoU=0.5]: {box_metrics.map50[0]:.4f}")
    print(f"mAP@[IoU=0.75]: {box_metrics.map75[0]:.4f}")
    print(f"mAP@[IoU=0.5:0.95]: {box_metrics.map[0]:.4f}")
    print(f"Precision @[IoU=0.5]: {precision:.4f}")
    print(f"Recall @[IoU=0.5]: {recall:.4f}")
    print(f"F1-Score @[IoU=0.5]: {f1_score:.4f}")
    
    # Optional: Plot PR Curve, Confusion Matrix, and Results
    # Precision-Recall curve (saves to runs/detect/val/PR_curve.png; at IoU=0.5 by default)
    metrics.box.plot_pr_curve()
    plt.savefig(os.path.join(cfg.WORK_DIR, 'PR_curve.png'))
    plt.close()
    
    # Confusion Matrix (saves to runs/detect/val/confusion_matrix.png; normalized)
    metrics.box.plot_confusion_matrix(normalize=True)  # Normalized for single-class
    plt.savefig(os.path.join(cfg.WORK_DIR, 'confusion_matrix.png'))
    plt.close()
    
    print("✓ Plots saved: PR_curve.png and confusion_matrix.png in WORK_DIR.")
    
    # Free up memory after eval
    free_memory()