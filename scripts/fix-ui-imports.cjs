const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '../packages/ui/src/components');
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Corrigir utilitários
    content = content.replace(/@\/lib\/utils/g, '../lib/utils');
    
    // 2. Corrigir referências cruzadas entre componentes
    // Ex: "@/components/ui/button" -> "./button"
    content = content.replace(/@\/components\/ui\//g, './');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Processado: ${file}`);
  }
});
