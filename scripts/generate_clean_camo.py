import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = r"d:\Proyectos\Paginas\Spain\public\images\textures"
os.makedirs(out_dir, exist_ok=True)

print("Generating Clean High-End Arctic Tactical Camo...")
W, H = 2048, 2048
# Base: Stealth Carbon Slate
img = Image.new('RGB', (W, H), color=(24, 27, 33))
draw = ImageDraw.Draw(img)

# Curated Arctic Multi-Terrain Palette
camo_palette = [
    (38, 43, 52),    # Deep Slate
    (56, 63, 75),    # Wolf Grey
    (82, 92, 107),   # Cold Granite
    (115, 126, 142), # Arctic Frost Grey
    (168, 178, 192), # Titanium Silver
    (18, 20, 25),    # Shadow Carbon
]

np.random.seed(1337)
for layer_idx, color in enumerate(camo_palette):
    num_patches = 30 + layer_idx * 10
    for i in range(num_patches):
        start_x = np.random.randint(0, W)
        start_y = np.random.randint(0, H)
        num_verts = np.random.randint(7, 14)
        base_r = np.random.randint(80, 260)
        
        points = []
        for v in range(num_verts):
            angle = (v / num_verts) * 2 * math.pi
            r = base_r * (0.55 + 0.45 * np.random.rand())
            px = (start_x + r * math.cos(angle)) % W
            py = (start_y + r * math.sin(angle)) % H
            points.append((px, py))
            
        draw.polygon(points, fill=color)

# Natural organic blending
img = img.filter(ImageFilter.GaussianBlur(radius=2.5))

camo_diffuse_path = os.path.join(out_dir, "camo_arctic_diffuse.png")
img.save(camo_diffuse_path, quality=95)
print("Saved clean diffuse:", camo_diffuse_path)

# Roughness
gray = img.convert('L')
gray_arr = np.array(gray, dtype=np.float32) / 255.0
roughness_arr = np.clip(0.65 + gray_arr * 0.20, 0.0, 1.0)
roughness_img = Image.fromarray((roughness_arr * 255).astype(np.uint8))
camo_rough_path = os.path.join(out_dir, "camo_arctic_roughness.png")
roughness_img.save(camo_rough_path)
print("Saved clean roughness:", camo_rough_path)
