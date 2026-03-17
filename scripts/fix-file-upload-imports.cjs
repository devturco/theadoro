const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../apps/web/src');

function fixFileUpload(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixFileUpload(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Se importa FileUpload de @theadoro/ui, mude para local
      if (content.includes("import { FileUpload } from '@theadoro/ui'") || content.includes("import { FileUpload } from \"@theadoro/ui\"")) {
        content = content.replace(/import { FileUpload } from '@theadoro\/ui'/g, "import { FileUpload } from '@/components/ui/file-upload'");
        content = content.replace(/import { FileUpload } from "@theadoro\/ui"/g, "import { FileUpload } from '@/components/ui/file-upload'");
        fs.writeFileSync(filePath, content);
        console.log(`✅ FileUpload corrigido em: ${file}`);
      }
    }
  });
}

fixFileUpload(srcDir);
