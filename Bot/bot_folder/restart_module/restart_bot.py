import os
import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BOT_SCRIPT = 'bot_folder/bot.py'
bot_process = None

class BotRestartHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global bot_process

        if '__pycache__' in event.src_path:
            return
        
        if event.src_path.endswith('.py'):
            print(f"Detected changes in {event.src_path}. Restarting bot...")
            if bot_process:
                try:
                    bot_process.terminate()
                    bot_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    bot_process.kill()
                except Exception as e:
                    print(f"Error terminating bot process: {e}")
            
            bot_process = subprocess.Popen([sys.executable, BOT_SCRIPT])


def run():
    global bot_process
    bot_process = subprocess.Popen([sys.executable, BOT_SCRIPT])

    event_handler = BotRestartHandler()
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

    if bot_process:
        try:
            bot_process.terminate()
            bot_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            bot_process.kill()
        except Exception as e:
            print(f"Error terminating bot process: {e}")


if __name__ == "__main__":
    run()
