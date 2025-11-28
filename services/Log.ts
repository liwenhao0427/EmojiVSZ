
class Logger {
  private static instance: Logger;
  private logs: string[] = [];
  private logContainer: HTMLDivElement | null = null;
  private logContent: HTMLPreElement | null = null;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public i(source: string, message: string) {
    const timestamp = performance.now().toFixed(2).padStart(8, '0');
    const logMessage = `[${timestamp}ms] [${source.padEnd(15, ' ')}] ${message}`;
    this.logs.push(logMessage);
    console.log(logMessage); // Also log to console for developers
    this.updateLogContainer();
  }

  public getLogs(): string {
    return this.logs.join('\n');
  }

  private updateLogContainer() {
    if (this.logContent) {
      this.logContent.textContent = this.getLogs();
      this.logContainer?.scrollTo(0, this.logContainer.scrollHeight);
    }
  }
  
  public displayLogsUI() {
    if (document.getElementById('game-logger-container')) return;

    const container = document.createElement('div');
    container.id = 'game-logger-container';
    container.style.position = 'fixed';
    container.style.bottom = '80px';
    container.style.right = '20px';
    container.style.width = '500px';
    container.style.height = '300px';
    container.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    container.style.border = '1px solid #334155';
    container.style.borderRadius = '8px';
    container.style.zIndex = '9999';
    container.style.display = 'none';
    container.style.flexDirection = 'column';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    
    const header = document.createElement('div');
    header.style.padding = '8px';
    header.style.backgroundColor = '#1e293b';
    header.style.color = 'white';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.textContent = '游戏事件日志';

    const copyButton = document.createElement('button');
    copyButton.textContent = '复制';
    copyButton.style.padding = '4px 8px';
    copyButton.style.border = '1px solid #475569';
    copyButton.style.borderRadius = '4px';
    copyButton.style.backgroundColor = '#334155';
    copyButton.style.color = 'white';
    copyButton.style.cursor = 'pointer';
    copyButton.onclick = () => {
        navigator.clipboard.writeText(this.getLogs()).then(() => {
            copyButton.textContent = '已复制!';
            setTimeout(() => (copyButton.textContent = '复制'), 1500);
        });
    };
    
    header.appendChild(copyButton);

    const content = document.createElement('pre');
    content.style.padding = '8px';
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    content.style.whiteSpace = 'pre-wrap';
    content.style.wordBreak = 'break-all';
    content.style.color = '#cbd5e1';
    
    container.appendChild(header);
    container.appendChild(content);
    
    this.logContainer = container;
    this.logContent = content;

    const toggleButton = document.createElement('button');
    toggleButton.id = 'game-logger-toggle';
    toggleButton.textContent = '📄';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '20px';
    toggleButton.style.right = '20px';
    toggleButton.style.width = '50px';
    toggleButton.style.height = '50px';
    toggleButton.style.borderRadius = '50%';
    toggleButton.style.backgroundColor = '#334155';
    toggleButton.style.border = '1px solid #475569';
    toggleButton.style.color = 'white';
    toggleButton.style.fontSize = '24px';
    toggleButton.style.zIndex = '9998';
    toggleButton.style.cursor = 'pointer';
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
