/** Types for the build-time-inlined index + runtime config virtual module. */
declare module 'virtual:starlight-mcp' {
  import type { RuntimeConfig } from './integration';
  import type { DocEntry } from './core/index/types';
  const data: { index: DocEntry[]; config: RuntimeConfig };
  export default data;
}
