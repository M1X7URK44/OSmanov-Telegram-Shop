import config_module.config as config
from keyboard_module import keyboard
from telebot import TeleBot
from telebot.types import BotCommand


class Bot:
    def __init__(self):
        self.bot = TeleBot(token=config.ACCESS_TOKEN)
    
    def run(self):

        self.bot.set_my_commands(
            commands=[
                BotCommand('start', 'Запустить бота')
            ]
        )

        @self.bot.message_handler(commands=['start'])
        def start_cmd(message):
            self.bot.send_message(chat_id=message.chat.id,
                                  text='Добро пожаловать!\nВоспользуйтесь кнопкой, чтобы открыть приложение 👇',
                                  reply_markup=keyboard.app_link())

        self.bot.infinity_polling()
    

def main():
    bot = Bot()
    bot.run()


if __name__ == '__main__':
    main()
