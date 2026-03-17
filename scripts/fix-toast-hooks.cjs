const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../apps/web/src');

function fixUseToast(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixUseToast(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Se importa useToast de @theadoro/ui, mude para local
      if (content.includes("useToast") && content.includes("from '@theadoro/ui'")) {
        // Precisamos ser cuidadosos aqui, pois pode haver outros imports no mesmo bloco de @theadoro/ui
        // A melhor forma é remover useToast do import de @theadoro/ui e adicionar um novo import local
        
        const regex = /import\s+{([^}]*)\buseToast\b([^}]*)}\s+from\s+'@theadoro\/ui'/g;
        if (regex.test(content)) {
          // Remove useToast do import coletivo
          content = content.replace(regex, (match, before, after) => {
            const others = (before + after).split(',').map(s => s.trim()).filter(Boolean).join(', ');
            if (others) {
              return `import { ${others} } from '@theadoro/ui';\nimport { useToast } from '@/hooks/use-toast'`;
            }
            return `import { useToast } from '@/hooks/use-toast'`;
          });
          
          fs.writeFileSync(filePath, content);
          console.log(`✅ useToast corrigido em: ${file}`);
        }
      }
    }
  });
}

fixUseToast(srcDir);
