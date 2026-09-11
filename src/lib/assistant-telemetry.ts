import { OpenTelemetry } from '@ai-sdk/otel';
import { context, ROOT_CONTEXT, SpanStatusCode, trace, type Attributes, type Span, type Tracer } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PostHogTraceExporter } from '@posthog/ai/otel';
import { waitUntil } from '@vercel/functions';
import type { StartAssistantTrace } from '../../packages/starlight-search/src/server/telemetry';
import { createTraceProcessor } from './trace-processor';

interface TraceRuntime {
  tracer: Tracer;
  flush: () => Promise<void>;
  waitUntil: (completion: Promise<void>) => void;
  properties: Attributes;
}

/** Full conversation capture is an explicit site policy; no browser context means no capture. */
export function createAssistantTracing(runtime: TraceRuntime): StartAssistantTrace {
  return (request) => {
    if (!request.analytics) return undefined;
    const attributes: Attributes = {
      ...runtime.properties,
      'posthog.distinct_id': request.analytics.distinctId,
      '$ai_session_id': request.conversationId,
      '$session_id': request.analytics.sessionId,
      conversation_id: request.conversationId,
      attempt_id: request.attemptId,
      page_url: request.pageId,
      locale: request.locale,
      content_version: request.contentVersion,
    };
    // A fresh root prevents the hosting request's trace from joining separate answer attempts.
    const span = runtime.tracer.startSpan('Ask AI', { attributes: {
      ...attributes, 'gen_ai.operation.name': 'invoke_agent',
      '$ai_input_state': JSON.stringify(request.messages),
    } }, ROOT_CONTEXT);
    const active = trace.setSpan(ROOT_CONTEXT, span);
    const generationSpans: Span[] = [];
    const generationTracer: Tracer = {
      startSpan(name, options, parent) {
        const child = runtime.tracer.startSpan(name, options, parent);
        generationSpans.push(child);
        return child;
      },
      startActiveSpan: runtime.tracer.startActiveSpan.bind(runtime.tracer),
    };
    return {
      traceId: span.spanContext().traceId,
      // AI SDK v7 supports per-call integrations; capture stays scoped to Ask AI.
      // https://posthog.com/docs/ai-observability/installation/vercel-ai
      telemetry: { functionId: 'docs-assistant', recordInputs: true, recordOutputs: true,
        integrations: new OpenTelemetry({ tracer: generationTracer, enrichSpan: () => attributes }),
      },
      run: (generate) => context.with(active, generate),
      waitUntil: runtime.waitUntil,
      async finish(outcome) {
        // Some provider error chunks leave an SDK model span open. Once its stream
        // settles, close any remaining spans owned by this attempt before export.
        for (const child of generationSpans.reverse()) {
          if (!child.isRecording()) continue;
          child.setAttribute('outcome', outcome.status);
          if (outcome.status === 'error') child.setStatus({ code: SpanStatusCode.ERROR, message: 'Assistant request failed' });
          child.end();
        }
        span.setAttributes({
          outcome: outcome.status,
          '$ai_output_state': outcome.text,
          ...(outcome.finishReason && { 'gen_ai.response.finish_reasons': [outcome.finishReason] }),
        });
        if (outcome.status === 'error') span.setStatus({ code: SpanStatusCode.ERROR, message: 'Assistant request failed' });
        span.end();
        await runtime.flush();
      },
    };
  };
}

let start: StartAssistantTrace | undefined;

const startTrace: StartAssistantTrace = (request) => {
  if (!request.analytics) return undefined;
  if (!start) {
    const projectToken = process.env.PUBLIC_POSTHOG_PROJECT_TOKEN || import.meta.env?.PUBLIC_POSTHOG_PROJECT_TOKEN;
    const host = process.env.PUBLIC_POSTHOG_HOST || import.meta.env?.PUBLIC_POSTHOG_HOST;
    if (!projectToken || !host) {
      console.error('[assistant-telemetry] PostHog project token or host is missing');
      return undefined;
    }
    const { processor, flush } = createTraceProcessor(new PostHogTraceExporter({ projectToken, host }));
    const sdk = new NodeSDK({
      autoDetectResources: false,
      resource: resourceFromAttributes({ 'service.name': 'promptless.ai' }),
      spanProcessors: [processor],
    });
    sdk.start();
    start = createAssistantTracing({
      tracer: trace.getTracer('promptless.ai.assistant'), flush,
      // Keep the export alive after a streamed response or browser disconnect.
      // https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#waituntil
      waitUntil,
      properties: {
        environment: process.env.VERCEL_ENV || 'development',
        deployment_id: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL,
        release: process.env.VERCEL_GIT_COMMIT_SHA,
      },
    });
  }
  return start(request);
};

export default startTrace;
