import swaggerJsdoc from 'swagger-jsdoc';

// ── Reusable schema fragments ─────────────────────────────────────────────────

const paginationQuery = [
  { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 }  },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
];

const storeIdParam  = { name: 'storeId',   in: 'path', required: true, schema: { type: 'string' } };
const productIdParam = { name: 'productId', in: 'path', required: true, schema: { type: 'string' } };
const orderIdParam   = { name: 'orderId',   in: 'path', required: true, schema: { type: 'string' } };

const bearerSecurity = [{ bearerAuth: [] }];

const r = {
  400: { $ref: '#/components/responses/Validation' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  409: { $ref: '#/components/responses/Conflict' },
};

// ── Full OpenAPI definition ────────────────────────────────────────────────────

const definition = {
  openapi: '3.0.0',
  info: {
    title:       'ThriftBazaar API',
    version:     '1.0.0',
    description: 'Multi-vendor thrift marketplace API for India. All monetary values are in INR (₹). Authenticate with a Bearer JWT obtained from POST /auth/login.',
    contact: { name: 'ThriftBazaar', email: 'dev@thriftbazaar.in' },
  },
  servers: [{ url: '/api/v1', description: 'Default server' }],
  tags: [
    { name: 'Auth',     description: 'Register, login, token rotation, logout' },
    { name: 'Products', description: '1-of-1 thrift product catalogue' },
    { name: 'Stores',   description: 'Vendor storefronts with MySpace-style customisation' },
    { name: 'Cart',     description: 'Redis-backed cart — BUYER role only' },
    { name: 'Orders',   description: 'Multi-vendor checkout, Razorpay payment, order management' },
    { name: 'Reviews',  description: 'Post-delivery product reviews' },
    { name: 'Drops',    description: 'Scheduled real-time drop events via Socket.io' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid access token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Insufficient role or resource ownership',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Conflict — duplicate record or invalid state transition',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Validation: {
        description: 'Request body / query param validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string',  example: 'Resource not found' },
          code:    { type: 'string',  example: 'NOT_FOUND' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 100 },
          page:  { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          pages: { type: 'integer', example: 5 },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id:         { type: 'string' },
          email:      { type: 'string', format: 'email' },
          phone:      { type: 'string', example: '9876543210' },
          role:       { type: 'string', enum: ['BUYER', 'VENDOR', 'ADMIN'] },
          isVerified: { type: 'boolean' },
          isActive:   { type: 'boolean' },
          createdAt:  { type: 'string', format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken:  { type: 'string' },
          refreshToken: { type: 'string' },
          user:         { $ref: '#/components/schemas/UserProfile' },
        },
      },
      ProductSummary: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          title:        { type: 'string' },
          slug:         { type: 'string' },
          sellingPrice: { type: 'number',  example: 499 },
          condition:    { type: 'string',  enum: ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR'] },
          status:       { type: 'string',  enum: ['DRAFT', 'ACTIVE', 'SOLD', 'INACTIVE'] },
          isAvailable:  { type: 'boolean' },
          images:       { type: 'array', items: { type: 'string', format: 'uri' } },
          brand:        { type: 'string',  nullable: true },
          gender:       { type: 'string',  enum: ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] },
          rarity:       { type: 'string',  enum: ['COMMON', 'UNCOMMON', 'RARE', 'VINTAGE_RARE'] },
          city:         { type: 'string' },
          createdAt:    { type: 'string',  format: 'date-time' },
        },
      },
      ProductFull: {
        allOf: [
          { $ref: '#/components/schemas/ProductSummary' },
          {
            type: 'object',
            properties: {
              description:   { type: 'string' },
              originalPrice: { type: 'number' },
              color:         { type: 'array', items: { type: 'string' } },
              size:          { type: 'string', nullable: true },
              fabric:        { type: 'string', nullable: true },
              era:           { type: 'string', nullable: true, example: '90s' },
              style:         { type: 'array', items: { type: 'string' } },
              tags:          { type: 'array', items: { type: 'string' } },
              defects:       { type: 'string', nullable: true },
              visibleSpots:  { type: 'string', nullable: true },
              measurements:  { type: 'object', nullable: true },
              metadata:      { type: 'object', nullable: true },
              views:         { type: 'integer' },
              vendor:        { type: 'object', properties: { displayName: { type: 'string' }, avatar: { type: 'string', nullable: true } } },
              store:         { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' } } },
              category:      { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' } } },
            },
          },
        ],
      },
      StoreSummary: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          name:         { type: 'string' },
          slug:         { type: 'string' },
          description:  { type: 'string', nullable: true },
          logo:         { type: 'string', nullable: true, format: 'uri' },
          city:         { type: 'string' },
          state:        { type: 'string', nullable: true },
          styleTags:    { type: 'array', items: { type: 'string' }, example: ['Y2K', 'Vintage'] },
          bannerColor:  { type: 'string', nullable: true, example: '#FF5733' },
          dropSchedule: { type: 'string', nullable: true, example: 'Friday 6PM IST' },
          vendor:       { type: 'object', properties: { displayName: { type: 'string' }, rating: { type: 'number' }, ratingCount: { type: 'integer' }, totalSales: { type: 'integer' } } },
          _count:       { type: 'object', properties: { products: { type: 'integer' }, followers: { type: 'integer' } } },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          productId:    { type: 'string' },
          vendorId:     { type: 'string' },
          title:        { type: 'string' },
          sellingPrice: { type: 'number' },
          images:       { type: 'array', items: { type: 'string', format: 'uri' } },
          condition:    { type: 'string', enum: ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR'] },
          brand:        { type: 'string', nullable: true },
          addedAt:      { type: 'string', format: 'date-time' },
        },
      },
      CartGroup: {
        type: 'object',
        properties: {
          vendorId:   { type: 'string' },
          vendorName: { type: 'string' },
          storeId:    { type: 'string' },
          storeName:  { type: 'string' },
          items:      { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
          subtotal:   { type: 'number' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id:        { type: 'string' },
          rating:    { type: 'integer', minimum: 1, maximum: 5 },
          comment:   { type: 'string', nullable: true },
          images:    { type: 'array', items: { type: 'string', format: 'uri' } },
          createdAt: { type: 'string', format: 'date-time' },
          buyer:     { type: 'object', properties: { user: { type: 'object', properties: { email: { type: 'string' } } } } },
          product:   { type: 'object', nullable: true, properties: { id: { type: 'string' }, title: { type: 'string' }, slug: { type: 'string' } } },
        },
      },
      Drop: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          storeId:      { type: 'string' },
          vendorId:     { type: 'string' },
          dropTitle:    { type: 'string' },
          description:  { type: 'string', nullable: true },
          scheduledAt:  { type: 'string', format: 'date-time' },
          productIds:   { type: 'array', items: { type: 'string' } },
          isLive:       { type: 'boolean' },
          createdAt:    { type: 'string', format: 'date-time' },
        },
      },
    },
  },

  // ── Paths ──────────────────────────────────────────────────────────────────

  paths: {

    // ── Auth ────────────────────────────────────────────────────────────────

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a BUYER or VENDOR account. Duplicate email or phone returns 409.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'phone', 'password', 'role'],
                properties: {
                  email:       { type: 'string', format: 'email', example: 'buyer@example.com' },
                  phone:       { type: 'string', example: '9876543210' },
                  password:    { type: 'string', minLength: 8, example: 'SecurePass1!' },
                  role:        { type: 'string', enum: ['BUYER', 'VENDOR'] },
                  displayName: { type: 'string', description: 'Required when role is VENDOR', example: 'Retro Raj' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created and tokens issued',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/AuthTokens' } } } } },
          },
          400: r[400], 409: r[409],
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Returns a 15-minute access token and a 7-day refresh token stored in Redis.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/AuthTokens' } } } } },
          },
          400: r[400], 401: r[401],
        },
      },
    },

    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token',
        description: 'Validates the refresh token against Redis, rotates it, and returns a new token pair.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'New token pair issued',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/AuthTokens' } } } } },
          },
          401: r[401],
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Deletes the refresh token from Redis, invalidating the session.',
        security: bearerSecurity,
        responses: {
          200: { description: 'Logged out successfully' },
          401: r[401],
        },
      },
    },

    // ── Products ────────────────────────────────────────────────────────────

    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products (public, paginated)',
        description: 'Supports filtering by condition, rarity, gender, brand, city, price range, and array fields (color, style, tags).',
        parameters: [
          ...paginationQuery,
          { name: 'search',     in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'condition',  in: 'query', schema: { type: 'string', enum: ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR'] } },
          { name: 'gender',     in: 'query', schema: { type: 'string', enum: ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] } },
          { name: 'rarity',     in: 'query', schema: { type: 'string', enum: ['COMMON', 'UNCOMMON', 'RARE', 'VINTAGE_RARE'] } },
          { name: 'brand',      in: 'query', schema: { type: 'string' } },
          { name: 'city',       in: 'query', schema: { type: 'string' } },
          { name: 'priceMin',   in: 'query', schema: { type: 'number' } },
          { name: 'priceMax',   in: 'query', schema: { type: 'number' } },
          { name: 'color',      in: 'query', description: 'Comma-separated values', schema: { type: 'string', example: 'red,blue' } },
          { name: 'style',      in: 'query', description: 'Comma-separated values', schema: { type: 'string', example: 'Y2K,Boho' } },
          { name: 'tags',       in: 'query', description: 'Comma-separated values', schema: { type: 'string', example: 'vintage,floral' } },
          { name: 'era',        in: 'query', schema: { type: 'string', example: '90s' } },
          { name: 'fabric',     in: 'query', schema: { type: 'string' } },
          { name: 'size',       in: 'query', schema: { type: 'string' } },
          { name: 'sortBy',     in: 'query', schema: { type: 'string', enum: ['createdAt', 'sellingPrice', 'views'] } },
          { name: 'sortOrder',  in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Paginated product list',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/ProductSummary' } }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product (VENDOR)',
        description: 'Multipart form upload. Accepts up to 5 images. Product is created in DRAFT status.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'categoryId', 'originalPrice', 'sellingPrice', 'condition', 'gender', 'city'],
                properties: {
                  title:         { type: 'string', minLength: 3 },
                  description:   { type: 'string', minLength: 10 },
                  categoryId:    { type: 'string' },
                  originalPrice: { type: 'number', example: 1200 },
                  sellingPrice:  { type: 'number', example: 499 },
                  condition:     { type: 'string', enum: ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR'] },
                  gender:        { type: 'string', enum: ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] },
                  city:          { type: 'string', example: 'Mumbai' },
                  brand:         { type: 'string' },
                  size:          { type: 'string' },
                  color:         { type: 'string', description: 'JSON array or comma-separated' },
                  fabric:        { type: 'string' },
                  era:           { type: 'string', example: '90s' },
                  rarity:        { type: 'string', enum: ['COMMON', 'UNCOMMON', 'RARE', 'VINTAGE_RARE'] },
                  style:         { type: 'string', description: 'JSON array or comma-separated' },
                  tags:          { type: 'string', description: 'JSON array or comma-separated' },
                  defects:       { type: 'string' },
                  visibleSpots:  { type: 'string' },
                  measurements:  { type: 'string', description: 'JSON string, e.g. {"chest":"38in"}' },
                  images:        { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/ProductFull' } } } } } },
          400: r[400], 401: r[401], 403: r[403],
        },
      },
    },

    '/products/{productId}': {
      get: {
        tags: ['Products'],
        summary: 'Get a single product',
        parameters: [productIdParam],
        responses: {
          200: { description: 'Product detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/ProductFull' } } } } } },
          404: r[404],
        },
      },
      patch: {
        tags: ['Products'],
        summary: 'Update a product (VENDOR, owner)',
        description: 'Multipart form. Only the owning vendor can update. Images upload replaces all images.',
        security: bearerSecurity,
        parameters: [productIdParam],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  title:         { type: 'string' },
                  description:   { type: 'string' },
                  sellingPrice:  { type: 'number' },
                  status:        { type: 'string', enum: ['DRAFT', 'ACTIVE', 'INACTIVE'] },
                  condition:     { type: 'string', enum: ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR'] },
                  brand:         { type: 'string' },
                  size:          { type: 'string' },
                  defects:       { type: 'string' },
                  images:        { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product updated' },
          400: r[400], 401: r[401], 403: r[403], 404: r[404],
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product (VENDOR, owner)',
        description: 'Only DRAFT or INACTIVE products can be deleted.',
        security: bearerSecurity,
        parameters: [productIdParam],
        responses: {
          200: { description: 'Product deleted' },
          401: r[401], 403: r[403], 404: r[404], 409: r[409],
        },
      },
    },

    // ── Stores ──────────────────────────────────────────────────────────────

    '/stores': {
      get: {
        tags: ['Stores'],
        summary: 'List stores (public, paginated)',
        parameters: [
          ...paginationQuery,
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'city',   in: 'query', schema: { type: 'string' } },
          { name: 'tags',   in: 'query', description: 'Comma-separated style tags', schema: { type: 'string', example: 'Y2K,Vintage' } },
        ],
        responses: {
          200: { description: 'Paginated store list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/StoreSummary' } }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
        },
      },
      post: {
        tags: ['Stores'],
        summary: 'Create a store (VENDOR)',
        description: 'One store per vendor. Returns 409 if the vendor already has a store.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['storeName', 'city'],
                properties: {
                  storeName: { type: 'string', example: 'Retro Raj Vintage' },
                  bio:       { type: 'string', maxLength: 500 },
                  city:      { type: 'string', example: 'Delhi' },
                  state:     { type: 'string' },
                  styleTags: { type: 'array', items: { type: 'string' }, example: ['Y2K', 'Boho'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Store created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/StoreSummary' } } } } } },
          400: r[400], 401: r[401], 403: r[403], 409: r[409],
        },
      },
    },

    '/stores/following': {
      get: {
        tags: ['Stores'],
        summary: 'Get stores the buyer is following (BUYER)',
        security: bearerSecurity,
        parameters: paginationQuery,
        responses: {
          200: { description: 'Followed stores list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array' }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
          401: r[401], 403: r[403],
        },
      },
    },

    '/stores/{storeId}': {
      get: {
        tags: ['Stores'],
        summary: 'Get store profile (public)',
        description: 'Returns store detail with vendor info, latest 8 active products, and follower count.',
        parameters: [storeIdParam],
        responses: {
          200: { description: 'Store profile' },
          404: r[404],
        },
      },
      patch: {
        tags: ['Stores'],
        summary: 'Update store (VENDOR, owner)',
        description: 'Multipart form. Accepts optional avatar image upload.',
        security: bearerSecurity,
        parameters: [storeIdParam],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  bio:          { type: 'string', maxLength: 500 },
                  bannerColor:  { type: 'string', example: '#FF5733' },
                  dropSchedule: { type: 'string', example: 'Friday 6PM IST' },
                  styleTags:    { type: 'string', description: 'JSON array or comma-separated' },
                  avatarImage:  { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Store updated' },
          400: r[400], 401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    '/stores/{storeId}/products': {
      get: {
        tags: ['Stores'],
        summary: 'Get products for a store (public, paginated)',
        parameters: [storeIdParam, ...paginationQuery],
        responses: {
          200: { description: 'Store product list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/ProductSummary' } }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
          404: r[404],
        },
      },
    },

    '/stores/{storeId}/stats': {
      get: {
        tags: ['Stores'],
        summary: 'Get store statistics (VENDOR, owner)',
        description: 'Returns revenue, items sold, average rating, and follower count.',
        security: bearerSecurity,
        parameters: [storeIdParam],
        responses: {
          200: {
            description: 'Store statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalRevenue:   { type: 'number', example: 12540.5 },
                        totalItemsSold: { type: 'integer', example: 47 },
                        averageRating:  { type: 'number',  example: 4.3 },
                        totalReviews:   { type: 'integer', example: 23 },
                        totalFollowers: { type: 'integer', example: 180 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    '/stores/{storeId}/follow': {
      post: {
        tags: ['Stores'],
        summary: 'Follow a store (BUYER)',
        description: 'The authenticated buyer\'s socket will start receiving `drop:scheduled` events for this store.',
        security: bearerSecurity,
        parameters: [storeIdParam],
        responses: {
          201: { description: 'Store followed' },
          401: r[401], 403: r[403], 404: r[404], 409: r[409],
        },
      },
      delete: {
        tags: ['Stores'],
        summary: 'Unfollow a store (BUYER)',
        security: bearerSecurity,
        parameters: [storeIdParam],
        responses: {
          200: { description: 'Unfollowed successfully' },
          401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    '/stores/{storeId}/drops': {
      post: {
        tags: ['Drops'],
        summary: 'Schedule a drop (VENDOR, owner)',
        description: 'Creates a Drop record and immediately emits `drop:scheduled` to the Socket.io room `store:{storeId}`. Buyers following the store and connected via Socket.io receive the event.',
        security: bearerSecurity,
        parameters: [storeIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dropTitle', 'scheduledAt', 'productIds'],
                properties: {
                  dropTitle:   { type: 'string', minLength: 2, maxLength: 100, example: 'Y2K Friday Drop' },
                  description: { type: 'string', maxLength: 500 },
                  scheduledAt: { type: 'string', format: 'date-time', example: '2025-12-19T18:00:00.000Z' },
                  productIds:  { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Drop scheduled and socket event emitted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Drop' } } } } } },
          400: r[400], 401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    // ── Cart ────────────────────────────────────────────────────────────────

    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get cart contents (BUYER)',
        description: 'Returns items grouped by vendor from the Redis cart hash.',
        security: bearerSecurity,
        responses: {
          200: { description: 'Cart contents', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/CartGroup' } } } } } } },
          401: r[401], 403: r[403],
        },
      },
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart (BUYER)',
        description: 'Item must be ACTIVE and available. Duplicates return 409.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: { productId: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          201: { description: 'Item added' },
          400: r[400], 401: r[401], 403: r[403], 404: r[404], 409: r[409],
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear entire cart (BUYER)',
        security: bearerSecurity,
        responses: {
          200: { description: 'Cart cleared' },
          401: r[401], 403: r[403],
        },
      },
    },

    '/cart/{productId}': {
      delete: {
        tags: ['Cart'],
        summary: 'Remove a single item from cart (BUYER)',
        security: bearerSecurity,
        parameters: [productIdParam],
        responses: {
          200: { description: 'Item removed' },
          401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    // ── Orders ──────────────────────────────────────────────────────────────

    '/orders/checkout': {
      post: {
        tags: ['Orders'],
        summary: 'Checkout (BUYER)',
        description: 'Converts cart to a multi-vendor Order + Razorpay order. Returns Razorpay order ID and key for client-side payment initialisation.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  shippingAddress: { type: 'object', description: 'Free-form JSON shipping snapshot' },
                  notes:           { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Razorpay order created, pending payment',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        order:   { type: 'object', properties: { id: { type: 'string' }, totalAmount: { type: 'number' }, itemCount: { type: 'integer' }, subOrderCount: { type: 'integer' } } },
                        payment: { type: 'object', properties: { razorpayOrderId: { type: 'string' }, amount: { type: 'integer', description: 'Amount in paise' }, currency: { type: 'string', example: 'INR' }, keyId: { type: 'string' } } },
                      },
                    },
                  },
                },
              },
            },
          },
          400: r[400], 401: r[401], 403: r[403], 409: r[409],
        },
      },
    },

    '/orders/verify': {
      post: {
        tags: ['Orders'],
        summary: 'Verify Razorpay payment (BUYER)',
        description: 'Validates HMAC-SHA256 signature, marks products SOLD via SELECT FOR UPDATE, creates vendor payouts, and clears cart.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature'],
                properties: {
                  razorpayOrderId:   { type: 'string' },
                  razorpayPaymentId: { type: 'string' },
                  razorpaySignature: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment verified and order confirmed', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { orderId: { type: 'string' } } } } } } } },
          400: r[400], 401: r[401], 403: r[403], 409: r[409],
        },
      },
    },

    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List buyer\'s orders (BUYER)',
        security: bearerSecurity,
        parameters: paginationQuery,
        responses: {
          200: { description: 'Paginated order list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array' }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
          401: r[401], 403: r[403],
        },
      },
    },

    '/orders/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Get a single order (BUYER)',
        security: bearerSecurity,
        parameters: [orderIdParam],
        responses: {
          200: { description: 'Full order detail including sub-orders and payment' },
          401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    '/orders/vendor': {
      get: {
        tags: ['Orders'],
        summary: 'List vendor\'s sub-orders (VENDOR)',
        description: 'Returns all sub-orders belonging to the authenticated vendor, with buyer contact info.',
        security: bearerSecurity,
        parameters: paginationQuery,
        responses: {
          200: { description: 'Paginated sub-order list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array' }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
          401: r[401], 403: r[403],
        },
      },
    },

    '/orders/vendor/{subOrderId}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Advance sub-order status (VENDOR)',
        description: 'Valid transitions: CONFIRMED → SHIPPED → DELIVERED.',
        security: bearerSecurity,
        parameters: [{ name: 'subOrderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['SHIPPED', 'DELIVERED'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status updated' },
          400: r[400], 401: r[401], 403: r[403], 404: r[404],
        },
      },
    },

    // ── Reviews ─────────────────────────────────────────────────────────────

    '/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Create a review (BUYER)',
        description: 'Buyer must have a DELIVERED sub-order containing the product. One review per product per buyer.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'rating'],
                properties: {
                  productId: { type: 'string' },
                  rating:    { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comment:   { type: 'string', maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review submitted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Review' } } } } } },
          400: r[400], 401: r[401], 403: r[403], 404: r[404], 409: r[409],
        },
      },
    },

    '/reviews/product/{productId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get reviews for a product (public, paginated)',
        parameters: [productIdParam, ...paginationQuery],
        responses: {
          200: { description: 'Product reviews', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Review' } }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
        },
      },
    },

    '/reviews/store/{storeId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get all reviews for a store\'s products (public, paginated)',
        parameters: [storeIdParam, ...paginationQuery],
        responses: {
          200: { description: 'Store reviews', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Review' } }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({ definition, apis: [] });
