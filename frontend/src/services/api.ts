import axios from 'axios';
import type { ApiEnvelope } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    const message =
      data?.message ?? (error.code === 'ECONNABORTED' ? 'Tempo de resposta excedido.' : null) ?? 'Erro de conexão com o servidor.';
    return Promise.reject(new Error(message));
  },
);

export async function getData<T>(url: string, params?: unknown): Promise<T> {
  const response = await api.get<ApiEnvelope<T>>(url, { params });
  return response.data.data;
}

export async function postData<T>(url: string, body: unknown): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export async function patchData<T>(url: string, body: unknown): Promise<T> {
  const response = await api.patch<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export async function putData<T>(url: string, body: unknown): Promise<T> {
  const response = await api.put<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export async function deleteData<T>(url: string): Promise<T> {
  const response = await api.delete<ApiEnvelope<T>>(url);
  return response.data.data as T;
}

export async function getCsv(url: string, params?: unknown, filename?: string): Promise<void> {
  const response = await api.get(url, { params, responseType: 'blob' });
  downloadBlob(response.data as Blob, filename ?? 'export.csv');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
