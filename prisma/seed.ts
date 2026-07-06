import 'dotenv/config';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { PrismaClient, ProductStatus, Role, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const scryptAsync = promisify(scrypt);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const password = 'password123';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    tel: '0800000001',
    role: Role.ADMIN,
  },
  {
    name: 'Customer User',
    email: 'customer@example.com',
    tel: '0800000002',
    role: Role.CUSTOMER,
  },
];

const categories = [
  {
    name: 'Electronics',
    description: 'Gadgets, devices, and accessories',
  },
  {
    name: 'Home & Kitchen',
    description: 'Everyday products for home and kitchen',
  },
  {
    name: 'Fashion',
    description: 'Clothing and lifestyle products',
  },
];

const products = [
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with USB receiver',
    price: 590,
    stock: 48,
    categoryName: 'Electronics',
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable speaker with deep bass',
    price: 1290,
    stock: 24,
    categoryName: 'Electronics',
  },
  {
    name: 'Coffee Mug',
    description: 'Ceramic mug for hot and cold drinks',
    price: 220,
    stock: 80,
    categoryName: 'Home & Kitchen',
  },
  {
    name: 'Kitchen Knife Set',
    description: 'Three-piece stainless steel knife set',
    price: 990,
    stock: 18,
    categoryName: 'Home & Kitchen',
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Soft cotton t-shirt for daily wear',
    price: 350,
    stock: 64,
    categoryName: 'Fashion',
  },
];

const orders = [
  {
    status: OrderStatus.PENDING,
    items: [
      { productName: 'Wireless Mouse', quantity: 1 },
      { productName: 'Coffee Mug', quantity: 2 },
    ],
  },
  {
    status: OrderStatus.PAID,
    items: [
      { productName: 'Bluetooth Speaker', quantity: 1 },
      { productName: 'Cotton T-Shirt', quantity: 2 },
    ],
  },
  {
    status: OrderStatus.SHIPPED,
    items: [
      { productName: 'Kitchen Knife Set', quantity: 1 },
      { productName: 'Coffee Mug', quantity: 1 },
    ],
  },
];

async function hashPassword(value: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(value, salt, 64)) as Buffer;

  return `scrypt$${salt}$${hash.toString('hex')}`;
}

function orderSignature(
  status: OrderStatus,
  items: Array<{ productId: number; quantity: number }>,
) {
  const itemSignature = items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|');

  return `${status}:${itemSignature}`;
}

async function main() {
  const [admin, customer] = await Promise.all(
    users.map(async (user) => {
      const passwordHash = await hashPassword(password);
      const existingUser = await prisma.user.findFirst({
        where: { email: user.email, deletedAt: null },
      });

      if (existingUser) {
        return prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: user.name,
            tel: user.tel,
            role: user.role,
            password: passwordHash,
          },
        });
      }

      return prisma.user.create({
        data: {
          ...user,
          password: passwordHash,
        },
      });
    }),
  );

  const categoryRecords = await Promise.all(
    categories.map(async (category) => {
      const existingCategory = await prisma.category.findFirst({
        where: { name: category.name, deletedAt: null },
      });

      if (existingCategory) {
        return prisma.category.update({
          where: { id: existingCategory.id },
          data: category,
        });
      }

      return prisma.category.create({ data: category });
    }),
  );

  const categoriesByName = new Map(
    categoryRecords.map((category) => [category.name, category]),
  );

  const productRecords = await Promise.all(
    products.map(async ({ categoryName, ...product }) => {
      const category = categoriesByName.get(categoryName);

      if (!category) {
        throw new Error(`Category "${categoryName}" was not created`);
      }

      const data = {
        ...product,
        status: ProductStatus.ACTIVE,
        categoryId: category.id,
      };
      const existingProduct = await prisma.product.findFirst({
        where: { name: product.name, deletedAt: null },
      });

      if (existingProduct) {
        return prisma.product.update({
          where: { id: existingProduct.id },
          data,
        });
      }

      return prisma.product.create({ data });
    }),
  );

  const productsByName = new Map(
    productRecords.map((product) => [product.name, product]),
  );
  const existingOrders = await prisma.order.findMany({
    where: { userId: customer.id, deletedAt: null },
    include: { items: true },
    orderBy: { id: 'asc' },
  });
  const usedOrderIds = new Set<number>();

  for (const order of orders) {
    const orderItems = order.items.map((item) => {
      const product = productsByName.get(item.productName);

      if (!product) {
        throw new Error(`Product "${item.productName}" was not created`);
      }

      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity,
      };
    });
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.subtotal,
      0,
    );
    const signature = orderSignature(order.status, orderItems);
    const existingOrder = existingOrders.find(
      (candidate) =>
        !usedOrderIds.has(candidate.id) &&
        orderSignature(candidate.status, candidate.items) === signature,
    );

    if (existingOrder) {
      usedOrderIds.add(existingOrder.id);

      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: existingOrder.id } }),
        prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: order.status,
            totalAmount,
            items: { create: orderItems },
          },
        }),
      ]);

      continue;
    }

    const createdOrder = await prisma.order.create({
      data: {
        userId: customer.id,
        status: order.status,
        totalAmount,
        items: { create: orderItems },
      },
    });

    usedOrderIds.add(createdOrder.id);
  }

  console.log('Seed completed');
  console.log(`Admin: ${admin.email} / ${password}`);
  console.log(`Customer: ${customer.email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
