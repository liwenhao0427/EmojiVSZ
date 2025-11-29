
export enum LogLevel {
  DEBUG = 'DEBUG',
  LOG = 'LOG',
  EVENT = 'EVENT',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  source: string;
  message: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private logContainer: HTMLDivElement | null = null;
  private logContent: HTMLPreElement | null = null;
  private visibleLevels: Set<LogLevel> = new Set([LogLevel.EVENT, LogLevel.ERROR]);

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public debug(source: string, message: string) { this.addLog(LogLevel.DEBUG, source, message); }
  public log(source: string, message: string) { this.addLog(LogLevel.LOG, source, message); }
  public event(source: string, message: string) { this.addLog(LogLevel.EVENT, source, message); }
  public error(source: string, message: string) { this.addLog(LogLevel.ERROR, source, message); }

  private addLog(level: LogLevel, source: string, message: string) {
    const timestamp = performance.now().toFixed(0).padStart(8, '0');
    const entry: LogEntry = { level, timestamp, source, message };
    this.logs.push(entry);

    if (this.visibleLevels.has(level)) {
        console.log(`[${entry.timestamp}ms] [${entry.source.padEnd(15, ' ')}] [${entry.level}] ${entry.message}`);
    }

    this.updateLogContainer();
  }

  private getFilteredLogs(): string {
    return this.logs
      .filter(log => this.visibleLevels.has(log.level))
      .map(log => `[${log.timestamp}ms] [${log.source.padEnd(15, ' ')}] [${log.level.padEnd(5, ' ')}] ${log.message}`)
      .join('\n');
  }

  private updateLogContainer() {
    if (this.logContent) {
      this.logContent.textContent = this.getFilteredLogs();
      if(this.logContainer) {
          this.logContainer.scrollTo(0, this.logContainer.scrollHeight);
      }
    }
  }

  public displayLogsUI() {
    if (document.getElementById('game-logger-container')) return;

    const container = document.createElement('div');
    container.id = 'game-logger-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '80px', right: '20px', width: '500px', height: '300px',
      backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px',
      zIndex: '9999', display: 'none', flexDirection: 'column', fontFamily: 'monospace', fontSize: '12px',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      padding: '8px', backgroundColor: '#1e293b', color: 'white', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
    });
    header.textContent = '游戏事件日志';

    const copyButton = document.createElement('button');
    Object.assign(copyButton.style, {
      padding: '4px 8px', border: '1px solid #475569', borderRadius: '4px',
      backgroundColor: '#334155', color: 'white', cursor: 'pointer',
    });
    copyButton.textContent = '复制';
    copyButton.onclick = () => {
      navigator.clipboard.writeText(this.getFilteredLogs()).then(() => {
        copyButton.textContent = '已复制!';
        setTimeout(() => (copyButton.textContent = '复制'), 1500);
      });
    };
    header.appendChild(copyButton);

    const filtersContainer = document.createElement('div');
    Object.assign(filtersContainer.style, {
        display: 'flex', gap: '10px', padding: '4px 8px', backgroundColor: '#334155', color: 'white',
    });

    Object.values(LogLevel).forEach(level => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '4px';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.level = level;
        checkbox.checked = this.visibleLevels.has(level);
        checkbox.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                this.visibleLevels.add(level);
            } else {
                this.visibleLevels.delete(level);
            }
            this.updateLogContainer();
        };
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(level));
        filtersContainer.appendChild(label);
    });

    const content = document.createElement('pre');
    Object.assign(content.style, {
      padding: '8px', flex: '1', overflowY: 'auto', whiteSpace: 'pre-wrap',
      wordBreak: 'break-all', color: '#cbd5e1',
    });

    container.appendChild(header);
    container.appendChild(filtersContainer);
    container.appendChild(content);

    this.logContainer = container;
    this.logContent = content;

    const toggleButton = document.createElement('button');
    toggleButton.id = 'game-logger-toggle';
    toggleButton.textContent = '📄';
    Object.assign(toggleButton.style, {
      position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px',
      borderRadius: '50%', backgroundColor: '#334155', border: '1px solid #475569',
      color: 'white', fontSize: '24px', zIndex: '9998', cursor: 'pointer',
    });
    toggleButton.onclick = () => {
      const isHidden = container.style.display === 'none';
      container.style.display = isHidden ? 'flex' : 'none';
      if (isHidden) this.updateLogContainer();
    };

    document.body.appendChild(container);
    document.body.appendChild(toggleButton);
  }
}

export const Log = Logger.getInstance();