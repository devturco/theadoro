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
      
      // Regex para achar imports de componentes individuais
      // Ex: import { Button } from "@/components/ui/button" -> import { Button } from "@theadoro/ui"
      // Também trata casos de múltiplos imports: import { Button, Input } from "@/components/ui/..."
      
      const uiImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui\/[^'"]+['"]/g;
      
      if (uiImportRegex.test(content)) {
        // Coleta todos os nomes de componentes importados de /ui/
        // Como agora exportamos tudo de @theadoro/ui, podemos agrupar ou apenas mudar o path
        // O mais simples e seguro por agora é mudar o path para @theadoro/ui
        content = content.replace(/from\s+['"]@\/components\/ui\/[^'"]+['"]/g, "from '@theadoro/ui'");
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Atualizado: ${filePath}`);
      }
    }
  });
}

walk(srcDir);
