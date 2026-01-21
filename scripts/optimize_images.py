import os
from PIL import Image
from pathlib import Path

# Configuration
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg'}
MIN_SIZE_KB = 500  # Only process images larger than 500KB
TARGET_FORMAT = 'WEBP'
QUALITY = 80
ROOT_DIR = r'd:\projects\spotless'

def get_file_size_kb(filepath):
    return os.path.getsize(filepath) / 1024

def optimize_images(root_dir):
    count = 0
    saved_space_kb = 0
    
    print(f"Scanning {root_dir} for images larger than {MIN_SIZE_KB}KB...")
    
    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            filepath = Path(subdir) / file
            if filepath.suffix.lower() in IMAGE_EXTENSIONS:
                size_kb = get_file_size_kb(filepath)
                
                if size_kb > MIN_SIZE_KB:
                    try:
                        # Construct new filename
                        new_filepath = filepath.with_suffix('.webp')
                        
                        # Open and convert
                        with Image.open(filepath) as img:
                            # Convert to RGB if necessary (e.g. RGBA for PNGs is fine for WebP, but some modes might need check)
                            # WebP supports transparency, so we don't strictly need to convert RGBA to RGB like JPEG.
                            
                            print(f"Converting: {file} ({size_kb:.2f} KB) -> .webp")
                            img.save(new_filepath, TARGET_FORMAT, quality=QUALITY)
                            
                        # Calculate savings
                        new_size_kb = get_file_size_kb(new_filepath)
                        savings = size_kb - new_size_kb
                        saved_space_kb += savings
                        count += 1
                        
                        print(f"  Saved: {savings:.2f} KB")
                        
                    except Exception as e:
                        print(f"  Error processing {file}: {e}")

    print("-" * 30)
    print(f"Optimization Complete.")
    print(f"Images Converted: {count}")
    print(f"Total Space Saved: {saved_space_kb / 1024:.2f} MB")

if __name__ == "__main__":
    optimize_images(ROOT_DIR)
