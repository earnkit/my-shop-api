export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function getPagination(query: { page?: number; limit?: number }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function toPaginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number },
  total: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
