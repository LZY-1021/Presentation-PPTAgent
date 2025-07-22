import subprocess
import time
import re
import platform
import threading
from queue import Queue, Empty
import schedule

def remove_ansi_escape_codes(text):
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

class SlidevController:
    def __init__(self):
        self.process = None
        self.shutdown_event = threading.Event()
        self.port = 3030
        self.schedule_shutdown()

    def enqueue_output(self, process, queue):
        """从子进程捕获输出并放入队列"""
        for line in iter(process.stdout.readline, ''):
            queue.put(line)
        process.stdout.close()

    def start_slidev(self, deck_path='.', port=3030):
        """启动Slidev，不自动打开浏览器"""
        self.port = port
        print(f"正在启动Slidev，使用文件路径: {deck_path}，端口: {port}")

        # 构建命令（去掉--open参数）
        command = ['npx', 'slidev']

        # 根据平台调整命令
        if platform.system() == 'Windows':
            self.process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                shell=True,
                text=True,
                bufsize=1,
                encoding='utf-8'
            )
        else:
            self.process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding='utf-8'
            )

        # 创建队列用于捕获输出
        q = Queue()
        t = threading.Thread(target=self.enqueue_output, args=(self.process, q))
        t.daemon = True
        t.start()

        # 正则表达式匹配服务器启动行
        server_started_pattern = re.compile(r'\s+public slide show\s+>\s+(http://.+:\d+/?)(?:\s|$)')

        try:
            # 等待服务器启动
            server_url = None
            print("等待Slidev服务器启动...")

            while True:
                try:
                    # 超时1秒，避免阻塞
                    line = q.get(timeout=1).strip()
                    print(f"[Slidev]{line}")
                    line = remove_ansi_escape_codes(line)  # 过滤 ANSI 转义序列
                    match = server_started_pattern.search(line)
                    if match:
                        server_url = match.group(1)
                        print(f"Slidev服务器已在 {server_url} 启动")
                        break
                except Empty:
                    if self.process.poll() is not None:
                        raise RuntimeError("Slidev进程意外退出")
                except KeyboardInterrupt:
                    print("\n用户中断，正在关闭Slidev...")
                    self.stop_slidev()
                    raise

            # 保持脚本运行，直到接收到关闭信号
            print("Slidev正在运行，凌晨12点将自动停止...")
            while not self.shutdown_event.is_set():
                print("当前时间：", time.strftime("%H:%M:%S"))
                schedule.run_pending()  # 运行定时任务检查
                time.sleep(1)

            # 等待进程结束
            self.process.wait()
            print("Slidev已停止")

        except Exception as e:
            print(f"发生错误: {e}")
            if self.process and self.process.poll() is None:
                self.stop_slidev()

    def stop_slidev(self):
        print("进入 stop_slidev 方法")
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()

    def schedule_shutdown(self):
        """安排每天凌晨12点关闭Slidev"""
        schedule.every().day.at("18:00").do(self.shutdown_at_midnight)

    def shutdown_at_midnight(self):
        """在凌晨12点关闭Slidev"""
        print("到凌晨12点了，正在关闭Slidev...")
        self.shutdown_event.set()
        self.stop_slidev()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="自动启动Slidev预览")
    parser.add_argument("--path", default='slides.md', help="Slidev文件路径")
    parser.add_argument("--port", type=int, default=3030, help="服务器端口")

    args = parser.parse_args()

    controller = SlidevController()
    try:
        controller.start_slidev(args.path, args.port)
    except KeyboardInterrupt:
        print("\n用户中断，正在关闭...")
        controller.stop_slidev()
