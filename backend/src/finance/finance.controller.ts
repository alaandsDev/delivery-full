import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/guards/jwt.guard';

type DailySeriesPoint = {
  date: string;
  grossCents: number;
  deliveredCents: number;
  paidCents: number;
  orders: number;
};

@Controller('finance')
export class FinanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async summary(@CurrentUser() user: JwtPayload, @Query('days') rawDays?: string) {
    const days = this.parseDays(rawDays);

    const store = await this.prisma.store.findUnique({
      where: { ownerId: user.id },
      select: { id: true, name: true, slug: true },
    });
    if (!store) throw new ForbiddenException('Loja nao encontrada para este usuario');

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const [orders, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId: store.id, createdAt: { gte: startDate } },
        select: { id: true, status: true, totalCents: true, createdAt: true },
      }),
      this.prisma.payment.findMany({
        where: { order: { storeId: store.id }, createdAt: { gte: startDate } },
        select: { amountCents: true, status: true, createdAt: true },
      }),
    ]);

    const grossSalesCents = orders
      .filter((o) => o.status !== 'CANCELED')
      .reduce((sum, o) => sum + o.totalCents, 0);

    const deliveredSalesCents = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalCents, 0);

    const canceledSalesCents = orders
      .filter((o) => o.status === 'CANCELED')
      .reduce((sum, o) => sum + o.totalCents, 0);

    const pendingSalesCents = orders
      .filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status))
      .reduce((sum, o) => sum + o.totalCents, 0);

    const paidSalesCents = payments
      .filter((p) => ['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED'].includes((p.status ?? '').toUpperCase()))
      .reduce((sum, p) => sum + p.amountCents, 0);

    const ordersCount = orders.length;
    const deliveredOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const canceledOrdersCount = orders.filter((o) => o.status === 'CANCELED').length;
    const averageTicketCents = ordersCount > 0 ? Math.round(grossSalesCents / ordersCount) : 0;

    const dailySeries = this.buildDailySeries(startDate, days, orders, payments);

    return {
      periodDays: days,
      store,
      summary: {
        grossSalesCents,
        deliveredSalesCents,
        paidSalesCents,
        pendingSalesCents,
        canceledSalesCents,
        ordersCount,
        deliveredOrdersCount,
        canceledOrdersCount,
        averageTicketCents,
      },
      dailySeries,
    };
  }

  private parseDays(rawDays?: string): number {
    const n = Number(rawDays ?? 30);
    if (!Number.isFinite(n)) return 30;
    if (n <= 7) return 7;
    if (n <= 30) return 30;
    if (n <= 90) return 90;
    return 180;
  }

  private buildDailySeries(
    startDate: Date,
    days: number,
    orders: Array<{ status: string; totalCents: number; createdAt: Date }>,
    payments: Array<{ amountCents: number; status: string; createdAt: Date }>,
  ): DailySeriesPoint[] {
    const map = new Map<string, DailySeriesPoint>();

    for (let i = 0; i < days; i += 1) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = this.dayKey(d);
      map.set(key, { date: key, grossCents: 0, deliveredCents: 0, paidCents: 0, orders: 0 });
    }

    for (const order of orders) {
      const key = this.dayKey(order.createdAt);
      const point = map.get(key);
      if (!point) continue;
      point.orders += 1;
      if (order.status !== 'CANCELED') point.grossCents += order.totalCents;
      if (order.status === 'DELIVERED') point.deliveredCents += order.totalCents;
    }

    for (const payment of payments) {
      const key = this.dayKey(payment.createdAt);
      const point = map.get(key);
      if (!point) continue;
      if (['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED'].includes((payment.status ?? '').toUpperCase())) {
        point.paidCents += payment.amountCents;
      }
    }

    return Array.from(map.values());
  }

  private dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

