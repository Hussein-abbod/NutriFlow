import { AI_REQUEST_TIMEOUT_MS, apiClient } from '@/lib/api';
import type {
  BarcodeRequestDto,
  DayLogsDto,
  FoodItemResultDto,
  FoodLogDto,
  FoodSubmitRequestDto,
  ImageRequestDto,
  TextSearchRequestDto,
} from '@/types/api';

/**
 * services/food_log_service.dart. Day logs always use `/history?log_date=` with the
 * client's own calendar day (like Flutter): `/today` uses the server's date, which can be
 * a different day than the user's.
 */
export const foodLogApi = {
  day: (isoDay: string, signal?: AbortSignal) =>
    apiClient.get<DayLogsDto>(`/food-log/history?log_date=${encodeURIComponent(isoDay)}`, {
      signal,
    }),

  searchText: (body: TextSearchRequestDto) =>
    apiClient.post<FoodItemResultDto[]>('/food-log/text', body, {
      timeoutMs: body.use_ai_parse ? AI_REQUEST_TIMEOUT_MS : undefined,
    }),

  lookupBarcode: (body: BarcodeRequestDto) =>
    apiClient.post<FoodItemResultDto>('/food-log/barcode', body),

  identifyImage: (body: ImageRequestDto) =>
    apiClient.post<FoodItemResultDto[]>('/food-log/image', body, {
      timeoutMs: AI_REQUEST_TIMEOUT_MS,
    }),

  submit: (body: FoodSubmitRequestDto) =>
    apiClient.post<FoodLogDto>('/food-log/submit', body, { timeoutMs: AI_REQUEST_TIMEOUT_MS }),

  deleteItem: (itemId: number) => apiClient.delete<undefined>(`/food-log/item/${itemId}`),
};
