import json

# ===  读取 JSON 文件 ===
with open('slides_1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

markdown_string = '\n\n'.join(s.replace('\\n', '\n') for s in data)
with open('slides.md', 'w', encoding='utf-8') as f:
    f.write(markdown_string)

print("转换成功，已生成 slides.md")
