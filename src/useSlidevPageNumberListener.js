// useSlidevPageNumberListener.js
import { useEffect } from 'react';
const puppeteer = require('puppeteer');

const useSlidevPageNumberListener = () => {
  useEffect(() => {
    const listenToPageNumber = async () => {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto('http://localhost:3030/'); // 替换为实际的 URL

      try {
        await page.exposeFunction('onPageElementChange', (content) => {
          console.log(`当前页号: ${content}`);
        });

        await page.evaluate(() => {
          let retryCount = 0;
          const maxRetries = 5;

          const findPageElement = () => {
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

            if (retryCount < maxRetries) {
              retryCount++;
              console.log('未找到页号元素，重试中...');
              setTimeout(findPageElement, 1000);
            } else {
              console.log('达到最大重试次数，停止查找');
            }
            return false;
          };

          findPageElement();
        });
      } catch (e) {
        console.error('监听页号变化失败:', e);
      }

      return () => {
        browser.close();
      };
    };

    listenToPageNumber();
  }, []);
};

export default useSlidevPageNumberListener;