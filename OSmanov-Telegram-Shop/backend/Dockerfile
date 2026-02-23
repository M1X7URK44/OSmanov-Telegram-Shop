FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости (включая devDependencies для сборки TypeScript)
RUN npm install

# Явно устанавливаем типы для nodemailer (на случай если они не установились)
RUN npm install --save-dev @types/nodemailer || echo "Types already installed"

# Копируем исходный код
COPY src/ ./src/

# Собираем TypeScript
RUN npm run build

# Проверяем что файлы создались
RUN ls -la dist/

EXPOSE 5000

CMD ["node", "dist/index.js"]