# Estágio de Build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos da aplicação
COPY . .

# Builda a aplicação
RUN npm run build

# Estágio de Produção
FROM nginx:stable-alpine

# Copia os arquivos buildados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
