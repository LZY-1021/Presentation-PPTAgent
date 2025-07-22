import json
import os
from typing import Dict, List, Any

def write_frontmatter(md_file, frontmatter: Dict[str, Any], indent: int = 0) -> None:
    """Write frontmatter to markdown file with proper Slidev formatting."""
    indent_str = "  " * indent
    for key, value in frontmatter.items():
        if isinstance(value, dict):
            md_file.write(f"{indent_str}{key}:\n")
            write_frontmatter(md_file, value, indent + 1)
        elif isinstance(value, str) and '\n' in value:
            md_file.write(f"{indent_str}{key}: |\n")
            for line in value.split('\n'):
                md_file.write(f"{indent_str}  {line}\n")
        else:
            md_file.write(f"{indent_str}{key}: {value}\n")

def convert_json_to_markdown(json_file_path: str, output_md_file_path: str) -> None:
    """Convert JSON slides to Slidev-compliant Markdown format."""
    try:
        # Validate input file
        if not os.path.exists(json_file_path):
            raise FileNotFoundError(f"Input file {json_file_path} not found")

        # Read and parse JSON
        with open(json_file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON format in {json_file_path}: {str(e)}")

        # Validate data structure
        if not isinstance(data, list):
            raise ValueError("JSON root must be an array of slides")

        # Open output file
        with open(output_md_file_path, 'w', encoding='utf-8') as md_file:
            # Write global frontmatter from first slide
            if data and 'frontmatter' in data[0]:
                md_file.write('---\n')
                global_fields = ['theme', 'background', 'title', 'info', 'class', 'drawings', 
                               'transition', 'mdc', 'contextMenu', 'seoMeta']
                write_frontmatter(md_file, {
                    k: v for k, v in data[0]['frontmatter'].items() if k in global_fields
                })
                md_file.write('---\n\n')

            # Process each slide
            for slide in data:
                # Validate slide structure
                if not isinstance(slide, dict) or 'markdown' not in slide:
                    raise ValueError(f"Invalid slide structure at slide number {slide.get('slideNumber', 'unknown')}")

                # Write slide separator
                md_file.write('---\n')

                # Write slide-specific frontmatter
                if 'frontmatter' in slide:
                    local_frontmatter = {
                        k: v for k, v in slide['frontmatter'].items()
                        if k not in ['css', 'theme', 'background', 'title', 'info', 
                                   'class', 'drawings', 'transition', 'mdc', 'contextMenu', 'seoMeta']
                    }
                    if local_frontmatter:
                        write_frontmatter(md_file, local_frontmatter)
                        md_file.write('---\n')
                    else:
                        md_file.write('\n')

                # Write markdown content
                for i, line in enumerate(slide['markdown']):
                    md_file.write(f'{line.rstrip()}\n')
                    # Ensure no extra newline after the last markdown line
                    if i == len(slide['markdown']) - 1 and line.strip() == '':
                        md_file.write('\n')

                # Write additional metadata (like foo, dragPos)
                for key, value in slide.items():
                    if key not in ['slideNumber', 'frontmatter', 'markdown']:
                        if isinstance(value, dict):
                            md_file.write(f'{key}:\n')
                            write_frontmatter(md_file, value, 1)
                        else:
                            md_file.write(f'{key}: {value}\n')

                # Ensure single newline before next slide
                md_file.write('\n')

        print(f"Successfully converted {json_file_path} to {output_md_file_path}")

    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        raise

if __name__ == '__main__':
    input_json = 'slides.json'
    output_md = 'slides.md'
    
    try:
        convert_json_to_markdown(input_json, output_md)
    except Exception as e:
        print(f"Failed to convert: {str(e)}")