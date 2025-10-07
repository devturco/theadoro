# 🚀 Deploy THEADORO no EasyPanel

Este guia explica como fazer deploy do projeto THEADORO Gift Marketplace no EasyPanel usando Docker.

## 📋 Pré-requisitos

- Conta no [EasyPanel](https://easypanel.io/)
- Repositório Git com o código (GitHub, GitLab, etc.)
- Variáveis de ambiente do Supabase configuradas

## 🔧 Configuração das Variáveis de Ambiente

Antes do deploy, configure as seguintes variáveis de ambiente no EasyPanel:

```bash
VITE_SUPABASE_URL=https://xdedlwozqqyhjovdobym.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xdedlwozqqyhjovdobym
```

## 🐳 Arquivos Docker Incluídos

O projeto já inclui todos os arquivos necessários para deploy:

- **`Dockerfile`** - Multi-stage build otimizado
- **`nginx.conf`** - Configuração Nginx para SPA
- **`.dockerignore`** - Otimização do build

## 📦 Passos para Deploy no EasyPanel

### 1. Criar Novo Projeto

1. Acesse o painel do EasyPanel
2. Clique em **"Create Project"**
3. Escolha **"Deploy from Git"**

### 2. Configurar Repositório

1. Conecte seu repositório Git
2. Selecione a branch principal (main/master)
3. Configure o caminho do Dockerfile: `./Dockerfile`

### 3. Configurar Build

```yaml
# Configurações de Build
Build Context: ./
Dockerfile Path: ./Dockerfile
Build Args:
  - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
  - VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
  - VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
```

### 4. Configurar Serviço

```yaml
# Configurações do Serviço
Port: 8080
Health Check: /health
Environment Variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
  - VITE_SUPABASE_PROJECT_ID
```

### 5. Configurar Domínio

1. Configure um domínio personalizado ou use o subdomínio fornecido
2. Ative HTTPS (recomendado)
3. Configure redirecionamento HTTP → HTTPS

## ⚙️ Configurações Avançadas

### Recursos Recomendados

```yaml
CPU: 0.5 vCPU
Memory: 512 MB
Storage: 1 GB
```

### Auto-scaling (Opcional)

```yaml
Min Instances: 1
Max Instances: 3
CPU Threshold: 70%
Memory Threshold: 80%
```

### Backup e Monitoramento

- Configure backups automáticos
- Ative logs de aplicação
- Configure alertas de saúde

## 🔍 Verificação do Deploy

Após o deploy, verifique:

1. **Health Check**: `https://seu-dominio.com/health`
2. **Aplicação**: `https://seu-dominio.com/`
3. **Logs**: Verifique os logs no painel do EasyPanel

### Endpoints de Teste

```bash
# Health check
curl https://seu-dominio.com/health

# Página principal
curl https://seu-dominio.com/

# Teste de SPA routing
curl https://seu-dominio.com/auth
curl https://seu-dominio.com/dashboard
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Build Falha
```bash
# Verificar logs de build
docker build -t theadoro-test .

# Testar localmente
docker run -p 8080:8080 theadoro-test
```

#### 2. Variáveis de Ambiente
- Verifique se todas as variáveis estão configuradas
- Confirme que os valores estão corretos
- Teste a conexão com Supabase

#### 3. Problemas de Roteamento
- Verifique se o nginx.conf está correto
- Teste as rotas SPA manualmente
- Verifique os logs do nginx

#### 4. Problemas de Performance
```bash
# Verificar recursos
docker stats

# Verificar logs
docker logs container-id
```

## 📊 Monitoramento

### Métricas Importantes

- **Response Time**: < 200ms
- **Uptime**: > 99.9%
- **Memory Usage**: < 80%
- **CPU Usage**: < 70%

### Logs Úteis

```bash
# Logs da aplicação
tail -f /var/log/nginx/access.log

# Logs de erro
tail -f /var/log/nginx/error.log
```

## 🔄 CI/CD (Opcional)

Para deploy automático, configure webhooks:

1. No EasyPanel, vá em **Settings > Webhooks**
2. Configure trigger no push para branch principal
3. Ative rebuild automático

## 📞 Suporte

- **EasyPanel Docs**: https://easypanel.io/docs
- **Nginx Docs**: https://nginx.org/en/docs/
- **Docker Docs**: https://docs.docker.com/

## 🎉 Deploy Concluído!

Após seguir estes passos, sua aplicação THEADORO estará rodando no EasyPanel com:

- ✅ Build otimizado multi-stage
- ✅ Servidor Nginx configurado para SPA
- ✅ Variáveis de ambiente do Supabase
- ✅ Health checks configurados
- ✅ HTTPS habilitado
- ✅ Logs e monitoramento ativos

**URL da aplicação**: `https://seu-dominio.com`