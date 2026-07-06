import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type DateRangeQuery = {
  startDate?: string;
  endDate?: string;
};

export function getBangkokDateRangeWhere(
  query: DateRangeQuery,
): Pick<Prisma.OrderWhereInput, 'createdAt'> {
  if (!query.startDate && !query.endDate) {
    return {};
  }

  const createdAt: Prisma.DateTimeFilter = {};

  if (query.startDate) {
    createdAt.gte = getBangkokDateBoundary(query.startDate, 'startDate');
  }

  if (query.endDate) {
    createdAt.lte = getBangkokDateBoundary(query.endDate, 'endDate');
  }

  if (
    createdAt.gte instanceof Date &&
    createdAt.lte instanceof Date &&
    createdAt.gte > createdAt.lte
  ) {
    throw new BadRequestException('startDate must not be later than endDate');
  }

  return { createdAt };
}

function getBangkokDateBoundary(
  value: string,
  boundary: 'startDate' | 'endDate',
) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new BadRequestException(`${boundary} must be in YYYY-MM-DD format`);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new BadRequestException(`${boundary} must be a valid date`);
  }

  const time = boundary === 'startDate' ? '00:00:00.000' : '23:59:59.999';

  return new Date(`${value}T${time}+07:00`);
}
