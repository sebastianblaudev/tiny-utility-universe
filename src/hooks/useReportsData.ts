
import { useQuery } from "@tanstack/react-query";
import { openDB } from "idb";
import { Order, Customer, Product } from "@/lib/db";
import { DB_NAME } from "@/lib/query-client";

export const useReportsData = () => {
  const fetchOrders = async () => {
    try {
      const db = await openDB(DB_NAME, 8);
      const orders = await db.getAll('orders');
      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error; // Re-throw to let react-query handle the error
    }
  };

  return useQuery({
    queryKey: ['reports-data'],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCustomersData = () => {
  const fetchCustomers = async () => {
    try {
      const db = await openDB(DB_NAME, 8);
      const customers = await db.getAll('customers');
      return customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ['customers-data'],
    queryFn: fetchCustomers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProductsData = () => {
  const fetchProducts = async () => {
    try {
      const db = await openDB(DB_NAME, 8);
      const products = await db.getAll('products');
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  };

  const query = useQuery({
    queryKey: ['products-data'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    refresh: () => query.refetch()
  };
};

export const calculateDailyStats = (orders: Order[]) => {
  const today = new Date();
  const dailyStats = new Array(7).fill(0).map((_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - i);
    return {
      name: new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date),
      total: 0,
      date: date
    };
  }).reverse();

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const dayDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff >= 0 && dayDiff < 7) {
      const dayIndex = 6 - dayDiff;
      dailyStats[dayIndex].total += order.total;
    }
  });

  return dailyStats.map(({ name, total }) => ({ name, total }));
};

export const calculateMonthlyRevenue = (orders: Order[]) => {
  const today = new Date();
  const monthlyData = new Array(6).fill(0).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      name: new Intl.DateTimeFormat('es', { month: 'short' }).format(date),
      revenue: 0,
    };
  }).reverse();

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const monthIndex = 5 - (new Date().getMonth() - orderDate.getMonth());
    if (monthIndex >= 0 && monthIndex < 6) {
      monthlyData[monthIndex].revenue += order.total;
    }
  });

  return monthlyData;
};

export const calculateOverviewStats = (orders: Order[]) => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);

  const currentMonthOrders = orders.filter(order => 
    new Date(order.createdAt) >= new Date(today.getFullYear(), today.getMonth())
  );

  const lastMonthOrders = orders.filter(order => 
    new Date(order.createdAt) >= lastMonth && 
    new Date(order.createdAt) < new Date(today.getFullYear(), today.getMonth())
  );

  const totalSales = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
  const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
  const salesGrowth = lastMonthSales ? ((totalSales - lastMonthSales) / lastMonthSales) * 100 : 0;

  const totalOrders = currentMonthOrders.length;
  const lastMonthTotalOrders = lastMonthOrders.length;
  const ordersGrowth = lastMonthTotalOrders ? 
    ((totalOrders - lastMonthTotalOrders) / lastMonthTotalOrders) * 100 : 0;

  const uniqueCustomers = new Set(currentMonthOrders.map(o => o.customerId)).size;
  const lastMonthCustomers = new Set(lastMonthOrders.map(o => o.customerId)).size;
  const customersGrowth = lastMonthCustomers ? 
    ((uniqueCustomers - lastMonthCustomers) / lastMonthCustomers) * 100 : 0;

  const averageTicket = totalOrders ? totalSales / totalOrders : 0;
  const lastMonthTicket = lastMonthTotalOrders ? 
    lastMonthSales / lastMonthTotalOrders : 0;
  const ticketGrowth = lastMonthTicket ? 
    ((averageTicket - lastMonthTicket) / lastMonthTicket) * 100 : 0;

  return {
    totalSales,
    salesGrowth,
    totalOrders,
    ordersGrowth,
    uniqueCustomers,
    customersGrowth,
    averageTicket,
    ticketGrowth,
  };
};

export const calculateTopProducts = (orders: Order[], products: Product[]) => {
  const productStats = new Map();
  
  orders.forEach(order => {
    order.items.forEach(item => {
      // Use item.id as fallback if productId is not available
      const productId = item.productId || item.id;
      
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          id: productId,
          name: item.name,
          sales: 0,
          revenue: 0
        });
      }
      
      const stats = productStats.get(productId);
      stats.sales += item.quantity;
      stats.revenue += item.price * item.quantity;
      productStats.set(productId, stats);
    });
  });
  
  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(product => ({
      ...product,
      profit: product.revenue * 0.3
    }));
  
  return topProducts;
};

export const calculateTopCustomers = (orders: Order[], customers: Customer[]) => {
  const customerMap = new Map();
  customers.forEach(customer => {
    customerMap.set(customer.id, customer);
  });
  
  const customerStats = new Map();
  
  orders.forEach(order => {
    if (!order.customerId) return;
    
    if (!customerStats.has(order.customerId)) {
      const customer = customerMap.get(order.customerId);
      customerStats.set(order.customerId, {
        id: order.customerId,
        name: customer?.name || 'Cliente Desconocido',
        orders: 0,
        spent: 0,
        lastOrder: new Date(0)
      });
    }
    
    const stats = customerStats.get(order.customerId);
    stats.orders++;
    stats.spent += order.total;
    
    const orderDate = new Date(order.createdAt);
    if (orderDate > stats.lastOrder) {
      stats.lastOrder = orderDate;
    }
    
    customerStats.set(order.customerId, stats);
  });
  
  const topCustomers = Array.from(customerStats.values())
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map(customer => ({
      ...customer,
      lastOrder: customer.lastOrder.toISOString().slice(0, 10)
    }));
  
  return topCustomers;
};

export const calculateTodayPaymentsByMethod = (orders: Order[]) => {
  const today = new Date();
  const isToday = (dateValue: any) => {
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const summary: Record<string, number> = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    otros: 0
  };

  orders.forEach(order => {
    if (isToday(order.createdAt)) {
      if (Array.isArray(order.paymentSplits) && order.paymentSplits.length > 0) {
        order.paymentSplits.forEach((split: any) => {
          const method = (split.method || '').toLowerCase();
          if (summary.hasOwnProperty(method)) {
            summary[method] += split.amount ?? 0;
          } else {
            summary.otros += split.amount ?? 0;
          }
        });
      } else {
        const method = (order.paymentMethod || '').toLowerCase();
        if (summary.hasOwnProperty(method)) {
          summary[method] += order.total ?? 0;
        } else {
          summary.otros += order.total ?? 0;
        }
      }
    }
  });

  Object.keys(summary).forEach(k => { summary[k] = Math.round(summary[k] * 100) / 100 });

  return summary;
};

export const calculateProductsSold = (orders) => {
  const productSoldData = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      // Use item.id as fallback if productId is not available
      const productId = item.productId || item.id;
      
      if (!productSoldData[productId]) {
        productSoldData[productId] = {
          id: productId,
          name: item.name,
          quantity: 0,
          total: 0
        };
      }
      
      productSoldData[productId].quantity += item.quantity;
      productSoldData[productId].total += item.price * item.quantity;
    });
  });
  
  return Object.values(productSoldData);
};

export const calculatePaymentMethods = (orders) => {
  const paymentData = {
    efectivo: 0,
    tarjeta: 0, 
    transferencia: 0
  };
  
  orders.forEach(order => {
    if (order.paymentSplits && order.paymentSplits.length > 0) {
      // If there are payment splits, add each one to the appropriate method
      order.paymentSplits.forEach(split => {
        paymentData[split.method] += split.amount;
      });
    } else if (order.paymentMethod) {
      // Otherwise use the order's payment method
      paymentData[order.paymentMethod] += order.total;
    }
  });
  
  return paymentData;
};
