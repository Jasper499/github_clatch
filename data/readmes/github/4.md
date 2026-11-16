<p align="center">
  <a href="https://yogurt.so?utm_source=github&utm_medium=readme&utm_campaign=yogurt">
    <img src="docs/assets/readme-header.svg" width="212" height="86" alt="Yogurt. Take note.">
  </a>
</p>

<p align="center">
  Private AI meeting notes. A free, open-source alternative to Granola.
</p>

<p align="center">
  Download for <a href="https://github.com/FrigadeHQ/yogurt/releases/latest/download/Yogurt-mac-arm64.dmg">Mac</a> · <a href="https://github.com/FrigadeHQ/yogurt/releases/latest/download/Yogurt-windows-x64.exe">Windows</a> · <a href="https://github.com/FrigadeHQ/yogurt/releases/latest/download/Yogurt-linux-x86_64.AppImage">Linux</a>
</p>

<p align="center">
  <img src="docs/assets/yogurt-screenshot.webp" width="1074" alt="Yogurt showing the Summary of a launch planning meeting: the plan, next steps by person, and your own reminders">
</p>

<p align="center">
  Yogurt records your calls without adding a bot to the meeting.
</p>
<p></p>
<p align="center">
  <sub>macOS 14.4+ (Apple Silicon) · Windows 10 2004+ (x64) · Ubuntu 22.04+ or similar (x64 AppImage) · 8 GB memory</sub><br><br>
  <a href="https://yogurt.so?utm_source=github&utm_medium=readme&utm_campaign=yogurt">yogurt.so</a> · <a href="docs/README.md">Help</a> · <a href="docs/building.md">Build and run locally</a> · <a href="LICENSE">MIT license</a><br><br>
  Made by <a href="https://frigade.com?utm_source=github&utm_medium=readme&utm_campaign=yogurt">Frigade</a>.
</p>

## What it does

- **Live transcripts.** Yogurt records calls and turns speech into text as you talk.
- **Meeting summaries.** Yogurt writes up the conversation and any notes you add.
- **Private by default.** Your audio, transcripts and AI processing stay on your computer.
- **Free and open source.** You can use Yogurt without an account.
- **Who said what.** Yogurt names speakers from Zoom, Teams and Meet on Mac only.
- **Languages.** Multi-language mode transcribes 99 languages.
- **Recording reminders.** Yogurt offers to record when a supported call starts.
- **Answers with sources.** Yogurt answers questions across meetings and links to the source.
- **Folders and search.** You can find meetings by folder, title, notes or transcript.
- **Copy and export.** You can copy notes or transcripts, or save both as Markdown.
- **Local MCP server.** Your chosen assistant app can read your notes when you allow access.
- **Automatic stop.** Yogurt stops recording when the call ends.

## Watch the demo

https://github.com/user-attachments/assets/da16b894-beb1-491a-89e1-fd10666dc9b8

## How it works

1. **Record.** Start recording your microphone and call audio; you can add your own notes.
2. **Transcribe.** Yogurt uses whisper.cpp and, on supported Macs, Apple SpeechAnalyzer.
3. **Summarize and ask.** A local open-weight model runs through llama.cpp.

Meeting data stays local; Yogurt goes online for model downloads and update checks.

<details><summary>Where your meetings, recordings, settings and models are stored</summary>

- Mac uses `~/Library/Application Support/Yogurt`.
- Windows uses `%APPDATA%\Yogurt`.
- Linux uses `~/.config/Yogurt`, or `$XDG_CONFIG_HOME/Yogurt` if set.

</details>

## FAQ

<details><summary><strong>What kind of computer do I need?</strong></summary>

<br>

> A Mac with Apple silicon and macOS 14.4 or newer, a 64-bit PC with Windows 10 (version 2004) or newer, or a 64-bit Linux computer with Ubuntu 22.04 or newer. Each needs at least 8 GB of memory. If your computer is too slow, Yogurt tells you during setup. Calendar and speaker names from calls are Mac only for now.

</details>

<details><summary><strong>Windows says “Windows protected your PC.” What do I do?</strong></summary>

<br>

> Click More info, then Run anyway. Windows shows this for new apps that aren’t signed with a Microsoft certificate yet. Yogurt is open source, so anyone can check what it does.

</details>

<details><summary><strong>Does Yogurt join my meetings?</strong></summary>

<br>

> No. Yogurt records your microphone and the sound playing on your computer. No bot joins the call, so let the other people on the call know you’re recording.

</details>

<details><summary><strong>Are recordings saved?</strong></summary>

<br>

> Yes. Your recordings, transcripts, and notes are saved locally on your computer.

</details>

<details><summary><strong>Is Yogurt free?</strong></summary>

<br>

> Yes. Yogurt is free and open source under the MIT license. No account is needed.

</details>

<details><summary><strong>Does Yogurt work offline?</strong></summary>

<br>

> Yes. After a one-time download of the AI models, transcription and summaries run locally on your computer.

</details>

<details><summary><strong>How much does setup download?</strong></summary>

<br>

> It depends on your computer. Yogurt downloads a smaller notes model first, about 5 GB, then the best one your computer can run well, which can be 14 GB or more. Recording works once setup finishes, and notes and questions work offline once the notes model is in.

</details>

<details><summary><strong>How do I connect my assistant app?</strong></summary>

<br>

> In **Settings → AI apps**, turn on access, copy the helper command, and add it as a local MCP server in your assistant app. Access is off by default. The app can read your meetings, notes and transcripts, but cannot change them. It may send what it reads to its own online model. Turn access off in Yogurt to stop further reads.

</details>

<details><summary><strong>Can other apps read my notes through MCP?</strong></summary>

<br>

> Access is off until you enable it in **Settings → AI apps**. Apps get read-only access to meetings, notes and transcripts. Mac and Linux use a socket in your profile folder with `0600` permissions, so only your user account can open it. Windows uses a named pipe with a new random name each launch, stored only in your profile folder. There is no per-app token, so any app running under your account can read while access is on. Settings shows connected apps by their self-reported names.

</details>

<details><summary><strong>Which AI models does Yogurt use?</strong></summary>

<br>

> Transcription uses Whisper through whisper.cpp, with large-v3-turbo or a smaller model depending on your computer. On supported Macs, Apple SpeechAnalyzer supplies live words while Whisper produces the saved transcript. Summaries and answers use a local open-weight model from the Gemma 4, gpt-oss or Qwen3 families, chosen for your hardware and run through llama.cpp. The app uses Electron and needs no account.

</details>

<details><summary><strong>Which languages does Yogurt support?</strong></summary>

<br>

> Pick **Multi-language** in **Settings → Language → Spoken language** to transcribe 99 languages. You can also switch from the **English** menu in a note’s footer before or during recording. English only is the default. Summaries follow the meeting’s main language; answers follow your question’s language. Settings also offers 32 app languages.

</details>

<details><summary><strong>Which call apps does Yogurt work with?</strong></summary>

<br>

> You can record calls in any app because Yogurt captures your microphone and system audio. Call detection covers Zoom, Teams and Meet. On Mac, Yogurt can also read their speaker names with Accessibility permission, when the call app shows who is speaking.

</details>

<details><summary><strong>How does Yogurt know a call has started?</strong></summary>

<br>

> It checks which apps are using your microphone. For browser calls, it also checks the tab title or a nearby calendar event with a call link. This triggers an offer to record; recording starts only when you choose to.

</details>

<details><summary><strong>How do I connect my calendar?</strong></summary>

<br>

> On Mac, allow Calendar access in Settings. Yogurt reads the calendars already on your computer and lets you choose which ones to show. You do not sign into a calendar account in Yogurt.

</details>

## Build from source

See [Build and run locally](docs/building.md) for setup, tests and installer builds.

## License

[MIT](LICENSE) · Copyright 2026 Frigade.
