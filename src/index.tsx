import { serve } from "bun";
import index from "./index.html";
import { execSync } from 'child_process';
import path from 'path';
import { CONFIG } from "./config";

const server = serve({
  fetch(req) {
    // 设置 CORS 头信息
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', CONFIG.cors.allowOrigin);
    headers.set('Access-Control-Allow-Methods', CONFIG.cors.allowMethods);
    headers.set('Access-Control-Allow-Headers', CONFIG.cors.allowHeaders);

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    // 处理其他请求
    const url = new URL(req.url);
    const route = server.routes.find(r => r.pattern.test(url.pathname));
    if (route) {
      const handler = route[req.method.toLowerCase()];
      if (handler) {
        return handler(req);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
  routes: {
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // 新增路由用于更新评估标准
    "/api/update_metric": {
      async POST(req) {
        try {
          const { name, criteria, scale } = await req.json();
          // 调用 Python 脚本更新 METRIC_DICT 的值
          const command = `python src/evaluate/reference_free_eval.py --update_metric "${name}" "${criteria}" ${scale}`;
          execSync(command);
          return Response.json({ success: true });
        } catch (error) {
          console.error('更新失败:', error);
          return Response.json({ success: false, error: error.message }, { status: 500 });
        }
      }
    },

    // 新增路由用于运行Python脚本
"/api/run-python-script": {
  async POST(req) {
    try {
      // 在这里替换原有的命令
      const command = `cd /d ${CONFIG.paths.slidevDir} && python slidev_auto_preview.py`;
      // 运行命令
      execSync(command, { stdio: 'inherit' });
      return Response.json({ success: true });
    } catch (error) {
      console.error('运行失败:', error.message);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
},

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);