import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  private logFile: string;

  constructor() {
    const logDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logFile = path.join(logDir, 'automation.log');
    
    // Clear log on start
    fs.writeFileSync(this.logFile, '');
  }

  private write(level: string, message: string) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level}] : ${message}\n`;
    fs.appendFileSync(this.logFile, formatted);
    console.log(formatted.trim());
  }

  info(msg: string) {
    this.write('INFO', msg);
  }

  warn(msg: string) {
    this.write('WARN', msg);
  }

  error(msg: string, stack?: string) {
    this.write('ERROR', msg);
    if (stack) {
      this.write('STACK', stack);
    }
  }
}

export const logger = new Logger();
