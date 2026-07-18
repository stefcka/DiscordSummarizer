// Only responsible for talking to Ollama (via the Rust backend).
import { invoke } from "@tauri-apps/api/core";

export async function summarizeWithOllama(
  ollamaUrl: string,
  model: string,
  prompt: string
): Promise<string> {
  const summary = await invoke<string>("ollama_summarize", {
    ollamaUrl,
    model,
    prompt,
  });

  return summary;
}