import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

interface ZipValidationResult {
  isValid: boolean;
  error?: string;
  uncompressedSizeMB?: number;
}

export const validateAndExtractZip = (
  zipPath: string,
  extractDest: string,
  maxFiles = 5000,
  maxSizeMB = 1500
): ZipValidationResult => {
  try {
    if (!fs.existsSync(zipPath)) {
      return { isValid: false, error: 'Архивный файл не найден на сервере.' };
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    if (entries.length > maxFiles) {
      return { 
        isValid: false, 
        error: `Архив содержит слишком много файлов (${entries.length}). Максимально разрешено: ${maxFiles}.` 
      };
    }

    let totalSize = 0;
    const prohibitedExtensions = [
      '.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.scr', '.com', '.bin', 
      '.dll', '.sys', '.jar', '.py', '.pl', '.rb', '.ps1', '.reg', '.lnk', '.cfg'
    ];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName;

      // 1. Prevent Zip Slip Vulnerability (Directory Traversal)
      const normalizedName = path.normalize(entryName);
      if (
        normalizedName.includes('..') || 
        normalizedName.startsWith('/') || 
        normalizedName.startsWith('\\') ||
        path.isAbsolute(normalizedName)
      ) {
        return { 
          isValid: false, 
          error: `Угроза безопасности (Zip Slip): некорректный относительный путь '${entryName}' в архиве.` 
        };
      }

      // 2. Prevent Executable Trojans / Executable Malware
      const ext = path.extname(entryName).toLowerCase();
      if (prohibitedExtensions.includes(ext)) {
        return { 
          isValid: false, 
          error: `Запрещенный тип файла '${entryName}' в архиве (${ext}). Исполняемые файлы и системные скрипты заблокированы в целях безопасности.` 
        };
      }

      // 3. Accumulate uncompressed sizes
      totalSize += entry.header.size;
    }

    const uncompressedSizeMB = totalSize / (1024 * 1024);
    if (uncompressedSizeMB > maxSizeMB) {
      return { 
        isValid: false, 
        error: `Объем распакованных файлов слишком велик (${uncompressedSizeMB.toFixed(1)} МБ). Максимально разрешено: ${maxSizeMB} МБ.` 
      };
    }

    // Perform safe extraction
    if (fs.existsSync(extractDest)) {
      fs.rmSync(extractDest, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDest, { recursive: true });

    zip.extractAllTo(extractDest, true);

    // Post-extraction optimization: find and inject styles to hide the default Unity footer 
    // and make the canvas fit 100% of the iframe fluid container!
    try {
      const findAndModifyStyles = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            findAndModifyStyles(fullPath);
          } else if (file === 'style.css' && fullPath.includes('TemplateData')) {
            const customStyles = `
/* WebGL Arcade Frame Fluid Fit Overrides */
html, body {
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: #000 !important;
  overflow: hidden !important;
}
#unity-container {
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  transform: none !important;
  margin: 0 !important;
}
#unity-canvas {
  width: 100% !important;
  height: 100% !important;
  background: #000 !important;
  display: block !important;
}
#unity-footer {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}
#unity-loading-bar {
  z-index: 10 !important;
}
`;
            fs.appendFileSync(fullPath, customStyles);
          }
        }
      };
      findAndModifyStyles(extractDest);
    } catch (styleErr) {
      console.error("Failed to inject fluid styling to extracted game:", styleErr);
    }

    return { 
      isValid: true, 
      uncompressedSizeMB: parseFloat(uncompressedSizeMB.toFixed(2)) 
    };

  } catch (err: any) {
    return { 
      isValid: false, 
      error: `Ошибка при распаковке или проверке безопасности архива: ${err.message}` 
    };
  }
};
