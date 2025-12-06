import '@shopify/shopify-api/adapters/node';
import { shopifyApi } from '@shopify/shopify-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use the correct API version format (2025-01)
// The ApiVersion enum doesn't have 2025 versions yet, so we use the string directly
const API_VERSION = '2025-01';

// Initialize Shopify API client
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: ['read_customers', 'read_orders', 'read_products'],
  hostName: process.env.SHOPIFY_HOST || process.env.FRONTEND_URL?.replace(/^https?:\/\//, '') || 'localhost:3001',
  apiVersion: API_VERSION as any, // Pin to specific version for stability
  isEmbeddedApp: false,
});

export interface ShopifyConfig {
  storeUrl: string;
  accessToken: string;
}

/**
 * Normalize store URL to Shopify format (e.g., "store-name.myshopify.com")
 */
export const normalizeStoreUrl = (url: string): string => {
  // Remove protocol
  let normalized = url.replace(/^https?:\/\//, '');
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  // Convert admin.shopify.com/store/xxx to xxx.myshopify.com
  if (normalized.includes('admin.shopify.com/store/')) {
    const match = normalized.match(/admin\.shopify\.com\/store\/([^\/]+)/);
    if (match) {
      normalized = `${match[1]}.myshopify.com`;
    }
  }
  
  // Ensure .myshopify.com suffix
  if (!normalized.endsWith('.myshopify.com')) {
    // If it's just the store name, add .myshopify.com
    if (!normalized.includes('.')) {
      normalized = `${normalized}.myshopify.com`;
    } else {
      throw new Error(`Invalid store URL format: ${url}. Expected format: store-name.myshopify.com`);
    }
  }
  
  return normalized;
};

/**
 * Get Shopify client for a specific tenant
 */
export const getShopifyClient = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || !tenant.accessToken) {
    throw new Error(`Tenant ${tenantId} not found or not authenticated`);
  }

  // Normalize store URL to ensure correct format
  const normalizedUrl = normalizeStoreUrl(tenant.storeUrl);
  
  const session = shopify.session.customAppSession(normalizedUrl);
  session.accessToken = tenant.accessToken;
  
  // Explicitly set API version on the session
  (session as any).apiVersion = API_VERSION;

  // Create GraphQL client with explicit API version
  return new shopify.clients.Graphql({ 
    session,
    apiVersion: API_VERSION as any,
  });
};

/**
 * Fetch customers from Shopify
 */
export const fetchCustomers = async (tenantId: string, limit: number = 250) => {
  const client = await getShopifyClient(tenantId);
  
  const query = `
    query getCustomers($first: Int!) {
      customers(first: $first) {
        edges {
          node {
            id
            email
            firstName
            lastName
            phone
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  // Retry logic for rate limiting
  let retries = 3;
  let response: any;
  
  while (retries > 0) {
    try {
      response = await client.request(query, {
        variables: { first: limit },
      });
      break; // Success, exit retry loop
    } catch (error: any) {
      if (error.statusCode === 429 && retries > 1) {
        // Rate limited - wait and retry
        const waitTime = 2000 * (4 - retries);
        console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries--;
        continue;
      }
      throw error;
    }
  }

  if (!response) {
    throw new Error('Failed to fetch customers: No response received');
  }

  // Check for GraphQL errors
  if (response.errors) {
    console.error('GraphQL errors in fetchCustomers:', response.errors);
    const errorMessage = Array.isArray(response.errors) 
      ? response.errors[0]?.message || 'Unknown error'
      : 'Unknown error';
    throw new Error(`GraphQL error: ${errorMessage}`);
  }

  // Validate response structure
  if (!response.data || !response.data.customers) {
    console.warn('Invalid response structure in fetchCustomers:', response);
    return [];
  }

  // Note: totalSpent and ordersCount will be calculated from orders later
  return response.data.customers.edges?.map((edge: any) => ({
    shopifyId: edge.node.id.replace('gid://shopify/Customer/', ''),
    email: edge.node.email,
    firstName: edge.node.firstName,
    lastName: edge.node.lastName,
    phone: edge.node.phone,
    totalSpent: 0, // Will be calculated from orders
    ordersCount: 0, // Will be calculated from orders
    shopifyCreatedAt: edge.node.createdAt,
    shopifyUpdatedAt: edge.node.updatedAt,
  })) || [];
};

/**
 * Fetch orders from Shopify
 */
export const fetchOrders = async (
  tenantId: string,
  limit: number = 250,
  sinceId?: string
) => {
  const client = await getShopifyClient(tenantId);
  
  const query = `
    query getOrders($first: Int!, $after: String) {
      orders(first: $first, after: $after) {
        edges {
          node {
            id
            name
            email
            displayFinancialStatus
            displayFulfillmentStatus
            customer {
              id
            }
            shippingAddress {
              firstName
              lastName
              city
              province
              country
              zip
            }
            billingAddress {
              firstName
              lastName
              city
              province
              country
              zip
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            subtotalPriceSet {
              shopMoney {
                amount
              }
            }
            totalTaxSet {
              shopMoney {
                amount
              }
            }
            lineItems(first: 250) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                  variant {
                    id
                    sku
                    title
                  }
                  product {
                    id
                  }
                }
              }
            }
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    console.log(`Fetching orders: limit=${limit}, sinceId=${sinceId || 'none'}`);
    
    // Retry logic for rate limiting
    let retries = 3;
    let response: any;
    
    while (retries > 0) {
      try {
        response = await client.request(query, {
          variables: { first: limit, after: sinceId },
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error.statusCode === 429 && retries > 1) {
          // Rate limited - wait and retry
          const waitTime = 2000 * (4 - retries); // Exponential backoff: 2s, 4s, 6s
          console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries--;
          continue;
        }
        throw error; // Re-throw if not rate limit or out of retries
      }
    }

    if (!response) {
      throw new Error('Failed to fetch orders: No response received');
    }

    // Check for GraphQL errors
    if (response.errors) {
      console.error('GraphQL errors in fetchOrders:', response.errors);
      const errorMessage = Array.isArray(response.errors) 
        ? response.errors[0]?.message || 'Unknown error'
        : 'Unknown error';
      throw new Error(`GraphQL error: ${errorMessage}`);
    }

    // Validate response structure
    if (!response.data || !response.data.orders) {
      console.warn('No orders data in response');
      return {
        orders: [],
        hasNextPage: false,
        cursor: undefined,
      };
    }

    const orders = response.data.orders.edges || [];
    console.log(`✅ Fetched ${orders.length} orders from Shopify GraphQL API`);
    
    if (orders.length > 0) {
      const firstOrder = orders[0].node;
      console.log(`Sample order: ${firstOrder.name}, Total: ${firstOrder.totalPriceSet?.shopMoney?.amount}, Status: ${firstOrder.displayFinancialStatus}`);
    }

    const mappedOrders = orders.map((edge: any) => {
      const order = edge.node;
      const customerId = order.customer?.id ? order.customer.id.replace('gid://shopify/Customer/', '') : null;
      const shopifyOrderId = order.id.replace('gid://shopify/Order/', '');
      
      // Extract customer info from order (may be available even when customer API is restricted)
      const customerEmail = order.email || null;
      const shippingName = order.shippingAddress ? 
        `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() || null : null;
      const billingName = order.billingAddress ? 
        `${order.billingAddress.firstName || ''} ${order.billingAddress.lastName || ''}`.trim() || null : null;
      const customerName = shippingName || billingName || null;
      const customerFirstName = order.shippingAddress?.firstName || order.billingAddress?.firstName || null;
      const customerLastName = order.shippingAddress?.lastName || order.billingAddress?.lastName || null;
      
      return {
        shopifyId: shopifyOrderId,
        orderNumber: order.name,
        customerId,
        email: customerEmail, // Email from order (may be available even on basic plans)
        customerFirstName,
        customerLastName,
        customerName,
        financialStatus: order.displayFinancialStatus || 'pending',
        fulfillmentStatus: order.displayFulfillmentStatus || 'unfulfilled',
        totalPrice: parseFloat(order.totalPriceSet?.shopMoney?.amount || '0'),
        subtotalPrice: parseFloat(order.subtotalPriceSet?.shopMoney?.amount || '0'),
        totalTax: parseFloat(order.totalTaxSet?.shopMoney?.amount || '0'),
        currency: order.totalPriceSet?.shopMoney?.currencyCode || 'USD',
        orderDate: new Date(order.createdAt),
        shopifyCreatedAt: order.createdAt,
        shopifyUpdatedAt: order.updatedAt,
        lineItems: (order.lineItems?.edges || []).map((item: any) => {
          const productId = item.node.product?.id ? item.node.product.id.replace('gid://shopify/Product/', '') : null;
          const variantId = item.node.variant?.id ? item.node.variant.id.replace('gid://shopify/ProductVariant/', '') : null;
          
          return {
            shopifyProductId: productId,
            shopifyVariantId: variantId,
            title: item.node.title,
            quantity: item.node.quantity,
            price: parseFloat(item.node.originalUnitPriceSet?.shopMoney?.amount || '0'),
            totalPrice: parseFloat(item.node.originalUnitPriceSet?.shopMoney?.amount || '0') * item.node.quantity,
            sku: item.node.variant?.sku || null,
            variantTitle: item.node.variant?.title || null,
          };
        }),
      };
    });
    
    console.log(`✅ Mapped ${mappedOrders.length} orders successfully`);
    
    // Return orders and pagination info
    return {
      orders: mappedOrders,
      hasNextPage: response.data.orders.pageInfo?.hasNextPage || false,
      cursor: response.data.orders.pageInfo?.endCursor,
    };
  } catch (error: any) {
    console.error('Error fetching orders:', error.message);
    if (error.body?.errors) {
      console.error('GraphQL errors:', JSON.stringify(error.body.errors, null, 2));
    }
    throw error;
  }
};

/**
 * Fetch products from Shopify
 */
export const fetchProducts = async (tenantId: string, limit: number = 250) => {
  const client = await getShopifyClient(tenantId);
  
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            vendor
            productType
            status
            totalInventory
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  // Retry logic for rate limiting
  let retries = 3;
  let response: any;
  
  while (retries > 0) {
    try {
      response = await client.request(query, {
        variables: { first: limit },
      });
      break; // Success, exit retry loop
    } catch (error: any) {
      if (error.statusCode === 429 && retries > 1) {
        // Rate limited - wait and retry
        const waitTime = 2000 * (4 - retries);
        console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries--;
        continue;
      }
      throw error;
    }
  }

  if (!response) {
    throw new Error('Failed to fetch products: No response received');
  }

  // Check for GraphQL errors
  if (response.errors) {
    console.error('GraphQL errors in fetchProducts:', response.errors);
    const errorMessage = Array.isArray(response.errors) 
      ? response.errors[0]?.message || 'Unknown error'
      : 'Unknown error';
    throw new Error(`GraphQL error: ${errorMessage}`);
  }

  // Validate response structure
  if (!response.data || !response.data.products) {
    console.warn('Invalid response structure in fetchProducts:', response);
    return [];
  }

  return response.data.products.edges?.map((edge: any) => ({
    shopifyId: edge.node.id.replace('gid://shopify/Product/', ''),
    title: edge.node.title,
    handle: edge.node.handle,
    vendor: edge.node.vendor,
    productType: edge.node.productType,
    status: edge.node.status,
    totalInventory: edge.node.totalInventory || 0,
    shopifyCreatedAt: edge.node.createdAt,
    shopifyUpdatedAt: edge.node.updatedAt,
  })) || [];
};

/**
 * Sync all data for a tenant
 */
export const syncTenantData = async (tenantId: string) => {
  console.log(`Starting sync for tenant ${tenantId}`);
  
  try {
    // Sync customers (may fail on basic Shopify plans - skip if error)
    let customerCount = 0;
    try {
      const customers = await fetchCustomers(tenantId);
      console.log(`Fetched ${customers.length} customers from Shopify`);
      for (const customerData of customers) {
        await prisma.customer.upsert({
          where: {
            tenantId_shopifyId: {
              tenantId,
              shopifyId: customerData.shopifyId,
            },
          },
          update: {
            email: customerData.email,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            phone: customerData.phone,
            totalSpent: customerData.totalSpent,
            ordersCount: customerData.ordersCount,
            shopifyUpdatedAt: customerData.shopifyUpdatedAt ? new Date(customerData.shopifyUpdatedAt) : null,
          },
          create: {
            tenantId,
            shopifyId: customerData.shopifyId,
            email: customerData.email,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            phone: customerData.phone,
            totalSpent: customerData.totalSpent,
            ordersCount: customerData.ordersCount,
            shopifyCreatedAt: customerData.shopifyCreatedAt ? new Date(customerData.shopifyCreatedAt) : null,
            shopifyUpdatedAt: customerData.shopifyUpdatedAt ? new Date(customerData.shopifyUpdatedAt) : null,
          },
        });
        customerCount++;
      }
    } catch (customerError: any) {
      console.warn(`⚠️ Customer sync skipped (may require Shopify Plus/Advanced plan): ${customerError.message}`);
      // Continue with other syncs even if customers fail
    }

    // Sync products
    let productCount = 0;
    try {
      const products = await fetchProducts(tenantId);
      console.log(`Fetched ${products.length} products from Shopify`);
      for (const productData of products) {
      await prisma.product.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId,
            shopifyId: productData.shopifyId,
          },
        },
        update: {
          title: productData.title,
          handle: productData.handle,
          vendor: productData.vendor,
          productType: productData.productType,
          status: productData.status,
          totalInventory: productData.totalInventory,
          shopifyUpdatedAt: productData.shopifyUpdatedAt ? new Date(productData.shopifyUpdatedAt) : null,
          // Note: totalSales and totalRevenue are calculated from orders below
        },
        create: {
          tenantId,
          shopifyId: productData.shopifyId,
          title: productData.title,
          handle: productData.handle,
          vendor: productData.vendor,
          productType: productData.productType,
          status: productData.status,
          totalInventory: productData.totalInventory,
          totalSales: 0, // Will be calculated from orders
          totalRevenue: 0, // Will be calculated from orders
          shopifyCreatedAt: productData.shopifyCreatedAt ? new Date(productData.shopifyCreatedAt) : null,
          shopifyUpdatedAt: productData.shopifyUpdatedAt ? new Date(productData.shopifyUpdatedAt) : null,
        },
      });
      productCount++;
      }
    } catch (productError: any) {
      console.error(`❌ Product sync failed: ${productError.message}`);
      throw productError; // Fail sync if products can't be fetched
    }

    // Sync orders (with pagination)
    let hasNextPage = true;
    let cursor: string | undefined;
    let orderCount = 0;
    let totalOrdersFetched = 0;

    console.log(`Starting order sync for tenant ${tenantId}`);
    try {
      while (hasNextPage && orderCount < 1000) {
        const result = await fetchOrders(tenantId, 250, cursor);
        if (!result || typeof result !== 'object' || !('orders' in result)) {
          console.error('Invalid result from fetchOrders:', result);
          hasNextPage = false;
          break;
        }
        const orders = result.orders;
        console.log(`📦 Received ${orders.length} orders from fetchOrders function`);
        totalOrdersFetched += orders.length;
        console.log(`Fetched ${orders.length} orders (total: ${totalOrdersFetched})`);
        
        if (orders.length === 0) {
          console.log('No more orders to process, ending sync');
          hasNextPage = false;
          break;
        }
        
        // Update pagination cursor
        cursor = result.cursor;
        hasNextPage = result.hasNextPage;
        
        console.log(`Processing ${orders.length} orders...`);
        for (const orderData of orders) {
          console.log(`\n📦 Processing order: ${orderData.orderNumber}`);
          console.log(`   Shopify ID: ${orderData.shopifyId}`);
          console.log(`   Total: ${orderData.currency} ${orderData.totalPrice}`);
          console.log(`   Customer ID: ${orderData.customerId || 'None'}`);
          console.log(`   Line Items: ${orderData.lineItems.length}`);
          
          // Find or create customer from order data (since direct customer access may be restricted)
          let customer = null;
          if (orderData.customerId) {
            try {
              customer = await prisma.customer.findFirst({
                where: {
                  tenantId,
                  shopifyId: orderData.customerId,
                },
              });
              
              // Create customer if doesn't exist (from order data)
              if (!customer) {
                // Try to get customer info from order data (may be available even on basic plans)
                const customerEmail = orderData.email || null;
                const customerFirstName = orderData.customerFirstName || null;
                const customerLastName = orderData.customerLastName || null;
                
                customer = await prisma.customer.create({
                  data: {
                    tenantId,
                    shopifyId: orderData.customerId,
                    email: customerEmail, // Email from order (may be available)
                    firstName: customerFirstName, // Name from shipping/billing address
                    lastName: customerLastName,
                    totalSpent: 0, // Will be calculated later
                    ordersCount: 0, // Will be calculated later
                  },
                });
                console.log(`   ✅ Created customer ${orderData.customerId} from order ${orderData.orderNumber}${customerEmail ? ` (Email: ${customerEmail})` : ''}${customerFirstName ? ` (Name: ${customerFirstName} ${customerLastName || ''})`.trim() : ''}`);
              } else {
                // Update customer with any new info from order
                const updates: any = {};
                if (orderData.email && !customer.email) {
                  updates.email = orderData.email;
                }
                if (orderData.customerFirstName && !customer.firstName) {
                  updates.firstName = orderData.customerFirstName;
                }
                if (orderData.customerLastName && !customer.lastName) {
                  updates.lastName = orderData.customerLastName;
                }
                
                if (Object.keys(updates).length > 0) {
                  customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: updates,
                  });
                  console.log(`   ✅ Updated customer ${orderData.customerId} with additional info from order`);
                } else {
                  console.log(`   ✅ Found existing customer ${orderData.customerId}`);
                }
              }
            } catch (customerError: any) {
              console.warn(`   ⚠️ Failed to create/find customer for order ${orderData.orderNumber}:`, customerError.message);
              // Continue with order creation even if customer creation fails
            }
          }

        try {
          console.log(`Processing order ${orderData.orderNumber} (Shopify ID: ${orderData.shopifyId})`);
          console.log(`  - Total Price: ${orderData.totalPrice}`);
          console.log(`  - Order Date: ${orderData.orderDate}`);
          console.log(`  - Customer ID: ${customer?.id || 'None'}`);
          
          const order = await prisma.order.upsert({
            where: {
              tenantId_shopifyId: {
                tenantId,
                shopifyId: orderData.shopifyId,
              },
            },
            update: {
              orderNumber: orderData.orderNumber,
              customerId: customer?.id,
              email: orderData.email,
              financialStatus: orderData.financialStatus,
              fulfillmentStatus: orderData.fulfillmentStatus,
              totalPrice: orderData.totalPrice,
              subtotalPrice: orderData.subtotalPrice,
              totalTax: orderData.totalTax,
              currency: orderData.currency,
              orderDate: orderData.orderDate,
              shopifyUpdatedAt: orderData.shopifyUpdatedAt ? new Date(orderData.shopifyUpdatedAt) : null,
            },
            create: {
              tenantId,
              shopifyId: orderData.shopifyId,
              orderNumber: orderData.orderNumber,
              customerId: customer?.id,
              email: orderData.email,
              financialStatus: orderData.financialStatus,
              fulfillmentStatus: orderData.fulfillmentStatus,
              totalPrice: orderData.totalPrice,
              subtotalPrice: orderData.subtotalPrice,
              totalTax: orderData.totalTax,
              currency: orderData.currency,
              orderDate: orderData.orderDate,
              shopifyCreatedAt: orderData.shopifyCreatedAt ? new Date(orderData.shopifyCreatedAt) : null,
              shopifyUpdatedAt: orderData.shopifyUpdatedAt ? new Date(orderData.shopifyUpdatedAt) : null,
            },
          });
          console.log(`✅ Saved order ${orderData.orderNumber} (DB ID: ${order.id}, Total: ${orderData.totalPrice})`);

          // Sync line items
          let lineItemCount = 0;
          for (const itemData of orderData.lineItems) {
            const product = itemData.shopifyProductId
              ? await prisma.product.findFirst({
                  where: {
                    tenantId,
                    shopifyId: itemData.shopifyProductId,
                  },
                })
              : null;

            // Use findFirst + create/update instead of upsert for composite unique constraint
            const existingItem = await prisma.orderLineItem.findFirst({
              where: {
                orderId: order.id,
                shopifyVariantId: itemData.shopifyVariantId || null,
                title: itemData.title,
              },
            });

            if (existingItem) {
              await prisma.orderLineItem.update({
                where: { id: existingItem.id },
                data: {
                  quantity: itemData.quantity,
                  price: itemData.price,
                  totalPrice: itemData.totalPrice,
                  sku: itemData.sku,
                  variantTitle: itemData.variantTitle,
                  productId: product?.id,
                },
              });
            } else {
              await prisma.orderLineItem.create({
                data: {
                  orderId: order.id,
                  productId: product?.id,
                  shopifyProductId: itemData.shopifyProductId,
                  shopifyVariantId: itemData.shopifyVariantId,
                  title: itemData.title,
                  quantity: itemData.quantity,
                  price: itemData.price,
                  totalPrice: itemData.totalPrice,
                  sku: itemData.sku,
                  variantTitle: itemData.variantTitle,
                },
              });
            }
            lineItemCount++;
          }
          console.log(`  - Synced ${lineItemCount} line items for order ${orderData.orderNumber}`);
        } catch (orderError: any) {
          console.error(`❌ Failed to save order ${orderData.orderNumber}:`, orderError.message);
          console.error('Order error details:', {
            shopifyId: orderData.shopifyId,
            orderNumber: orderData.orderNumber,
            totalPrice: orderData.totalPrice,
            orderDate: orderData.orderDate,
            error: orderError.message,
            stack: orderError.stack,
          });
          // Continue with next order even if this one fails
        }

          orderCount++;
        }

        // Check if there are more pages (simplified - in production, use pageInfo)
        hasNextPage = orders.length === 250;
        if (hasNextPage && orders.length > 0) {
          // Use the last order's shopifyId as cursor for next page
          cursor = orders[orders.length - 1]?.shopifyId;
        } else {
          hasNextPage = false;
        }
      }
      console.log(`Order sync completed: ${orderCount} orders processed`);
    } catch (orderError: any) {
      console.error(`❌ Order sync failed: ${orderError.message}`);
      console.error('Order error details:', orderError);
      // Don't throw - continue to update stats even if some orders failed
    }

    // Update customer stats
    const allCustomers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        orders: true,
      },
    });

    for (const customer of allCustomers) {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalPrice, 0);
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent,
          ordersCount: customer.orders.length,
        },
      });
    }

    // Update product stats from order line items
    console.log(`Updating product stats for tenant ${tenantId}`);
    const allProducts = await prisma.product.findMany({
      where: { tenantId },
    });

    console.log(`Found ${allProducts.length} products to update stats for`);
    for (const product of allProducts) {
      const lineItems = await prisma.orderLineItem.findMany({
        where: {
          productId: product.id,
          order: {
            tenantId,
          },
        },
        include: {
          order: true,
        },
      });

      const totalSales = lineItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          totalSales,
          totalRevenue,
        },
      });
    }
    console.log(`Product stats updated for ${allProducts.length} products`);

    console.log(`Sync completed for tenant ${tenantId}`);
    console.log(`Summary: ${customerCount} customers, ${orderCount} orders, ${productCount} products synced`);
    return { success: true, customers: allCustomers.length, orders: orderCount, products: allProducts.length };
  } catch (error) {
    console.error(`Sync failed for tenant ${tenantId}:`, error);
    throw error;
  }
};

