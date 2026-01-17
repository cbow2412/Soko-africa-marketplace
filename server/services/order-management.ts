import { getDb } from "../db";
import { orders, products, sellers, sellerNotifications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Order Management Service
 * 
 * Handles order creation, tracking, and notifications
 */

export interface OrderData {
  userId: number;
  productId: number;
  sellerId: number;
  quantity: number;
  totalPrice: number;
  buyerPhone?: string;
  buyerName?: string;
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: number;
  message: string;
  error?: string;
}

export type OrderStatus = "initiated" | "confirmed" | "shipped" | "delivered" | "cancelled";

export class OrderManagement {
  /**
   * Create new order
   */
  static async createOrder(data: OrderData): Promise<OrderResult> {
    try {
      console.log("[OrderManagement] Creating order for product:", data.productId);

      // Validate data
      if (!data.userId || !data.productId || !data.sellerId || !data.quantity) {
        return {
          success: false,
          message: "Missing required order data",
          error: "INVALID_ORDER_DATA",
        };
      }

      if (data.quantity < 1) {
        return {
          success: false,
          message: "Quantity must be at least 1",
          error: "INVALID_QUANTITY",
        };
      }

      // Get database connection
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Verify product exists and is available
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, data.productId))
        .limit(1);

      if (!product.length) {
        return {
          success: false,
          message: "Product not found",
          error: "PRODUCT_NOT_FOUND",
        };
      }

      // Create order record
      const insertResult = await db.insert(orders).values({
        userId: data.userId,
        productId: data.productId,
        sellerId: data.sellerId,
        quantity: data.quantity,
        totalPrice: data.totalPrice.toString(),
        status: "initiated",
        buyerPhone: data.buyerPhone || null,
        buyerName: data.buyerName || null,
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const orderId = (insertResult as any).insertId;

      console.log("[OrderManagement] Order created:", orderId);

      // Send notification to seller
      await this.notifySeller(
        data.sellerId,
        "new_order",
        `New order received! Product: ${product[0].title}, Quantity: ${data.quantity}`
      );

      return {
        success: true,
        orderId,
        message: "Order created successfully",
      };
    } catch (error) {
      console.error("[OrderManagement] Create order failed:", error);

      return {
        success: false,
        message: "Order creation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: number): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      return order[0] || null;
    } catch (error) {
      console.error("[OrderManagement] Get order failed:", error);
      throw error;
    }
  }

  /**
   * Get orders by user ID
   */
  static async getOrdersByUser(userId: number): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId));

      return userOrders;
    } catch (error) {
      console.error("[OrderManagement] Get user orders failed:", error);
      throw error;
    }
  }

  /**
   * Get orders by seller ID
   */
  static async getOrdersBySeller(sellerId: number): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sellerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.sellerId, sellerId));

      return sellerOrders;
    } catch (error) {
      console.error("[OrderManagement] Get seller orders failed:", error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: number,
    status: OrderStatus
  ): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get order to notify seller
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Update order
      await db
        .update(orders)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`[OrderManagement] Order ${orderId} status updated to ${status}`);

      // Notify seller of status change
      const statusMessages: Record<OrderStatus, string> = {
        initiated: "Order initiated",
        confirmed: "Order confirmed by seller",
        shipped: "Order shipped",
        delivered: "Order delivered",
        cancelled: "Order cancelled",
      };

      await this.notifySeller(
        order.sellerId,
        "order_status_update",
        statusMessages[status]
      );

      return true;
    } catch (error) {
      console.error("[OrderManagement] Update order status failed:", error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: number): Promise<boolean> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "delivered") {
        throw new Error("Cannot cancel delivered order");
      }

      await this.updateOrderStatus(orderId, "cancelled");
      return true;
    } catch (error) {
      console.error("[OrderManagement] Cancel order failed:", error);
      throw error;
    }
  }

  /**
   * Get order statistics for seller
   */
  static async getSellerStats(sellerId: number): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sellerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.sellerId, sellerId));

      const stats = {
        totalOrders: sellerOrders.length,
        confirmedOrders: sellerOrders.filter((o) => o.status === "confirmed").length,
        shippedOrders: sellerOrders.filter((o) => o.status === "shipped").length,
        deliveredOrders: sellerOrders.filter((o) => o.status === "delivered").length,
        cancelledOrders: sellerOrders.filter((o) => o.status === "cancelled").length,
        totalRevenue: sellerOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice), 0),
      };

      return stats;
    } catch (error) {
      console.error("[OrderManagement] Get seller stats failed:", error);
      throw error;
    }
  }

  /**
   * Notify seller about order
   */
  private static async notifySeller(
    sellerId: number,
    type: string,
    message: string
  ): Promise<void> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(sellerNotifications).values({
        sellerId,
        type,
        message,
        read: false,
        createdAt: new Date(),
      });

      console.log(`[OrderManagement] Notification sent to seller ${sellerId}: ${message}`);
    } catch (error) {
      console.error("[OrderManagement] Notify seller failed:", error);
      // Don't throw - notification failure shouldn't block order creation
    }
  }

  /**
   * Get seller notifications
   */
  static async getSellerNotifications(sellerId: number): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notifications = await db
        .select()
        .from(sellerNotifications)
        .where(eq(sellerNotifications.sellerId, sellerId));

      return notifications;
    } catch (error) {
      console.error("[OrderManagement] Get notifications failed:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(sellerNotifications)
        .set({ read: true })
        .where(eq(sellerNotifications.id, notificationId));

      return true;
    } catch (error) {
      console.error("[OrderManagement] Mark notification as read failed:", error);
      throw error;
    }
  }
}
