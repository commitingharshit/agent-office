/**
 * ParaIdAllocator — assigns a stable `w14:paraId` to every paragraph.
 *
 * Why: the agent toolkit anchors comments, tracked changes, and
 * formatting by `paraId`. A paragraph with `paraId: null` is invisible
 * to the agent; a duplicated paraId (the second half of an Enter-split
 * or a paste) silently desyncs the agent's anchors.
 */
import { PluginKey } from 'prosemirror-state';
export declare const paraIdAllocatorKey: PluginKey<any>;
export declare const ParaIdAllocatorExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").Extension;
//# sourceMappingURL=ParaIdAllocatorExtension.d.ts.map