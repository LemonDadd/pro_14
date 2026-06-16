export type { StorageAdapter, FullSnapshot } from './types';
export { LocalStorageAdapter } from './local.adapter';
export { ApiStorageAdapter } from './api.adapter';
export { HybridStorageAdapter } from './hybrid.adapter';
export type { WriteMode, ReadMode } from './hybrid.adapter';

import { HybridStorageAdapter } from './hybrid.adapter';

export const storage = new HybridStorageAdapter();

export default storage;
