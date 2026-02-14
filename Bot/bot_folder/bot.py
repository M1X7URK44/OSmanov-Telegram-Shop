import config_module.config as config
from keyboard_module import keyboard
from telebot import TeleBot
from telebot.types import BotCommand, InputMediaPhoto, InputMediaVideo, InputMediaDocument
from db_module.db import Database
import time
from datetime import datetime


class Bot:
    def __init__(self):
        self.bot = TeleBot(token=config.ACCESS_TOKEN)
        self.db = Database()
        self.mailing_states = {}  # Хранит состояние рассылки для каждого админа
        self.media_group_timers = {}  # Хранит таймеры для медиа-групп
    
    def is_admin(self, user_id):
        """Проверяет, является ли пользователь админом."""
        return user_id in config.ADMIN_IDS
    
    def run(self):

        self.bot.set_my_commands(
            commands=[
                BotCommand('start', 'Запустить бота'),
                # BotCommand('mail', 'Рассылка (только для админов)'),
                # BotCommand('stats', 'Статистика пользователей (только для админов)')
            ]
        )

        @self.bot.message_handler(commands=['start'])
        def start_cmd(message):
            # Сохраняем пользователя в базу данных
            self.db.add_user(
                user_id=message.chat.id,
                username=message.chat.username,
                first_name=message.chat.first_name
            )
            self.bot.send_message(chat_id=message.chat.id,
                                  text='Добро пожаловать!\nВоспользуйтесь кнопкой, чтобы открыть приложение 👇',
                                  reply_markup=keyboard.app_link())

        @self.bot.message_handler(commands=['mail'])
        def mail_cmd(message):
            """Команда для начала рассылки."""
            if not self.is_admin(message.chat.id):
                self.bot.send_message(
                    chat_id=message.chat.id,
                    text='❌ У вас нет прав для использования этой команды.'
                )
                return
            
            self.mailing_states[message.chat.id] = {
                'waiting_for_content': True,
                'media_group': [],
                'media_group_id': None,
                'button_type': None,  # 'url' или 'web_app'
                'button_text': None,
                'button_url': None,
                'content_type': None,
                'content_data': None,
                'waiting_for_button_choice': False,
                'waiting_for_button_type': False,
                'waiting_for_button_text': False,
                'waiting_for_button_url': False
            }
            self.bot.send_message(
                chat_id=message.chat.id,
                text='📨 Отправьте сообщение для рассылки.\n\n'
                     'Поддерживаются:\n'
                     '• Текст\n'
                     '• Фото (photo)\n'
                     '• Видео (video)\n'
                     '• Документы (document)\n'
                     '• Медиа-группы (несколько файлов)\n\n'
                     'Для отмены отправьте /cancel'
            )

        @self.bot.callback_query_handler(func=lambda call: call.data.startswith('mail_'))
        def handle_mailing_callbacks(call):
            """Обработка callback-запросов для рассылки."""
            admin_id = call.message.chat.id
            
            if admin_id not in self.mailing_states:
                self.bot.answer_callback_query(call.id, "Сессия рассылки истекла")
                return
            
            if call.data == 'mail_add_button_yes':
                self.mailing_states[admin_id]['waiting_for_button_choice'] = False
                self.mailing_states[admin_id]['waiting_for_button_type'] = True
                from telebot import types
                keyboard = types.InlineKeyboardMarkup()
                keyboard.add(
                    types.InlineKeyboardButton(text='🔗 URL-ссылка', callback_data='mail_button_type_url'),
                    types.InlineKeyboardButton(text='📱 Mini App (Web App)', callback_data='mail_button_type_webapp')
                )
                self.bot.edit_message_text(
                    chat_id=admin_id,
                    message_id=call.message.message_id,
                    text='📌 Выберите тип кнопки:',
                    reply_markup=keyboard
                )
                self.bot.answer_callback_query(call.id)
                
            elif call.data == 'mail_button_type_url':
                self.mailing_states[admin_id]['button_type'] = 'url'
                self.mailing_states[admin_id]['waiting_for_button_type'] = False
                self.mailing_states[admin_id]['waiting_for_button_text'] = True
                self.bot.edit_message_text(
                    chat_id=admin_id,
                    message_id=call.message.message_id,
                    text='✏️ Укажите текст для кнопки:'
                )
                self.bot.answer_callback_query(call.id)
                
            elif call.data == 'mail_button_type_webapp':
                self.mailing_states[admin_id]['button_type'] = 'web_app'
                self.mailing_states[admin_id]['button_url'] = 'https://os-gift.store/'  # Фиксированный URL
                self.mailing_states[admin_id]['waiting_for_button_type'] = False
                self.mailing_states[admin_id]['waiting_for_button_text'] = True
                self.bot.edit_message_text(
                    chat_id=admin_id,
                    message_id=call.message.message_id,
                    text='✏️ Укажите текст для кнопки Mini App:'
                )
                self.bot.answer_callback_query(call.id)
                
            elif call.data == 'mail_add_button_no':
                self.mailing_states[admin_id]['waiting_for_button_choice'] = False
                self.bot.delete_message(chat_id=admin_id, message_id=call.message.message_id)
                self._show_preview(admin_id)
                self.bot.answer_callback_query(call.id)
                
            elif call.data == 'mail_confirm':
                self.bot.delete_message(chat_id=admin_id, message_id=call.message.message_id)
                self._start_mailing(admin_id)
                self.bot.answer_callback_query(call.id, "Рассылка начата")
                
            elif call.data == 'mail_cancel':
                self.bot.delete_message(chat_id=admin_id, message_id=call.message.message_id)
                # Отменяем таймер, если есть
                if admin_id in self.media_group_timers:
                    self.media_group_timers[admin_id].cancel()
                    del self.media_group_timers[admin_id]
                del self.mailing_states[admin_id]
                self.bot.send_message(
                    chat_id=admin_id,
                    text='❌ Рассылка отменена.'
                )
                self.bot.answer_callback_query(call.id)

        @self.bot.message_handler(commands=['cancel'])
        def cancel_cmd(message):
            """Отмена рассылки."""
            admin_id = message.chat.id
            if admin_id in self.mailing_states:
                # Отменяем таймер, если есть
                if admin_id in self.media_group_timers:
                    self.media_group_timers[admin_id].cancel()
                    del self.media_group_timers[admin_id]
                del self.mailing_states[admin_id]
                self.bot.send_message(
                    chat_id=admin_id,
                    text='❌ Рассылка отменена.'
                )

        @self.bot.message_handler(commands=['stats'])
        def stats_cmd(message):
            """Команда для просмотра статистики пользователей."""
            if not self.is_admin(message.chat.id):
                self.bot.send_message(
                    chat_id=message.chat.id,
                    text='❌ У вас нет прав для использования этой команды.'
                )
                return
            
            # Получаем статистику
            stats = self.db.get_users_statistics()
            
            # Форматируем даты
            def format_date(date_obj):
                if date_obj:
                    return date_obj.strftime('%d.%m.%Y %H:%M')
                return 'Нет данных'
            
            # Форматируем числа с разделителями
            def format_number(num):
                return '{:,}'.format(int(num)).replace(',', ' ')
            
            # Форматируем денежные суммы
            def format_money(amount):
                return '{:,.2f}'.format(float(amount)).replace(',', ' ')
            
            stats_text = (
                f'📊 <b>Статистика пользователей</b>\n\n'
                f'👥 <b>Всего пользователей:</b> <code>{format_number(stats["total_users"])}</code>\n\n'
                f'📈 <b>Регистрации:</b>\n'
                f'• За сегодня: <code>{format_number(stats["users_today"])}</code>\n'
                f'• За последние 7 дней: <code>{format_number(stats["users_week"])}</code>\n'
                f'• За последние 30 дней: <code>{format_number(stats["users_month"])}</code>\n\n'
                f'💰 <b>Финансы:</b>\n'
                f'• Общий баланс: <code>{format_money(stats["total_balance"])}$</code>\n'
                f'• Всего потрачено: <code>{format_money(stats["total_spent"])}$</code>\n\n'
                f'📅 <b>Даты:</b>\n'
                f'• Первая регистрация: <code>{format_date(stats["first_user_date"])}</code>\n'
                f'• Последняя регистрация: <code>{format_date(stats["last_user_date"])}</code>'
            )
            
            self.bot.send_message(
                chat_id=message.chat.id,
                text=stats_text,
                parse_mode='HTML'
            )

        # Обработчик для медиа-групп (должен быть первым, чтобы перехватывать media_group_id)
        @self.bot.message_handler(content_types=['photo', 'video', 'document'], func=lambda m: m.media_group_id is not None)
        def handle_media_group(message):
            """Обработка медиа-групп для рассылки."""
            if message.chat.id not in self.mailing_states:
                return
            
            if not self.mailing_states[message.chat.id]['waiting_for_content']:
                return
            
            media_group_id = message.media_group_id
            admin_id = message.chat.id
            
            # Если это новая медиа-группа, инициализируем
            if self.mailing_states[admin_id]['media_group_id'] != media_group_id:
                self.mailing_states[admin_id]['media_group'] = []
                self.mailing_states[admin_id]['media_group_id'] = media_group_id
                # Отменяем предыдущий таймер, если есть
                if admin_id in self.media_group_timers:
                    self.media_group_timers[admin_id].cancel()
            
            # Добавляем медиа в группу
            media_item = {
                'type': message.content_type,
                'file_id': None,
                'caption': message.caption
            }
            
            if message.photo:
                media_item['file_id'] = message.photo[-1].file_id
            elif message.video:
                media_item['file_id'] = message.video.file_id
            elif message.document:
                media_item['file_id'] = message.document.file_id
            
            self.mailing_states[admin_id]['media_group'].append(media_item)
            
            # Перезапускаем таймер для обработки группы через 1.5 секунды после последнего сообщения
            import threading
            timer = threading.Timer(1.5, self._process_media_group, args=[admin_id, media_group_id])
            timer.start()
            self.media_group_timers[admin_id] = timer

        @self.bot.message_handler(content_types=['photo', 'video', 'document', 'text'])
        def handle_mailing_content(message):
            """Обработка контента для рассылки."""
            admin_id = message.chat.id
            
            if admin_id not in self.mailing_states:
                return
            
            # Обработка ввода текста кнопки
            if self.mailing_states[admin_id].get('waiting_for_button_text'):
                if message.text:
                    self.mailing_states[admin_id]['button_text'] = message.text
                    self.mailing_states[admin_id]['waiting_for_button_text'] = False
                    
                    # Если тип кнопки - URL, запрашиваем URL
                    if self.mailing_states[admin_id].get('button_type') == 'url':
                        self.mailing_states[admin_id]['waiting_for_button_url'] = True
                        self.bot.send_message(
                            chat_id=admin_id,
                            text='🔗 Укажите URL-ссылку для кнопки:'
                        )
                    else:
                        # Для Web App URL уже установлен, сразу показываем превью
                        self._show_preview(admin_id)
                return
            
            # Обработка ввода URL кнопки
            if self.mailing_states[admin_id].get('waiting_for_button_url'):
                if message.text:
                    url = message.text.strip()
                    # Простая проверка URL
                    if not (url.startswith('http://') or url.startswith('https://')):
                        self.bot.send_message(
                            chat_id=admin_id,
                            text='❌ URL должен начинаться с http:// или https://\nПопробуйте еще раз:'
                        )
                        return
                    self.mailing_states[admin_id]['button_url'] = url
                    self.mailing_states[admin_id]['waiting_for_button_url'] = False
                    self._show_preview(admin_id)
                return
            
            if not self.mailing_states[admin_id]['waiting_for_content']:
                return
            
            # Пропускаем медиа-группы (они обрабатываются отдельным обработчиком)
            if message.media_group_id:
                return
            
            # Сохраняем контент для рассылки
            if message.text:
                self.mailing_states[admin_id]['content_type'] = 'text'
                self.mailing_states[admin_id]['content_data'] = {
                    'text': message.text
                }
            elif message.photo:
                self.mailing_states[admin_id]['content_type'] = 'photo'
                self.mailing_states[admin_id]['content_data'] = {
                    'file_id': message.photo[-1].file_id,
                    'caption': message.caption
                }
            elif message.video:
                self.mailing_states[admin_id]['content_type'] = 'video'
                self.mailing_states[admin_id]['content_data'] = {
                    'file_id': message.video.file_id,
                    'caption': message.caption
                }
            elif message.document:
                self.mailing_states[admin_id]['content_type'] = 'document'
                self.mailing_states[admin_id]['content_data'] = {
                    'file_id': message.document.file_id,
                    'caption': message.caption
                }
            
            # Перестаем ждать контент и спрашиваем про кнопку
            self.mailing_states[admin_id]['waiting_for_content'] = False
            self.mailing_states[admin_id]['waiting_for_button_choice'] = True
            
            # Спрашиваем, хочет ли админ добавить кнопку
            from telebot import types
            keyboard = types.InlineKeyboardMarkup()
            keyboard.add(
                types.InlineKeyboardButton(text='✅ Да', callback_data='mail_add_button_yes'),
                types.InlineKeyboardButton(text='❌ Нет', callback_data='mail_add_button_no')
            )
            self.bot.send_message(
                chat_id=admin_id,
                text='❓ Хотите добавить inline-кнопку к посту?',
                reply_markup=keyboard
            )

        self.bot.infinity_polling()
    
    def _show_preview(self, admin_id):
        """Показывает превью сообщения перед рассылкой."""
        if admin_id not in self.mailing_states:
            return
        
        state = self.mailing_states[admin_id]
        content_type = state.get('content_type')
        content_data = state.get('content_data')
        
        if not content_type or not content_data:
            return
        
        if not content_type:
            return
        
        # Для медиа-группы content_data может быть None
        if content_type != 'media_group' and not content_data:
            return
        
        # Создаем клавиатуру с кнопками подтверждения/отмены
        from telebot import types
        keyboard_to_use = types.InlineKeyboardMarkup()
        
        # Если есть кнопка для поста, добавляем её в превью
        if state.get('button_text'):
            button_type = state.get('button_type', 'url')
            if button_type == 'web_app':
                keyboard_to_use.add(
                    types.InlineKeyboardButton(
                        text=state['button_text'],
                        web_app=types.WebAppInfo(url=state.get('button_url', 'https://os-gift.store/'))
                    )
                )
            else:
                keyboard_to_use.add(
                    types.InlineKeyboardButton(text=state['button_text'], url=state['button_url'])
                )
        
        # Всегда добавляем кнопки подтверждения/отмены
        keyboard_to_use.add(
            types.InlineKeyboardButton(text='✅ Подтвердить', callback_data='mail_confirm'),
            types.InlineKeyboardButton(text='❌ Отменить', callback_data='mail_cancel')
        )
        
        # Отправляем превью в зависимости от типа контента
        try:
            if content_type == 'text':
                self.bot.send_message(
                    chat_id=admin_id,
                    text=f'📋 <b>Превью сообщения:</b>\n\n{content_data["text"]}',
                    parse_mode='HTML',
                    reply_markup=keyboard_to_use
                )
            elif content_type == 'photo':
                caption_text = f'📋 <b>Превью сообщения:</b>\n\n{content_data.get("caption", "")}' if content_data.get("caption") else '📋 <b>Превью сообщения</b>'
                self.bot.send_photo(
                    chat_id=admin_id,
                    photo=content_data['file_id'],
                    caption=caption_text,
                    parse_mode='HTML',
                    reply_markup=keyboard_to_use
                )
            elif content_type == 'video':
                caption_text = f'📋 <b>Превью сообщения:</b>\n\n{content_data.get("caption", "")}' if content_data.get("caption") else '📋 <b>Превью сообщения</b>'
                self.bot.send_video(
                    chat_id=admin_id,
                    video=content_data['file_id'],
                    caption=caption_text,
                    parse_mode='HTML',
                    reply_markup=keyboard_to_use
                )
            elif content_type == 'document':
                caption_text = f'📋 <b>Превью сообщения:</b>\n\n{content_data.get("caption", "")}' if content_data.get("caption") else '📋 <b>Превью сообщения</b>'
                self.bot.send_document(
                    chat_id=admin_id,
                    document=content_data['file_id'],
                    caption=caption_text,
                    parse_mode='HTML',
                    reply_markup=keyboard_to_use
                )
            elif content_type == 'media_group':
                # Для медиа-группы отправляем первое медиа как превью
                media_group = state.get('media_group', [])
                if media_group:
                    first_media = media_group[0]
                    preview_text = '📋 <b>Превью медиа-группы</b>'
                    if first_media['type'] == 'photo':
                        self.bot.send_photo(
                            chat_id=admin_id,
                            photo=first_media['file_id'],
                            caption=preview_text + f'\n\nВсего файлов: {len(media_group)}',
                            parse_mode='HTML',
                            reply_markup=keyboard_to_use
                        )
                    elif first_media['type'] == 'video':
                        self.bot.send_video(
                            chat_id=admin_id,
                            video=first_media['file_id'],
                            caption=preview_text + f'\n\nВсего файлов: {len(media_group)}',
                            parse_mode='HTML',
                            reply_markup=keyboard_to_use
                        )
                    else:
                        self.bot.send_message(
                            chat_id=admin_id,
                            text=preview_text + f'\n\nВсего файлов: {len(media_group)}',
                            parse_mode='HTML',
                            reply_markup=keyboard_to_use
                        )
        except Exception as e:
            error_keyboard = types.InlineKeyboardMarkup()
            error_keyboard.add(
                types.InlineKeyboardButton(text='✅ Подтвердить', callback_data='mail_confirm'),
                types.InlineKeyboardButton(text='❌ Отменить', callback_data='mail_cancel')
            )
            self.bot.send_message(
                chat_id=admin_id,
                text=f'❌ Ошибка при создании превью: {e}',
                reply_markup=error_keyboard
            )
    
    def _start_mailing(self, admin_id):
        """Запускает рассылку на основе сохраненного состояния."""
        if admin_id not in self.mailing_states:
            return
        
        state = self.mailing_states[admin_id]
        content_type = state.get('content_type')
        content_data = state.get('content_data')
        
        if not content_type or not content_data:
            return
        
        # Создаем клавиатуру, если есть кнопка
        from telebot import types
        reply_markup = None
        if state.get('button_text'):
            reply_markup = types.InlineKeyboardMarkup()
            button_type = state.get('button_type', 'url')
            if button_type == 'web_app':
                reply_markup.add(
                    types.InlineKeyboardButton(
                        text=state['button_text'],
                        web_app=types.WebAppInfo(url=state.get('button_url', 'https://os-gift.store/'))
                    )
                )
            else:
                reply_markup.add(
                    types.InlineKeyboardButton(text=state['button_text'], url=state['button_url'])
                )
        
        # Запускаем рассылку в зависимости от типа контента
        if content_type == 'text':
            self._send_mailing_text(admin_id, content_data['text'], reply_markup)
        elif content_type == 'photo':
            self._send_mailing_photo(admin_id, content_data['file_id'], content_data.get('caption'), reply_markup)
        elif content_type == 'video':
            self._send_mailing_video(admin_id, content_data['file_id'], content_data.get('caption'), reply_markup)
        elif content_type == 'document':
            self._send_mailing_document(admin_id, content_data['file_id'], content_data.get('caption'), reply_markup)
        elif content_type == 'media_group':
            self._send_mailing_media_group(admin_id, state['media_group'], reply_markup)
        
        # Очищаем состояние
        if admin_id in self.media_group_timers:
            del self.media_group_timers[admin_id]
        del self.mailing_states[admin_id]
    
    def _send_mailing_text(self, admin_id, text, reply_markup=None):
        """Рассылка текстового сообщения."""
        users = self.db.get_all_users()
        total_users = len(users)
        successful = 0
        failed = 0
        blocked = 0
        
        start_time = time.time()
        
        status_msg = self.bot.send_message(
            chat_id=admin_id,
            text=f'📤 Начало рассылки...\nВсего пользователей: {total_users}'
        )
        
        for user_id in users:
            try:
                self.bot.send_message(chat_id=user_id, text=text, reply_markup=reply_markup)
                successful += 1
            except Exception as e:
                failed += 1
                error_str = str(e).lower()
                if 'blocked' in error_str or 'chat not found' in error_str:
                    blocked += 1
        
        elapsed_time = time.time() - start_time
        
        self._send_statistics(admin_id, status_msg.message_id, total_users, successful, failed, blocked, elapsed_time)

    def _send_mailing_photo(self, admin_id, file_id, caption=None, reply_markup=None):
        """Рассылка фото."""
        users = self.db.get_all_users()
        total_users = len(users)
        successful = 0
        failed = 0
        blocked = 0
        
        start_time = time.time()
        
        status_msg = self.bot.send_message(
            chat_id=admin_id,
            text=f'📤 Начало рассылки...\nВсего пользователей: {total_users}'
        )
        
        for user_id in users:
            try:
                self.bot.send_photo(chat_id=user_id, photo=file_id, caption=caption, reply_markup=reply_markup)
                successful += 1
            except Exception as e:
                failed += 1
                error_str = str(e).lower()
                if 'blocked' in error_str or 'chat not found' in error_str:
                    blocked += 1
        
        elapsed_time = time.time() - start_time
        
        self._send_statistics(admin_id, status_msg.message_id, total_users, successful, failed, blocked, elapsed_time)

    def _send_mailing_video(self, admin_id, file_id, caption=None, reply_markup=None):
        """Рассылка видео."""
        users = self.db.get_all_users()
        total_users = len(users)
        successful = 0
        failed = 0
        blocked = 0
        
        start_time = time.time()
        
        status_msg = self.bot.send_message(
            chat_id=admin_id,
            text=f'📤 Начало рассылки...\nВсего пользователей: {total_users}'
        )
        
        for user_id in users:
            try:
                self.bot.send_video(chat_id=user_id, video=file_id, caption=caption, reply_markup=reply_markup)
                successful += 1
            except Exception as e:
                failed += 1
                error_str = str(e).lower()
                if 'blocked' in error_str or 'chat not found' in error_str:
                    blocked += 1
        
        elapsed_time = time.time() - start_time
        
        self._send_statistics(admin_id, status_msg.message_id, total_users, successful, failed, blocked, elapsed_time)

    def _send_mailing_document(self, admin_id, file_id, caption=None, reply_markup=None):
        """Рассылка документа."""
        users = self.db.get_all_users()
        total_users = len(users)
        successful = 0
        failed = 0
        blocked = 0
        
        start_time = time.time()
        
        status_msg = self.bot.send_message(
            chat_id=admin_id,
            text=f'📤 Начало рассылки...\nВсего пользователей: {total_users}'
        )
        
        for user_id in users:
            try:
                self.bot.send_document(chat_id=user_id, document=file_id, caption=caption, reply_markup=reply_markup)
                successful += 1
            except Exception as e:
                failed += 1
                error_str = str(e).lower()
                if 'blocked' in error_str or 'chat not found' in error_str:
                    blocked += 1
        
        elapsed_time = time.time() - start_time
        
        self._send_statistics(admin_id, status_msg.message_id, total_users, successful, failed, blocked, elapsed_time)

    def _process_media_group(self, admin_id, media_group_id):
        """Обрабатывает медиа-группу после сбора всех элементов."""
        if admin_id not in self.mailing_states:
            return
        
        if self.mailing_states[admin_id]['media_group_id'] != media_group_id:
            return  # Это была другая группа
        
        media_group = self.mailing_states[admin_id]['media_group']
        if not media_group:
            return
        
        # Удаляем таймер
        if admin_id in self.media_group_timers:
            del self.media_group_timers[admin_id]
        
        # Сохраняем медиа-группу в состояние
        self.mailing_states[admin_id]['content_type'] = 'media_group'
        self.mailing_states[admin_id]['content_data'] = None  # Медиа-группа хранится отдельно
        self.mailing_states[admin_id]['waiting_for_content'] = False
        self.mailing_states[admin_id]['waiting_for_button_choice'] = True
        
        # Спрашиваем, хочет ли админ добавить кнопку
        from telebot import types
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton(text='✅ Да', callback_data='mail_add_button_yes'),
            types.InlineKeyboardButton(text='❌ Нет', callback_data='mail_add_button_no')
        )
        self.bot.send_message(
            chat_id=admin_id,
            text='❓ Хотите добавить inline-кнопку к посту?',
            reply_markup=keyboard
        )

    def _send_mailing_media_group(self, admin_id, media_group, reply_markup=None):
        """Рассылка медиа-группы."""
        users = self.db.get_all_users()
        total_users = len(users)
        successful = 0
        failed = 0
        blocked = 0
        
        start_time = time.time()
        
        status_msg = self.bot.send_message(
            chat_id=admin_id,
            text=f'📤 Начало рассылки медиа-группы...\nВсего пользователей: {total_users}'
        )
        
        # Подготавливаем медиа для отправки
        media_list = []
        
        # Находим caption (обычно он только у последнего элемента)
        caption = None
        for media_item in media_group:
            if media_item['caption']:
                caption = media_item['caption']
        
        for i, media_item in enumerate(media_group):
            is_last = (i == len(media_group) - 1)
            media_caption = caption if is_last else None
            
            if media_item['type'] == 'photo':
                media_list.append(InputMediaPhoto(
                    media=media_item['file_id'],
                    caption=media_caption
                ))
            elif media_item['type'] == 'video':
                media_list.append(InputMediaVideo(
                    media=media_item['file_id'],
                    caption=media_caption
                ))
            elif media_item['type'] == 'document':
                media_list.append(InputMediaDocument(
                    media=media_item['file_id'],
                    caption=media_caption
                ))
        
        for user_id in users:
            try:
                # Отправляем медиа-группу
                sent_messages = self.bot.send_media_group(chat_id=user_id, media=media_list)
                # Если есть кнопка, отправляем её отдельным сообщением после медиа-группы
                if reply_markup:
                    self.bot.send_message(chat_id=user_id, text='👇', reply_markup=reply_markup)
                successful += 1
            except Exception as e:
                failed += 1
                error_str = str(e).lower()
                if 'blocked' in error_str or 'chat not found' in error_str:
                    blocked += 1
        
        elapsed_time = time.time() - start_time
        
        self._send_statistics(admin_id, status_msg.message_id, total_users, successful, failed, blocked, elapsed_time)

    def _send_statistics(self, admin_id, status_msg_id, total_users, successful, failed, blocked, elapsed_time):
        """Отправка статистики рассылки админу."""
        # Удаляем сообщение о начале рассылки
        try:
            self.bot.delete_message(chat_id=admin_id, message_id=status_msg_id)
        except:
            pass
        
        # Форматируем время
        if elapsed_time < 60:
            time_str = f'{elapsed_time:.2f} сек'
        else:
            minutes = int(elapsed_time // 60)
            seconds = elapsed_time % 60
            time_str = f'{minutes} мин {seconds:.1f} сек'
        
        stats_text = (
            f'✅ Рассылка завершена!\n\n'
            f'📊 Статистика:\n'
            f'• Всего пользователей: {total_users}\n'
            f'• Успешно отправлено: {successful}\n'
            f'• Ошибок: {failed}\n'
            f'• Заблокировали бота: {blocked}\n'
            f'• Время выполнения: {time_str}\n'
            f'• Процент успеха: {(successful/total_users*100) if total_users > 0 else 0:.1f}%'
        )
        
        self.bot.send_message(chat_id=admin_id, text=stats_text)
    

def main():
    bot = Bot()
    bot.run()


if __name__ == '__main__':
    main()
