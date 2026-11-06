import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../../types/api';

export const extractApiErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiResponse>;
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    if (axiosErr.response?.data?.error && Array.isArray(axiosErr.response.data.error)) {
      return axiosErr.response.data.error[0]?.message || fallbackMessage;
    }
    if (axiosErr.message === 'Network Error') {
      return 'Unable to connect to UYIRA health servers. Please check your network connection.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

