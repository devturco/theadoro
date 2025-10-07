# Dockerfile multi-stage para THEADORO Gift Marketplace
# Otimizado para EasyPanel deployment

# ================================
# Stage 1: Build da aplicação
# ================================
FROM node:18-alpine AS builder

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY index.html ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/

# Argumentos de build para variáveis de ambiente
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Definir variáveis de ambiente para o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV NODE_ENV=production

# Build da aplicação
RUN npm run build

# ================================
# Stage 2: Servidor de produção
# ================================
FROM nginx:alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Remover configuração padrão do nginx e copiar nossas configurações
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar assets estáticos
COPY --from=builder /app/public/favicon.ico /usr/share/nginx/html/
COPY --from=builder /app/public/icon.png /usr/share/nginx/html/
COPY --from=builder /app/public/logo-colors.png /usr/share/nginx/html/
COPY --from=builder /app/public/robots.txt /usr/share/nginx/html/

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Criar diretórios necessários e definir permissões
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx && \
    chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /var/lib/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    chmod 755 /var/cache/nginx /var/log/nginx /var/lib/nginx

# Configurar nginx para rodar sem PID file (mais seguro para containers)
RUN mkdir -p /tmp/nginx && \
    chown -R nextjs:nodejs /tmp/nginx

# Mudar para usuário não-root
USER nextjs

# Expor porta 8080 (padrão para containers não-root)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]