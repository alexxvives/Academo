export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: string, status = 400): Response {
  return Response.json(
    {
      success: false,
      error,
    } as ApiResponse,
    { status }
  );
}

export async function handleApiError(error: unknown): Promise<Response> {
  console.error('API Error:', error);

  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'Forbidden') {
      return errorResponse('Forbidden', 403);
    }
    return errorResponse(error.message, 400);
  }

  return errorResponse('Internal server error', 500);
}
