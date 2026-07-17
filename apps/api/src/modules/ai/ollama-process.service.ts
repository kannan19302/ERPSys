import { Injectable, Logger } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { AiService } from './ai.service';

const execAsync = promisify(exec);

export interface OllamaStatus {
  running: boolean;
  version?: string;
  baseUrl: string;
  model: string;
}

export interface OllamaStartResult {
  started: boolean;
  status?: OllamaStatus;
  error?: string;
}

export interface OllamaStopResult {
  stopped: boolean;
  status: OllamaStatus;
}

/**
 * Controls the local Ollama process from the Admin Control Center. This only works
 * when the API process runs on the same host as Ollama — the accepted model for
 * UniERP's self-hosted, single-instance dev/deploy setup. In a multi-host deployment
 * this would be a no-op against the wrong machine; that's a known, accepted limitation,
 * not a bug.
 */
@Injectable()
export class OllamaProcessService {
  private readonly logger = new Logger(OllamaProcessService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Probes Ollama's /api/version endpoint with a short timeout. Never throws —
   * this is a status check, and any failure (network error, timeout, non-OK
   * response) simply means Ollama is not reachable/running.
   */
  async getStatus(): Promise<OllamaStatus> {
    const baseUrl = this.aiService.getBaseUrl();
    const model = this.aiService.getDefaultModel();

    try {
      const response = await fetch(`${baseUrl}/api/version`, {
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        return { running: false, baseUrl, model };
      }

      const json: unknown = await response.json().catch(() => null);
      const version =
        json && typeof json === 'object' && typeof (json as Record<string, unknown>).version === 'string'
          ? ((json as Record<string, unknown>).version as string)
          : undefined;

      return { running: true, version, baseUrl, model };
    } catch {
      return { running: false, baseUrl, model };
    }
  }

  /**
   * Spawns `ollama serve` detached from the API process, then polls status a
   * few times to see if it comes up. Caps total wait around 5-6 seconds so the
   * HTTP endpoint calling this doesn't hang indefinitely.
   */
  async start(): Promise<OllamaStartResult> {
    try {
      const child = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to spawn ollama serve: ${message}`);
      return { started: false, error: message };
    }

    let status: OllamaStatus = await this.getStatus();
    for (let attempt = 0; attempt < 5 && !status.running; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await this.getStatus();
    }

    return { started: status.running, status };
  }

  /**
   * Kills the local Ollama process. Commands are fixed and hardcoded with zero
   * interpolated parameters — no injection surface. A non-zero exit code from
   * taskkill/pkill when there's no matching process is treated as "already
   * stopped", not a failure.
   *
   * On Windows, the installed app runs two separate images: `ollama app.exe`
   * (a tray supervisor that auto-relaunches the server) and `ollama.exe` (the
   * `serve` worker itself). Killing only `ollama.exe` is not enough — the
   * supervisor respawns it within seconds. Both must be killed, supervisor
   * first, so it doesn't immediately restart the worker we just killed.
   */
  async stop(): Promise<OllamaStopResult> {
    if (process.platform === 'win32') {
      await this.tryExec('taskkill /IM "ollama app.exe" /F /T');
      await this.tryExec('taskkill /IM ollama.exe /F /T');
    } else {
      const killedByPattern = await this.tryExec('pkill -f "ollama serve"');
      if (!killedByPattern) {
        await this.tryExec('pkill ollama');
      }
    }

    const status = await this.getStatus();
    return { stopped: !status.running, status };
  }

  /** Runs a fixed, parameter-less shell command; swallows "no matching process" failures. */
  private async tryExec(command: string): Promise<boolean> {
    try {
      await execAsync(command);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Command reported no running process ("${command}"): ${message}`);
      return false;
    }
  }
}
