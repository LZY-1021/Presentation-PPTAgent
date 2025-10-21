import config from '../config.json';

export const CONFIG = {
  api: {
    deepseek: {
      url: config.api.deepseek.url,
      key: config.api.deepseek.key,
      model: config.api.deepseek.model,
    },
    openai: {
      key: config.api.openai.key,
      baseUrl: config.api.openai.baseUrl,
      model: config.api.openai.model,
      maxTokens: config.api.openai.maxTokens,
      temperature: config.api.openai.temperature,
    },
  },
  webhooks: {
    n8n: {
      main: `${config.webhooks.n8n.base}${config.webhooks.n8n.endpoints.main}`,
      markdown: `${config.webhooks.n8n.base}${config.webhooks.n8n.endpoints.markdown}`,
      slidev: `${config.webhooks.n8n.base}${config.webhooks.n8n.endpoints.slidev}`,
      pptx: `${config.webhooks.n8n.base}${config.webhooks.n8n.endpoints.pptx}`,
      init: `${config.webhooks.n8n.base}${config.webhooks.n8n.endpoints.init}`,
    },
  },
  servers: {
    frontend: config.servers.frontend,
    slidev: config.servers.slidev,
    mineru: config.servers.mineru,
  },
  paths: {
    metricFile: config.paths.metricFile,
    slidevDir: config.paths.slidevDir,
  },
  evaluation: {
    criteria: config.evaluation.criteria,
    metrics: config.evaluation.metrics,
  },
  cors: config.cors,
};

export default CONFIG;
