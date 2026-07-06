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
