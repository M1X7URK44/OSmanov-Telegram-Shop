#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const readline = require("readline");
const axios = require("axios");

const API_BASE_URL = "http://localhost:5000"; // Измените на ваш URL бэкенда

// Создаем интерфейс для ввода
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class AdminCreator {
  constructor() {
    console.log(`
╔═══════════════════════════════════════════╗
║    Создание учетной записи администратора    ║
╚═══════════════════════════════════════════╝
    `);
  }

  // Метод через прямой доступ к базе данных
  async createViaDatabase() {
    console.log("\n📦 Метод 1: Прямое создание в базе данных\n");

    const config = {
      host: "localhost",
      port: 5432,
      database: "gifts_app",
      user: "postgres",
      password: "password",
    };

    try {
      const client = new Client(config);
      await client.connect();
      console.log("✅ Подключение к базе данных установлено");

      // Спрашиваем данные
      const username = await this.question("Введите логин администратора: ");
      const email = await this.question("Введите email администратора: ");
      const password = await this.question(
        "Введите пароль администратора: ",
        true
      );
      const role =
        (await this.question(
          "Введите роль (admin/superadmin) [superadmin]: "
        )) || "superadmin";

      // Генерируем хэш пароля
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Проверяем, существует ли пользователь
      const checkResult = await client.query(
        "SELECT id FROM admin_users WHERE username = $1 OR email = $2",
        [username, email]
      );

      if (checkResult.rows.length > 0) {
        console.log(
          "❌ Администратор с таким логином или email уже существует!"
        );
        await client.end();
        return;
      }

      // Создаем администратора
      const result = await client.query(
        `INSERT INTO admin_users (username, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, username, email, role, created_at`,
        [username, email, passwordHash, role]
      );

      console.log("\n✅ Администратор успешно создан!");
      console.log("┌─────────────────────────────────────┐");
      console.log(`│ ID:        ${result.rows[0].id}`);
      console.log(`│ Логин:     ${result.rows[0].username}`);
      console.log(`│ Email:     ${result.rows[0].email}`);
      console.log(`│ Роль:      ${result.rows[0].role}`);
      console.log(`│ Создан:    ${result.rows[0].created_at}`);
      console.log("└─────────────────────────────────────┘");

      await client.end();
    } catch (error) {
      console.error("❌ Ошибка при создании администратора:", error.message);
    }
  }

  // Метод через API (если он доступен)
  async createViaAPI() {
    console.log("\n🌐 Метод 2: Создание через API\n");

    try {
      // Сначала пробуем войти как суперадмин
      const superAdminLogin =
        (await this.question("Логин суперадмина [admin]: ")) || "admin";
      const superAdminPassword =
        (await this.question("Пароль суперадмина [admin123]: ", true)) ||
        "admin123";

      // Авторизуемся
      console.log("🔐 Авторизация...");
      const loginResponse = await axios.post(
        `${API_BASE_URL}/api/admin/login`,
        {
          username: superAdminLogin,
          password: superAdminPassword,
        }
      );

      if (loginResponse.data.status !== "success") {
        throw new Error("Не удалось авторизоваться как суперадмин");
      }

      const token = loginResponse.data.data.token;
      console.log("✅ Авторизация успешна");

      // Спрашиваем данные нового администратора
      const username = await this.question(
        "Введите логин нового администратора: "
      );
      const email = await this.question(
        "Введите email нового администратора: "
      );
      const password = await this.question(
        "Введите пароль нового администратора: ",
        true
      );
      const role =
        (await this.question("Введите роль (admin/superadmin) [admin]: ")) ||
        "admin";

      // Отправляем запрос на создание
      console.log("📤 Отправка запроса на создание администратора...");

      // ВАЖНО: Здесь нужно реализовать API endpoint для создания администраторов
      // Например: POST /api/admin/users
      // Пока используем прямой запрос к базе данных через API

      console.log(
        "⚠️  API endpoint для создания администраторов не реализован"
      );
      console.log("   Используйте метод 1 (прямое создание в БД)");
    } catch (error) {
      console.error("❌ Ошибка при создании через API:", error.message);
    }
  }

  // Метод через Docker контейнер
  async createViaDocker() {
    console.log("\n🐳 Метод 3: Создание через Docker контейнер\n");

    try {
      const username = await this.question("Введите логин администратора: ");
      const email = await this.question("Введите email администратора: ");
      const password = await this.question(
        "Введите пароль администратора: ",
        true
      );
      const role =
        (await this.question(
          "Введите роль (admin/superadmin) [superadmin]: "
        )) || "superadmin";

      // Генерируем хэш пароля
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // SQL команда
      const sql = `
        INSERT INTO admin_users (username, email, password_hash, role) 
        VALUES ('${username}', '${email}', '${passwordHash}', '${role}')
        ON CONFLICT (username) DO NOTHING
        RETURNING id, username, email, role, created_at;
      `;

      // Команда для выполнения в Docker контейнере
      const dockerCommand = `docker exec osmanov-telegram-shop-postgres-1 psql -U postgres -d gifts_app -c "${sql.replace(
        /\n/g,
        " "
      )}"`;

      console.log("\n📋 Выполните следующую команду:");
      console.log("----------------------------------------");
      console.log(dockerCommand);
      console.log("----------------------------------------\n");

      console.log("Или выполните вручную через:");
      console.log("1. docker exec -it osmanov-telegram-shop-postgres-1 bash");
      console.log("2. psql -U postgres -d gifts_app");
      console.log("3. Выполните SQL команду:");
      console.log(sql);
    } catch (error) {
      console.error("❌ Ошибка:", error.message);
    }
  }

  // Утилита для вопросов с маскировкой пароля
  question(query, isPassword = false) {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer.trim());
      });

      if (isPassword) {
        // Маскируем ввод пароля (для Node.js)
        const stdin = process.openStdin();
        stdin.on("keypress", (chunk, key) => {
          if (key && key.name === "backspace") {
            process.stdout.write("\b \b");
          }
        });
      }
    });
  }

  async run() {
    console.log("Выберите метод создания администратора:");
    console.log("1. Прямое создание в базе данных");
    console.log("2. Создание через API (если реализовано)");
    console.log("3. Создание через Docker контейнер");
    console.log("4. Выход");

    const choice = (await this.question("\nВыберите вариант [1]: ")) || "1";

    switch (choice) {
      case "1":
        await this.createViaDatabase();
        break;
      case "2":
        await this.createViaAPI();
        break;
      case "3":
        await this.createViaDocker();
        break;
      case "4":
        console.log("👋 Выход...");
        process.exit(0);
        break;
      default:
        console.log("❌ Неверный выбор");
    }

    rl.close();
  }
}

// Запуск скрипта
const adminCreator = new AdminCreator();
adminCreator.run().catch(console.error);
