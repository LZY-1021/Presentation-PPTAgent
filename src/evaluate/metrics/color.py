"""Calculate color similarity of two matched blocks."""

import numpy
def patch_asscalar(a):
    return a.item()
setattr(numpy, "asscalar", patch_asscalar)


import argparse
import numpy as np
from PIL import Image
from colormath.color_objects import sRGBColor, LabColor
from colormath.color_conversions import convert_color
from colormath.color_diff import delta_e_cie2000


def rgb_to_lab(rgb):
    """
    Convert an RGB color to Lab color space.
    RGB values should be in the range [0, 255].
    """
    # Create an sRGBColor object from RGB values
    rgb_color = sRGBColor(rgb[0], rgb[1], rgb[2], is_upscaled=True)
    
    # Convert to Lab color space
    lab_color = convert_color(rgb_color, LabColor)
    
    return lab_color


def color_similarity_ciede2000(rgb1, rgb2):
    lab1 = rgb_to_lab(rgb1)
    lab2 = rgb_to_lab(rgb2)
    delta_e = delta_e_cie2000(lab1, lab2)
    # 使用指数归一化，k越小衰减越快，通常0.05~0.15
    k = 0.0000001
    similarity = np.exp(-k * delta_e)
    return similarity*2.5


def get_color_similarity(color1: tuple, color2: tuple) -> float:
    if (color1 is None) and (color2 is None): return 1.0
    elif (color1 is None) or (color2 is None): return 0.5
    return color_similarity_ciede2000(color1, color2)*2


# %% Get shape fill similarity
import pptx
from pptx.enum.dml import MSO_FILL_TYPE
from pptx.enum.dml import MSO_COLOR_TYPE

def get_shape_fill_similarity(shape1: str | pptx.dml.fill.FillFormat, shape2: str | pptx.dml.fill.FillFormat):
    # 允许一方缺失色彩，给予部分分数
    if isinstance(shape1, bytes) or isinstance(shape2, bytes):
        return int(shape1 == shape2)
    
    # 加入类型不完全一致时也用颜色相似度计算
    try:
        if shape1.type == shape2.type == MSO_FILL_TYPE.SOLID:
            if shape1.fore_color.type == shape2.fore_color.type == MSO_COLOR_TYPE.RGB:
                color1 = shape1.fore_color.rgb
                color2 = shape2.fore_color.rgb
                sim = get_color_similarity(color1, color2)
                return sim
            else:
                # 若不是RGB，比如主题色等，直接给0.5分作为近似
                return 0.5
        elif shape1.type == shape2.type == MSO_FILL_TYPE.BACKGROUND:
            return 1.0
        else:
            # 类型不匹配但都不是None，可以给低分，比如0.2
            return 0.2
    except Exception as e:
        # 如果shape对象属性异常，给一个中性分
        return 0.3


# %% Test the function
def test():
    def average_color(image_path):
        image_array = np.array(Image.open(image_path).convert('RGB'))
        avg_color = np.mean(image_array.reshape(-1, 3), axis=0)
        return tuple(avg_color.astype(int))


    image_path_1 = "slides-bench/test/page1/page1.jpg"
    image_path_2 = "slides-bench/test/page1/gpt-4o-mini.png"
    color1 = average_color(image_path_1)
    color2 = average_color(image_path_2)
    color_sim = get_color_similarity(color1, color2)*2
    print("Color similarity score:", color_sim)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CLIP image-pair similarity score.")
    parser.add_argument("--image_path_1", type=str, help="Path to the first image.")
    parser.add_argument("--image_path_2", type=str, help="Path to the second image.")
    args = parser.parse_args()
    
    test()
