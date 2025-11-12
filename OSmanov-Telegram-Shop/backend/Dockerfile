FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY src/ ./src/

# Собираем TypeScript
RUN npm run build

# Проверяем что файлы создались
RUN ls -la dist/

EXPOSE 5000

CMD ["node", "dist/index.js"]