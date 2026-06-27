import { spawn } from 'child_process';
import * as vscode from 'vscode';
import type { HermesUiMessage } from './types';

type HermesChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequestLike = {
  prompt: string;
  command?: string;
};

type ChatResponseStreamLike = {
  progress(message: string): void;
  markdown(content: string): void;
};

type ChatParticipantLike = vscode.Disposable & {
  iconPath?: vscode.ThemeIcon;
  followupProvider?: {
    provideFollowups(
      result: unknown,
      context: unknown,
      token: vscode.CancellationToken
    ): Array<{ prompt: string; label: string; command?: string }>;
  };
};

const HISTORY_KEY = 'docxEditor.hermes.chatHistory';
const MAX_HISTORY_TURNS = 8;
const MAX_PROMPT_CHARS = 12_000;

function readHistory(context: vscode.ExtensionContext): HermesChatTurn[] {
  const stored = context.workspaceState.get<HermesChatTurn[]>(HISTORY_KEY);
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .filter(
      (turn): turn is HermesChatTurn =>
        !!turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string'
    )
    .slice(-MAX_HISTORY_TURNS * 2);
}

async function writeHistory(context: vscode.ExtensionContext, history: HermesChatTurn[]): Promise<void> {
  await context.workspaceState.update(HISTORY_KEY, history.slice(-MAX_HISTORY_TURNS * 2));
}

async function clearHistory(context: vscode.ExtensionContext): Promise<void> {
  await context.workspaceState.update(HISTORY_KEY, []);
}

function buildPrompt(userPrompt: string, history: HermesChatTurn[]): string {
  const transcript = history
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((turn) => `${turn.role === 'user' ? 'User' : 'Hermes'}: ${turn.content.trim()}`)
    .join('\n');

  const sections = [
    'You are Hermes, a strategic operator-intelligence assistant running in VS Code.',
    'Answer the user directly and concisely unless they ask for more detail.',
    'If the user asks about the current document or workspace, respond with practical help.',
    transcript ? `Conversation so far:\n${transcript}` : '',
    `User: ${userPrompt.trim()}`,
    'Hermes:',
  ].filter(Boolean);

  const prompt = sections.join('\n\n');
  return prompt.length > MAX_PROMPT_CHARS ? prompt.slice(prompt.length - MAX_PROMPT_CHARS) : prompt;
}

function runHermesCli(
  command: string,
  prompt: string,
  stream: ChatResponseStreamLike,
  notifyUi: ((message: HermesUiMessage) => void) | undefined,
  token: vscode.CancellationToken
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['chat', '-q', prompt, '-Q', '--source', 'vscode-ext'], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let emittedFirstChunk = false;
    let settled = false;

    const finish = (error?: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    };

    const cancelListener = token.onCancellationRequested(() => {
      child.kill();
      notifyUi?.({
        type: 'hermesUi',
        phase: 'idle',
        message: 'Hermes request cancelled.',
      });
      finish(new Error('Hermes chat request was cancelled.'));
    });

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      stdout += text;
      if (!emittedFirstChunk) {
        emittedFirstChunk = true;
        notifyUi?.({
          type: 'hermesUi',
          phase: 'streaming',
          message: 'Hermes is responding…',
        });
      }
      notifyUi?.({
        type: 'hermesUi',
        phase: 'streaming',
        message: 'Hermes is responding…',
        transcript: stdout.trim(),
      });
      stream.markdown(text);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      cancelListener.dispose();
      if (error.code === 'ENOENT') {
        notifyUi?.({
          type: 'hermesUi',
          phase: 'error',
          message: `Could not find the Hermes CLI command "${command}".`,
        });
        finish(
          new Error(
            `Could not find the Hermes CLI command "${command}". Set docxEditor.hermes.command to the full path if it is not on PATH.`
          )
        );
        return;
      }
      finish(error);
    });

    child.on('close', (code) => {
      cancelListener.dispose();
      if (code === 0) {
        notifyUi?.({
          type: 'hermesUi',
          phase: 'done',
          message: 'Hermes finished responding.',
          transcript: stdout.trim(),
        });
        finish();
        return;
      }

      const message = stderr.trim() || stdout.trim() || `Hermes exited with code ${code}.`;
      notifyUi?.({
        type: 'hermesUi',
        phase: 'error',
        message,
        transcript: stdout.trim(),
      });
      finish(new Error(message));
    });
  });
}

export function registerHermesChatParticipant(
  context: vscode.ExtensionContext,
  notifyUi?: (message: HermesUiMessage) => void
): void {
  const chatApi = (vscode as unknown as { chat?: { createChatParticipant?: Function } }).chat;
  if (!chatApi?.createChatParticipant) {
    return;
  }

  const handler = async (
    request: ChatRequestLike,
    _chatContext: unknown,
    stream: ChatResponseStreamLike,
    token: vscode.CancellationToken
  ) => {
    const configuration = vscode.workspace.getConfiguration('docxEditor.hermes');
    const command = configuration.get<string>('command', process.env.HERMES_CLI_PATH || 'hermes');
    const history = readHistory(context);
    const slashCommand = (request.command ?? '').trim();

    if (slashCommand === 'reset') {
      await clearHistory(context);
      notifyUi?.({
        type: 'hermesUi',
        phase: 'idle',
        message: 'Hermes chat history cleared.',
      });
      stream.markdown('Hermes chat history cleared.');
      return { metadata: { command: 'reset' } };
    }

    if (slashCommand === 'help' || slashCommand === 'commands') {
      const commandList = [
        '/reset — clear Hermes chat history',
        '/help — show this help',
        '/commands — browse available commands',
        '/model — change or inspect the current model',
        '/tools — manage tools',
        '/skills — search or install skills',
        '/cron — manage cron jobs',
        '/restart — restart the gateway',
      ].join('\n');
      notifyUi?.({
        type: 'hermesUi',
        phase: 'done',
        message: 'Hermes command help ready.',
        transcript: commandList,
      });
      stream.markdown(`### Hermes commands\n\n${commandList}`);
      return { metadata: { command: slashCommand } };
    }

    stream.progress('Asking Hermes…');
    notifyUi?.({
      type: 'hermesUi',
      phase: 'thinking',
      message: 'Hermes is thinking…',
    });

    const promptText = slashCommand ? `/${slashCommand}${request.prompt ? ` ${request.prompt}` : ''}` : request.prompt || '';
    const prompt = buildPrompt(promptText, history);
    const reply = await runHermesCli(command, prompt, stream, notifyUi, token);
    notifyUi?.({
      type: 'hermesUi',
      phase: 'done',
      message: 'Hermes finished.',
      transcript: reply,
    });

    const nextHistory: HermesChatTurn[] = [
      ...history,
      { role: 'user', content: request.prompt },
      { role: 'assistant', content: reply },
    ];
    await writeHistory(context, nextHistory);

    return {
      metadata: {
        command: request.command ?? 'chat',
        historyTurns: Math.min(nextHistory.length / 2, MAX_HISTORY_TURNS),
      },
    };
  };

  const participant = chatApi.createChatParticipant('docx-editor.hermes', handler) as ChatParticipantLike;
  participant.iconPath = new vscode.ThemeIcon('sparkle');
  participant.followupProvider = {
    provideFollowups(_result, _context, _token) {
      return [
        {
          prompt: '/reset',
          label: 'Clear Hermes chat history',
          command: 'reset',
        },
        {
          prompt: '/help',
          label: 'Show Hermes command help',
          command: 'help',
        },
        {
          prompt: '/commands',
          label: 'Browse all Hermes commands',
          command: 'commands',
        },
      ];
    },
  };

  context.subscriptions.push(participant);
}
