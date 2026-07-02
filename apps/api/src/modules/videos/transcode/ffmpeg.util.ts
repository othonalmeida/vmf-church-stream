import { spawn } from "node:child_process";
import { env } from "../../../env.js";

export class FfmpegError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FfmpegError";
  }
}

export async function checkFfmpegAvailable(): Promise<boolean> {
  try {
    await runCommand(env.FFMPEG_PATH, ["-version"], 1);
    return true;
  } catch {
    return false;
  }
}

export function runCommand(command: string, args: string[], timeoutMinutes = env.TRANSCODE_TIMEOUT_MINUTES): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = "";
    let stdout = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMinutes * 60 * 1000);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new FfmpegError(`Failed to start ${command}: ${error.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new FfmpegError(`${command} timed out after ${timeoutMinutes} minutes`));
        return;
      }
      if (code !== 0) {
        reject(new FfmpegError(`${command} exited with code ${code}: ${stderr.slice(-2000)}`));
        return;
      }
      resolve(stdout || stderr);
    });
  });
}

export async function probeDurationSeconds(filePath: string): Promise<number | null> {
  try {
    const output = await runCommand(
      env.FFPROBE_PATH,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath],
      2
    );
    const seconds = parseFloat(output.trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  } catch {
    return null;
  }
}
