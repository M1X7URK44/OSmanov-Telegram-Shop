from telebot import types

def none():
    return types.ReplyKeyboardRemove()


def create_keyboard(btn_lines):
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    for line in btn_lines:
        btn_arr = []
        for name in line:
            btn_arr.append(types.KeyboardButton(text=name))
        keyboard.add(*btn_arr)
    return keyboard


def create_inline_keyboard(btn_lines):
    keyboard = types.InlineKeyboardMarkup(row_width=7)
    for line in btn_lines:
        btn_arr = []
        for name, data in line:
            btn_arr.append(types.InlineKeyboardButton(text=name, callback_data=data))
        keyboard.add(*btn_arr)
    return keyboard


def back():
    return create_keyboard([
        ['<< Назад']
    ])


def app_link():
    keyboard = types.InlineKeyboardMarkup()
    keyboard.add(
        types.InlineKeyboardButton(text='Открыть', web_app=types.WebAppInfo(url="https://os-gift.store/"))
    )
    return keyboard