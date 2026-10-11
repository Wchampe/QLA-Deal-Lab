# Ollama models for QLA Deal Lab

Run `Start.cmd` and open http://127.0.0.1:8765. The launcher starts Ollama in the background if it is stopped, then starts the workbench.

On Windows, Ollama gets a hidden console shared by its GPU probes and model helpers. This prevents the flashing terminal windows produced by starting Ollama as a detached, console-less process. The workbench itself keeps one terminal open. Logs go to `private/ollama-stdout.log` and `private/ollama-stderr.log` and are replaced at each new Ollama start. An existing service is reused and retains its original console settings until restarted.

On this computer the installed model store is `E:\ollama-models`. The launcher uses that folder when it exists unless `OLLAMA_MODELS` already specifies a folder. Models are read through the local Ollama API at `http://127.0.0.1:11434`; they do not need to be copied into the project.

Use **Local AI model** in **06 Agent workspace**, **10 Data & setup**, or **12 Off-market intelligence**:

- **qwen38-local:latest**: default for document analysis. This 27B model uses both system memory and the 12 GB GPU, so its initial load can be slow.
- **deepseek-r1:14b**: reasoning alternative. The app allows extra tokens for its reasoning before the final answer.

The app uses one selected model for each analysis. Other installed models remain available under **Change model**. **Refresh models** reloads the current installed list and connection status. A reachable workbench alone no longer reports AI as ready.

The selection is saved in `private/ollama.json` and applies to new specialist-agent runs and filing analyses. An explicit `QLA_MODEL` environment variable overrides that preference at server startup. Changing the selection in the interface takes effect immediately, without a restart.

If Ollama shows no models, stop it and launch `Start.cmd` with `OLLAMA_MODELS=E:\ollama-models`, then select **Refresh models**. An already-running Ollama service retains the model directory it was started with.

The Qwen and Dolphin Modelfiles in this folder are existing local GGUF definitions from `C:\Users\Willi\AI - Model`. They are only needed to recreate those aliases; no new model download is required for the installed models.
