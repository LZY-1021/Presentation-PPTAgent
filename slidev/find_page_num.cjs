const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3030/'); // 替换为实际的 URL

  // 方法2: 直接监听页号元素变化
  try {
    await page.exposeFunction('onPageElementChange', (content) => {
      console.log(`方法2: 当前页号: ${content}`);
    });

    await page.evaluate(() => {
      const findPageElement = () => {
        // 尝试多种可能的页号元素选择器
        const selectors = [
          '#page-root',
          '.slidev-page-number',
          '[data-page]',
          '.page-indicator'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            console.log('找到页号元素:', selector);
            window.onPageElementChange(element.textContent.trim());
            
            // 监听元素变化
            const observer = new MutationObserver((mutations) => {
              window.onPageElementChange(element.textContent.trim());
            });
            observer.observe(element, { 
              childList: true, 
              subtree: true,
              characterData: true
            });
            
            return true;
          }
        }
        
        console.log('未找到页号元素，重试中...');
        setTimeout(findPageElement, 1000);
        return false;
      };
      
      findPageElement();
    });
  } catch (e) {
    console.error('方法2失败:', e);
  }

  console.log('正在监听页号变化...');
  // 保持浏览器打开
})();