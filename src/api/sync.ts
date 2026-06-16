import { http } from './http';
import type { Baby, BabyEvent, GrowthRecord, AppSettings } from '@/types';

export interface SyncBabyDto extends Omit<Baby, 'createdAt'> {
  createdAt: number;
}

export interface SyncEventDto extends BabyEvent {}

export interface SyncGrowthRecordDto extends GrowthRecord {}

export interface SyncSettingsDto {
  feedReminderInterval: number;
  currentBabyId: string | null;
}

export interface ImportPayload {
  babies: SyncBabyDto[];
  events: SyncEventDto[];
  growthRecords: SyncGrowthRecordDto[];
  settings?: SyncSettingsDto;
}

export interface ImportResponse {
  importedBabies: number;
  importedEvents: number;
  importedGrowthRecords: number;
  skippedConflicts: number;
}

export interface ExportResponse {
  babies: Baby[];
  events: BabyEvent[];
  growthRecords: GrowthRecord[];
  settings: AppSettings;
  exportedAt: number;
  userId: string;
}

export const syncApi = {
  importData(payload: ImportPayload): Promise<ImportResponse> {
    return http.post<ImportResponse>('/sync/import', payload);
  },

  exportData(): Promise<ExportResponse> {
    return http.get<ExportResponse>('/sync/export');
  },
};
