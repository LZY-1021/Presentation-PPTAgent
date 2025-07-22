const fs = require('fs');
const path = require('path');

/**
 * 幻灯片解析器 - 将Markdown文件解析为独立的幻灯片
 */
class SlideParser {
  constructor() {
    // 初始化必要的类型定义
    this.types = {
      SlidevPreparserExtension: {
        transformRawLines: null,
        transformSlide: null,
        transformNote: null
      },
      SlidevParserOptions: {
        preserveCR: false
      },
      SourceSlideInfo: {
        content: '',
        frontmatter: {},
        title: '',
        level: 0,
        note: '',
        filepath: '',
        index: 0,
        start: 0,
        contentStart: 0,
        end: 0
      },
      SlidevMarkdown: {
        filepath: '',
        raw: '',
        slides: []
      }
    };
  }

  /**
   * 解析Markdown内容为幻灯片
   */
  async parse(markdown, filepath, extensions = [], options = {}) {
    const lines = markdown.split(options.preserveCR ? '\n' : /\r?\n/g);
    const slides = [];

    let start = 0;
    let contentStart = 0;

    // 修改为箭头函数以保留this上下文
    const slice = async (end) => {
      if (start === end) return;
      const raw = lines.slice(start, end).join('\n');
      const slide = {
        ...this.parseSlide(raw, options),
        filepath,
        index: slides.length,
        start,
        contentStart,
        end
      };

      if (extensions) {
        for (const e of extensions) {
          if (e.transformSlide) {
            const newContent = await e.transformSlide(slide.content, slide.frontmatter);
            if (newContent !== undefined) slide.content = newContent;
            if (typeof slide.frontmatter.title === 'string') {
              slide.title = slide.frontmatter.title;
            }
            if (typeof slide.frontmatter.level === 'number') {
              slide.level = slide.frontmatter.level;
            }
          }

          if (e.transformNote) {
            const newNote = await e.transformNote(slide.note, slide.frontmatter);
            if (newNote !== undefined) slide.note = newNote;
          }
        }
      }
      slides.push(slide);
      start = end + 1;
      contentStart = end + 1;
    };

    if (extensions) {
      for (const e of extensions) {
        if (e.transformRawLines) await e.transformRawLines(lines);
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      if (line.startsWith('---')) {
        await slice(i);

        const next = lines[i + 1];
        if (line[3] !== '-' && next?.trim()) {
          start = i;
          for (i += 1; i < lines.length; i++) {
            if (lines[i].trimEnd() === '---') break;
          }
          contentStart = i + 1;
        }
      } else if (line.trimStart().startsWith('```')) {
        // 安全检查
        const codeBlockMatch = line.match(/^\s*`+/);
        const codeBlockLevel = codeBlockMatch ? codeBlockMatch[0] : '';
        
        if (codeBlockLevel) {
          let j = i + 1;
          for (; j < lines.length; j++) {
            if (lines[j].startsWith(codeBlockLevel)) break;
          }
          if (j !== lines.length) i = j;
        }
      }
    }

    if (start <= lines.length - 1) await slice(lines.length);

    return {
      filepath,
      raw: markdown,
      slides
    };
  }

  /**
   * 解析单个幻灯片
   */
  parseSlide(raw, options = {}) {
    // 解析frontmatter和内容
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
    const match = raw.match(frontmatterRegex);
    
    if (match) {
      const frontmatterContent = match[1];
      const content = raw.substring(match[0].length);
      
      // 简单解析YAML格式的frontmatter
      const frontmatter = this.parseFrontmatter(frontmatterContent);
      
      return {
        content,
        frontmatter,
        note: this.extractNote(content)
      };
    }
    
    // 如果没有frontmatter，直接返回内容
    return {
      content: raw,
      frontmatter: {},
      note: this.extractNote(raw)
    };
  }

  /**
   * 解析frontmatter
   */
  parseFrontmatter(frontmatterContent) {
    try {
      // 简单的YAML解析
      const result = {};
      const lines = frontmatterContent.split(/\r?\n/);
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          // 简单处理布尔值和数字
          if (value === 'true') value = true;
          if (value === 'false') value = false;
          if (!isNaN(Number(value))) value = Number(value);
          
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error('解析frontmatter失败:', error);
      return {};
    }
  }

  /**
   * 提取备注
   */
  extractNote(content) {
    const noteRegex = /<!--\s*notes?:\s*([\s\S]*?)\s*-->/;
    const match = content.match(noteRegex);
    return match ? match[1] : undefined;
  }

  /**
   * 从文件读取并解析
   */
  async parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return this.parse(content, filePath);
  }

  /**
   * 保存幻灯片到文件
   */
  saveSlidesToFiles(parsedResult, outputDir) {
    // 创建输出目录（如果不存在）
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存每个幻灯片
    parsedResult.slides.forEach((slide, index) => {
      const slideNumber = (index + 1).toString().padStart(2, '0');
      const fileName = `slide_${slideNumber}.md`;
      const filePath = path.join(outputDir, fileName);
      
      // 构建完整的幻灯片内容
      let slideContent = '---\n';
      
      // 添加frontmatter
      const frontmatter = slide.frontmatter || {};
      Object.entries(frontmatter).forEach(([key, value]) => {
        slideContent += `${key}: ${value}\n`;
      });
      
      slideContent += '---\n\n';
      
      // 添加内容
      slideContent += slide.content || '';
      
      // 保存到文件
      fs.writeFileSync(filePath, slideContent, 'utf8');
      console.log(`已保存幻灯片 ${slideNumber} 到 ${filePath}`);
    });
    
    console.log(`共保存 ${parsedResult.slides.length} 张幻灯片`);
  }
}

// 命令行工具
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('请提供Markdown文件路径');
    console.log('用法: node slide_parser.js <input-file> [output-dir]');
    return;
  }
  
  const inputFile = args[0];
  const outputDir = args[1] || path.join(path.dirname(inputFile), 'slides');
  
  try {
    const parser = new SlideParser();
    const result = await parser.parseFile(inputFile);
    parser.saveSlidesToFiles(result, outputDir);
  } catch (error) {
    console.error('处理文件时出错:', error);
  }
}

// 执行主函数
main().catch(console.error);