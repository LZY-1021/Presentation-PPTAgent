import json
import os
from pathlib import Path

def load_config():
    """加载配置文件"""
    config_path = Path(__file__).parent.parent / 'config.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

CONFIG = load_config()

def get_openai_config():
    """获取 OpenAI API 配置"""
    return CONFIG['api']['openai']

def get_webhook_url(endpoint):
    """获取 webhook URL"""
    base = CONFIG['webhooks']['n8n']['base']
    endpoint_path = CONFIG['webhooks']['n8n']['endpoints'][endpoint]
    return f"{base}{endpoint_path}"

def get_evaluation_criteria():
    """获取评估标准"""
    return CONFIG['evaluation']['criteria']

def get_evaluation_metrics():
    """获取评估指标"""
    return CONFIG['evaluation']['metrics']

def get_metric_file():
    """获取评估文件路径"""
    return CONFIG['paths']['metricFile']
