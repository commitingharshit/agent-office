import type { CancellationToken } from 'vscode';
import { getTextPart } from '../../../platform/chat/common/globalStringUtils';
import { OptionalChatRequestParams } from '../../../platform/networking/common/fetch';
import { APIUsage, rawMessageToCAPI } from '../../../platform/networking/common/openai';
import { Raw } from '@vscode/prompt-tsx';

type HermesModelsResponse = {
	data?: Array<{ id?: string }>;
	models?: Array<{ id?: string }>;
};

type HermesChatResponse = {
	model?: string;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
	choices?: Array<{
		message?: {
			content?: unknown;
		};
		text?: unknown;
	}>;
	error?: {
		message?: string;
		code?: string;
	};
};

export class HermesGatewayClient {
	private supportedModelsPromise?: Promise<string[]>;

	constructor(
		private readonly baseUrl: string,
		private readonly apiKey: string,
	) {}

	async getSupportedModelIds(token?: CancellationToken): Promise<string[]> {
		if (!this.supportedModelsPromise) {
			this.supportedModelsPromise = this.fetchSupportedModelIds(token).catch(() => []);
		}

		return this.supportedModelsPromise;
	}

	async complete(
		requestedModel: string,
		messages: Raw.ChatMessage[],
		requestOptions: Omit<OptionalChatRequestParams, 'n'> | undefined,
		token: CancellationToken,
	): Promise<{ model: string; text: string; usage?: APIUsage }> {
		const supportedModels = await this.getSupportedModelIds(token);
		const model = supportedModels.includes(requestedModel)
			? requestedModel
			: supportedModels[0] ?? requestedModel;
		const response = await this.postJson<HermesChatResponse>('/chat/completions', {
			...(requestOptions ?? {}),
			model,
			messages: rawMessageToCAPI(messages),
			stream: false,
		}, token);

		if (response.error) {
			throw new Error(response.error.message ?? response.error.code ?? 'Hermes request failed');
		}

		const choice = response.choices?.[0];
		const content = choice?.message?.content ?? choice?.text ?? '';
		const text = getTextPart(content as any);
		return {
			model: response.model ?? model,
			text,
			usage: this.toUsage(response.usage),
		};
	}

	private async fetchSupportedModelIds(token?: CancellationToken): Promise<string[]> {
		const response = await this.getJson<HermesModelsResponse>('/models', token);
		const source = response.data ?? response.models ?? [];
		return source.map(model => model.id).filter((id): id is string => typeof id === 'string' && id.length > 0);
	}

	private async getJson<T>(path: string, token?: CancellationToken): Promise<T> {
		const response = await this.request(path, {
			method: 'GET',
		}, token);
		const text = await response.text();
		try {
			return JSON.parse(text) as T;
		} catch (error) {
			throw new Error(`Hermes gateway returned invalid JSON from ${path}: ${text.slice(0, 200)}`);
		}
	}

	private async postJson<T>(path: string, body: unknown, token?: CancellationToken): Promise<T> {
		const response = await this.request(path, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		}, token);
		const text = await response.text();
		try {
			return JSON.parse(text) as T;
		} catch {
			throw new Error(`Hermes gateway returned invalid JSON from ${path}: ${text.slice(0, 200)}`);
		}
	}

	private async request(
		path: string,
		init: RequestInit,
		token?: CancellationToken,
	): Promise<Response> {
		const controller = new AbortController();
		const dispose = token?.onCancellationRequested(() => controller.abort());
		try {
			const response = await fetch(this.url(path), {
				...init,
				signal: controller.signal,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					...(init.headers ?? {}),
				},
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(text || `Hermes request failed with HTTP ${response.status}`);
			}

			return response;
		} finally {
			dispose?.dispose();
		}
	}

	private url(path: string): string {
		return `${this.baseUrl.replace(/\/$/, '')}${path}`;
	}

	private toUsage(usage: HermesChatResponse['usage']): APIUsage | undefined {
		if (!usage) {
			return undefined;
		}
		return {
			prompt_tokens: usage.prompt_tokens ?? 0,
			completion_tokens: usage.completion_tokens ?? 0,
			total_tokens: usage.total_tokens ?? ((usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)),
		};
	}
}
