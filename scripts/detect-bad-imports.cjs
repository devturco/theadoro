const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../apps/web/src');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Lista de componentes que ficaram no app web
      const localComponents = [
        'Sidebar', 'SidebarProvider', 'SidebarTrigger', 'SidebarHeader', 'SidebarFooter', 'SidebarContent', 
        'SidebarGroup', 'SidebarGroupLabel', 'SidebarGroupAction', 'SidebarGroupContent', 'SidebarMenu', 
        'SidebarMenuItem', 'SidebarMenuButton', 'SidebarMenuAction', 'SidebarMenuBadge', 'SidebarMenuSub', 
        'SidebarMenuSubItem', 'SidebarMenuSubButton', 'FileUpload', 'Toaster'
      ];

      localComponents.forEach(comp => {
        // Se o componente está sendo importado de @theadoro/ui, mas deveria ser local
        const regex = new RegExp(`import\\s+{[^}]*\\b${comp}\\b[^}]*}\\s+from\\s+'@theadoro/ui'`, 'g');
        if (regex.test(content)) {
          // Aqui a lógica é mais complexa porque pode haver outros componentes no mesmo import
          // Mas para simplificar e garantir o build, vou tentar isolar o import problemático
          console.log(`⚠️ Detectado import incorreto de ${comp} em: ${file}`);
          
          // Se o import tiver APENAS componentes locais, mudamos o 'from'
          // Se tiver misturado, precisamos quebrar o import (isso é mais difícil via regex simples)
          // Como medida de segurança, vou marcar para correção manual ou tentar um replace mais inteligente
        }
      });
    }
  });
}

walk(srcDir);
