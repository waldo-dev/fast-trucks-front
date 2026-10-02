# Graph Report - operfoods  (2026-10-01)

## Corpus Check
- 339 files · ~137,069 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: (none) 13, .example 4, .ico 2)

## Summary
- 1979 nodes · 4487 edges · 125 communities (85 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Operfoods Front Auth & Layout
- Docs: Two Systems Overview
- Orders Cost & Repositories
- Sequelize Models & Associations
- Operfoods Auth Module
- Category/User/Event Services
- DB Connection & Models
- POS & Product UI Components
- Admin Businesses Page
- Casinos Front Deps
- Settings & Business Selector
- Events/Inventory/Options Wiring
- Express App & Middlewares
- Operfoods Front Deps
- Event Analytics & Plan Access
- Menu Onboarding
- Casinos Charts & Stats
- Mailing Campaigns
- API Router Mounting
- Payment & Event Repos
- Operfoods Back Package
- Casinos Clientes/Importar Tabs
- Product Repository
- Inventory Import & Order Repos
- Back TS Config
- Payment Config Repo
- Casinos API Routes & PDFs
- Casinos Admin Panel Shell
- Casinos Excel Importer
- Back ESLint Config
- Operfoods Dashboard Home
- Front TS Config
- Casinos Front TS Config
- Product Controller & Uploads
- Cash Register Service
- Subscription Repository
- Category Controller
- Event & Location Schemas
- Customer Detail Page
- Customers List Page
- POS Active Orders
- Casinos API Client
- Casinos Excel Parser
- Business Repository
- Customer Controller
- Customer Service
- Order Routes & Schemas
- Promotions & Public Menu
- Outlets Page
- Front ApiClient
- Casinos Back Package
- Back Dev Tooling
- Customer Repository
- Inventory Recipe Import
- Inventory Service
- Plans Repository
- User Routes & Demo User
- User Repository
- Public Menu Page
- Casinos Server & Pool
- Back Dependencies
- Cash Register Repository
- Plan Controller
- Product Controller
- Events Page
- Cash Closeout Page
- Active Order Detail
- Business Controller
- Business Service
- Cash Movement Model
- Health Check
- Promotion Service
- User Controller
- POS Checkout Page
- Customer OTP Login
- Locations Module
- Payment Config Controller
- Promotion Routes
- Casinos Monthly Report
- Casinos Toasts
- Migrations & Firebase
- Auth Token Service
- Cash Register Routes
- Inventory Controller
- Order Controller
- Promotion Controller
- Promotion Repository
- Orders List & CSV
- Payment Gateways Page
- Order Row UI
- Event Controller
- Event Service
- Inventory Movements
- Subscription Routes
- Logger Utils
- Casinos Month Picker
- Casinos Back Deps
- Casinos Back Scripts
- Back NPM Scripts
- Env Config & Server
- Cash Register Controller
- Customer Models
- Casinos Backup & Close
- Category Repository
- Inventory Import Service
- Public Controller
- Subscription Controller
- Superadmin Overview
- Casinos Client Report
- Auth Controller
- Product Option Repo
- Event Model
- Front Root Layout
- Next Config
- Tailwind Config
- Casinos PostCSS

## God Nodes (most connected - your core abstractions)
1. `AppError` - 158 edges
2. `UserRole` - 104 edges
3. `sequelize` - 48 edges
4. `sequelize` - 40 edges
5. `readOperatingContext()` - 29 edges
6. `PaymentMethod` - 25 edges
7. `OrderStatus` - 24 edges
8. `AuthRequest` - 24 edges
9. `ProductStatus` - 22 edges
10. `getCachedUser()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Per-casino role login (pending)` --semantically_similar_to--> `business_id from JWT (multi-tenant scoping)`  [INFERRED] [semantically similar]
  README.md → app-backend/ENDPOINTS_VALIDATION.md
- `NEXT_PUBLIC_API_URL (baked at build)` --semantically_similar_to--> `NEXT_PUBLIC_API_URL (default localhost:3001/api)`  [INFERRED] [semantically similar]
  README.md → app-frontend/README.md
- `Dev-only db service (casinos-db-dev)` --semantically_similar_to--> `db service (postgres:16-alpine, casinos-db)`  [INFERRED] [semantically similar]
  casinos-back/docker-compose.yml → docker-compose.yml
- `src/lib/api.ts (Operfoods API client)` --semantically_similar_to--> `lib/api.ts (typed casinos-back client)`  [INFERRED] [semantically similar]
  app-frontend/README.md → casinos-app/casinos-front/README.md
- `Backup endpoints (/backup/dump, /backup/excel)` --references--> `db service (postgres:16-alpine, casinos-db)`  [INFERRED]
  casinos-back/README.md → docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Casinos Docker stack (db + back + front)** — docker_compose_db, docker_compose_back, docker_compose_front, docker_compose_casinos_db_data [EXTRACTED 1.00]
- **Excel import to Power BI / month-end flow** — casinos_back_readme_excel_importer, casinos_back_readme_schema_sql, casinos_back_readme_views_sql, readme_power_bi, casinos_back_readme_cierre_de_mes [EXTRACTED 1.00]
- **Operfoods / Fast Trucks SaaS stack** — app_backend_readme_fast_trucks_backend, app_backend_endpoints_validation_endpoint_catalog, app_frontend_readme_operfoods_admin, app_backend_docker_compose_fast_trucks_back [INFERRED 0.75]

## Communities (125 total, 40 thin omitted)

### Community 0 - "Operfoods Front Auth & Layout"
Cohesion: 0.08
Nodes (44): LoginPage(), AuthGuard(), DashboardLayoutWrapper(), EditorValues, formatDate(), PLAN_LABELS, ProfilePage(), AuthLayout() (+36 more)

### Community 1 - "Docs: Two Systems Overview"
Cohesion: 0.06
Nodes (48): fast_trucks_back container (port 5000), Auth endpoints (/auth/login, /auth/me), Customer OTP auth (/customers/otp), Operfoods endpoint validation catalog, business_id from JWT (multi-tenant scoping), Orders endpoints, Products endpoints, Public endpoints (menu, events, payment-methods) (+40 more)

### Community 2 - "Orders Cost & Repositories"
Cohesion: 0.07
Nodes (25): orderRepository, orderService, OrderSource, EVENT, ONLINE, POS, WHATSAPP, OrderStatus (+17 more)

### Community 3 - "Sequelize Models & Associations"
Cohesion: 0.09
Nodes (33): initializeAssociations(), Business, BusinessAttributes, BusinessCreationAttributes, Category, CategoryAttributes, CategoryCreationAttributes, EventExpense (+25 more)

### Community 4 - "Operfoods Auth Module"
Cohesion: 0.08
Nodes (26): authRepository, BusinessContext, LoginCredentials, LoginResponse, PlanContext, SubscriptionContext, DemoAccountResponse, app_backend_src_shared_database_models_index_location (+18 more)

### Community 5 - "Category/User/Event Services"
Cohesion: 0.08
Nodes (5): categoryService, eventRepository, inventoryRepository, userService, AppError

### Community 6 - "DB Connection & Models"
Cohesion: 0.08
Nodes (28): disconnectDatabase(), sequelize, BusinessOperatingContext, BusinessOperatingContextAttributes, BusinessOperatingContextCreationAttributes, BusinessOperatingMode, InventoryItemAttributes, InventoryItemCreationAttributes (+20 more)

### Community 7 - "POS & Product UI Components"
Cohesion: 0.06
Nodes (17): CustomerStatsProps, Stat, TopVenuesProps, Venue, StatusFilter, StatusFilterCardsProps, Product, ProductRow() (+9 more)

### Community 8 - "Admin Businesses Page"
Cohesion: 0.08
Nodes (27): AdminNegociosPage(), Business, emptyForm, friendlyError(), AdminUsuariosPage(), formatDate(), Promotion, PromotionsPage() (+19 more)

### Community 9 - "Casinos Front Deps"
Cohesion: 0.06
Nodes (34): eslintConfig, dependencies, next, react, react-dom, devDependencies, eslint, eslint-config-next (+26 more)

### Community 10 - "Settings & Business Selector"
Cohesion: 0.11
Nodes (26): Card, SettingsPage(), BusinessSelectionModal(), DashboardLayout(), DashboardLayoutProps, Sidebar(), SidebarProps, Topbar() (+18 more)

### Community 11 - "Events/Inventory/Options Wiring"
Cohesion: 0.12
Nodes (11): productOptionController, router, createProductOptionSchema, productOptionParamsSchema, productParamsSchema, updateProductOptionSchema, productOptionService, UserRole (+3 more)

### Community 12 - "Express App & Middlewares"
Cohesion: 0.15
Nodes (12): createApp(), BusinessIdQueryValue, FileAuthRequest, AuthRequest, extractBusinessId(), authenticateCustomer(), CustomerRequest, TODO: Implementar verificación real del token (+4 more)

### Community 13 - "Operfoods Front Deps"
Cohesion: 0.06
Nodes (31): dependencies, next, react, react-dom, react-toastify, devDependencies, autoprefixer, postcss (+23 more)

### Community 14 - "Event Analytics & Plan Access"
Cohesion: 0.13
Nodes (26): AnalyticsItem, EventsAnalyticsPage(), Expense, formatClp(), formatPct(), Metric(), normalizePayment(), Summary (+18 more)

### Community 15 - "Menu Onboarding"
Cohesion: 0.16
Nodes (22): MenuOnboardingPage(), TabKey, BusinessDto, MenuPage(), MenuProduct, BusinessDto, MenuPreviewPage(), ProductsPage() (+14 more)

### Community 16 - "Casinos Charts & Stats"
Cohesion: 0.14
Nodes (24): BarChart(), BarChartItem, BarChartLegend(), BarChartProps, CASINO_COLOR_VARS, DailyTrendChart(), DailyTrendItem, GRID_STEPS (+16 more)

### Community 17 - "Mailing Campaigns"
Cohesion: 0.09
Nodes (11): mailingController, Campaign, campaigns, CampaignStatus, mailingRepository, SendType, createCampaignSchema, sendMailSchema (+3 more)

### Community 18 - "API Router Mounting"
Cohesion: 0.12
Nodes (17): router, router, upload, router, createCustomerSchema, customerUserParamsSchema, router, router (+9 more)

### Community 19 - "Payment & Event Repos"
Cohesion: 0.11
Nodes (23): PaymentMethod, CARD, CASH, CREDIT_CARD, DEBIT_CARD, TRANSFER, WEBPAY, PaymentStatus (+15 more)

### Community 20 - "Operfoods Back Package"
Cohesion: 0.08
Nodes (25): author, description, dotenv, eslint, express, multer, pg, prettier (+17 more)

### Community 21 - "Casinos Clientes/Importar Tabs"
Cohesion: 0.14
Nodes (17): Props, Confirmacion, Props, FORM_VACIO, FormState, ProductosTab(), eliminar(), eliminarSeleccionados() (+9 more)

### Community 22 - "Product Repository"
Cohesion: 0.17
Nodes (5): productRepository, productService, ProductStatus, ACTIVE, INACTIVE

### Community 23 - "Inventory Import & Order Repos"
Cohesion: 0.22
Nodes (17): RecipeRow, generateRandomCode(), generateUniqueOrderCode(), app_backend_src_shared_database_models_index_category, app_backend_src_shared_database_models_index_event, app_backend_src_shared_database_models_index_inventoryitem, app_backend_src_shared_database_models_index_inventorylocation, app_backend_src_shared_database_models_index_inventorymovement (+9 more)

### Community 24 - "Back TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+13 more)

### Community 25 - "Payment Config Repo"
Cohesion: 0.16
Nodes (11): paymentConfigRepository, paymentConfigService, PaymentEnvironment, PROD, TEST, PaymentProvider, WEBPAY, app_backend_src_shared_database_models_index_paymentconfig (+3 more)

### Community 26 - "Casinos API Routes & PDFs"
Cohesion: 0.10
Nodes (20): c_users_waldo_onedrive_desktop_github_operfoods_casinos_back_src_reports_clientpdf_buildclientepdfbuffer, casinos_back_src_reports_clientpdf, archiver, { buildClientePdfBuffer }, config, dataDir, express, { fetchMonthlyReportData, buildWorkbook } (+12 more)

### Community 27 - "Casinos Admin Panel Shell"
Cohesion: 0.14
Nodes (9): AdminPanel(), TabId, TABS, ClientesTab(), RegistrarVentaTab(), useToast(), Home(), currentYearMonth() (+1 more)

### Community 28 - "Casinos Excel Importer"
Cohesion: 0.18
Nodes (18): { normalizeName }, upsertCasino(), upsertCliente(), upsertProducto(), fs, importDirectory(), importFile(), { normalizeName } (+10 more)

### Community 29 - "Back ESLint Config"
Cohesion: 0.10
Nodes (19): env, es2020, node, extends, prettier, parser, parserOptions, ecmaVersion (+11 more)

### Community 30 - "Operfoods Dashboard Home"
Cohesion: 0.16
Nodes (16): DashboardHomePage(), daysAgo(), endOfDayIso(), formatCurrency(), formatNumber(), Overview, RecentOrderApi, startOfDayIso() (+8 more)

### Community 31 - "Front TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 32 - "Casinos Front TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Product Controller & Uploads"
Cohesion: 0.15
Nodes (14): bucket, FileAuthRequest, router, upload, bulkBase, bulkCreateProductSchema, businessIdsSchema, createProductSchema (+6 more)

### Community 34 - "Cash Register Service"
Cohesion: 0.14
Nodes (3): cashRegisterService, paymentRepository, paymentService

### Community 35 - "Subscription Repository"
Cohesion: 0.18
Nodes (7): subscriptionRepository, subscriptionService, SubscriptionStatus, ACTIVE, CANCELLED, EXPIRED, TRIAL

### Community 36 - "Category Controller"
Cohesion: 0.17
Nodes (6): categoryController, router, bulkCreateCategorySchema, categoryParamsSchema, createCategorySchema, updateCategorySchema

### Community 37 - "Event & Location Schemas"
Cohesion: 0.13
Nodes (11): createEventSchema, createExpenseSchema, dateOnly, dateTime, eventParamsSchema, expenseParamsSchema, locationController, router (+3 more)

### Community 38 - "Customer Detail Page"
Cohesion: 0.15
Nodes (15): CustomerDetailPage(), formatClp(), formatDate(), UiCustomer, UiOrder, Campaign, CampaignForm, CustomerOption (+7 more)

### Community 39 - "Customers List Page"
Cohesion: 0.18
Nodes (13): CustomersPage(), sanitizePhone(), UiCustomer, Customer, CustomerDetail(), CustomerDetailProps, Customer, CustomerRow() (+5 more)

### Community 40 - "POS Active Orders"
Cohesion: 0.17
Nodes (16): countStatuses(), emptyCounts, formatClp(), formatDate(), formatPaymentLabel(), formatSourceLabel(), OperatingContext, PAYMENT_LABELS (+8 more)

### Community 41 - "Casinos API Client"
Cohesion: 0.15
Nodes (13): Props, API_BASE, Casino, Cliente, ClientesNuevosRecurrentes, ClienteVentasMes, CompraDetalle, DashboardCasinoRow (+5 more)

### Community 42 - "Casinos Excel Parser"
Cohesion: 0.25
Nodes (15): detectVentasSheet(), findCell(), isPersonasSheet(), isProductosSheet(), { normalizeName, cleanText, parseMoney, parseSheetDate }, parseClientesSheet(), parseProductosSheet(), parseVentasSheet() (+7 more)

### Community 43 - "Business Repository"
Cohesion: 0.14
Nodes (4): businessRepository, BusinessStatus, ACTIVE, ONBOARDING

### Community 46 - "Order Routes & Schemas"
Cohesion: 0.19
Nodes (12): router, createOrderSchema, customerAddressSchema, customerSchema, dateOrDateTime, orderCloseoutQuerySchema, orderHistoryQuerySchema, orderParamsSchema (+4 more)

### Community 47 - "Promotions & Public Menu"
Cohesion: 0.19
Nodes (12): DiscountType, FIXED, PERCENTAGE, app_backend_src_shared_database_models_index_promotion, app_backend_src_shared_database_models_index_promotionbusiness, app_backend_src_shared_database_models_index_promotionproduct, Promotion, PromotionAttributes (+4 more)

### Community 48 - "Outlets Page"
Cohesion: 0.19
Nodes (11): OutletsPage(), AddOutletCard(), AddOutletCardProps, OutletCard(), OutletCardProps, OutletTabs(), OutletTabsProps, Tab (+3 more)

### Community 50 - "Casinos Back Package"
Cohesion: 0.13
Nodes (14): author, description, dotenv, express, multer, pg, keywords, license (+6 more)

### Community 51 - "Back Dev Tooling"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, eslint-config-prettier, eslint-plugin-prettier, prettier, ts-node-dev, @types/bcrypt, @types/express (+6 more)

### Community 53 - "Inventory Recipe Import"
Cohesion: 0.24
Nodes (11): inventoryImportController, upload, createItemSchema, createMovementSchema, listItemsQuerySchema, paramsIdSchema, paramsMovementSchema, paramsOptionSchema (+3 more)

### Community 54 - "Inventory Service"
Cohesion: 0.15
Nodes (5): inventoryService, InventoryUnit, GRAM, ML, UNIT

### Community 56 - "User Routes & Demo User"
Cohesion: 0.24
Nodes (11): router, router, adminsOwnersQuerySchema, businessParamsSchema, createDemoUserSchema, createUserSchema, updatePasswordSchema, updateSelfSchema (+3 more)

### Community 58 - "Public Menu Page"
Cohesion: 0.21
Nodes (12): buildPublicMenuUrl(), fetchPublicMenu(), PublicMenuPage(), PublicMenuResponse, CartItem, formatClp(), normalizeProducts(), productCategoryName() (+4 more)

### Community 59 - "Casinos Server & Pool"
Cohesion: 0.15
Nodes (11): config, { Pool }, apiRouter, app, config, cors, express, migrate (+3 more)

### Community 60 - "Back Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, bcrypt, dotenv, exceljs, express, firebase-admin, jsonwebtoken, multer (+5 more)

### Community 62 - "Plan Controller"
Cohesion: 0.19
Nodes (7): planController, router, createPlanSchema, nonNegativeNumber, planParamsSchema, positiveInt, updatePlanSchema

### Community 64 - "Events Page"
Cohesion: 0.23
Nodes (12): EVENT_TYPES, EventsPage(), formatDate(), formatDateTime(), formatStatusLabel(), normalizeStatus(), ORGANIZER_ROLES, STATUS_LABELS (+4 more)

### Community 65 - "Cash Closeout Page"
Cohesion: 0.26
Nodes (12): Closeout, endOfDayIso(), formatClp(), formatRegisterStatus(), OperatingContext, PaymentCard(), PosCierreCajaPage(), readOperatingContext() (+4 more)

### Community 66 - "Active Order Detail"
Cohesion: 0.23
Nodes (12): formatClp(), formatDate(), formatPaymentLabel(), formatSourceLabel(), mapOrder(), PedidoDetallePage(), sanitizePhone(), STATUS_OPTIONS (+4 more)

### Community 69 - "Cash Movement Model"
Cohesion: 0.20
Nodes (9): CashMovement, CashMovementAttributes, CashMovementCreationAttributes, CashRegister, CashRegisterAttributes, CashRegisterCreationAttributes, CashRegisterStatus, app_backend_src_shared_database_models_index_cashmovement (+1 more)

### Community 70 - "Health Check"
Cohesion: 0.30
Nodes (4): healthController, healthRepository, router, healthService

### Community 73 - "POS Checkout Page"
Cohesion: 0.21
Nodes (10): CartItem, CustomerForm(), CustomerFormProps, OperatingContext, PosPage(), readOperatingContext(), UiProduct, config (+2 more)

### Community 74 - "Customer OTP Login"
Cohesion: 0.29
Nodes (5): otpService, app_backend_src_shared_database_models_index_otp, generateOtp(), getOtpExpiration(), isOtpExpired()

### Community 76 - "Payment Config Controller"
Cohesion: 0.25
Nodes (5): paymentConfigController, router, createPaymentConfigSchema, paymentConfigParamsSchema, authorize()

### Community 77 - "Promotion Routes"
Cohesion: 0.31
Nodes (7): router, addProductsToPromotionSchema, createPromotionSchema, promotionParamsSchema, removeProductsFromPromotionSchema, togglePromotionStatusSchema, updatePromotionSchema

### Community 78 - "Casinos Monthly Report"
Cohesion: 0.18
Nodes (9): c_users_waldo_onedrive_desktop_github_operfoods_casinos_back_src_reports_monthlyreport_buildworkbook, c_users_waldo_onedrive_desktop_github_operfoods_casinos_back_src_reports_monthlyreport_fetchmonthlyreportdata, casinos_back_src_reports_monthlyreport, { fetchMonthlyReportData, buildWorkbook }, fs, path, pool, XLSX (+1 more)

### Community 79 - "Casinos Toasts"
Cohesion: 0.22
Nodes (9): ACCENT, ToastContext, ToastContextValue, ToastItem, ToastProvider(), ToastType, casinos_app_casinos_front_app_globals, metadata (+1 more)

### Community 80 - "Migrations & Firebase"
Cohesion: 0.20
Nodes (7): serviceAccount, fs, path, pool, firebase-admin, ref_fs, ref_path

### Community 82 - "Cash Register Routes"
Cohesion: 0.29
Nodes (8): router, closeRegisterSchema, historyQuerySchema, movementSchema, openRegisterSchema, positiveId, statusEnum, validateQuery()

### Community 87 - "Orders List & CSV"
Cohesion: 0.31
Nodes (9): ContextFilter, csvEscape(), formatClp(), formatDate(), formatInputDateTimeLocal(), OrdersPage(), STATUS_OPTIONS, todayRangeLocal() (+1 more)

### Community 88 - "Payment Gateways Page"
Cohesion: 0.29
Nodes (7): PaymentsPage(), Gateway, GatewayCard(), GatewayCardProps, PaymentMethod, PaymentMethodsToggle(), PaymentMethodsToggleProps

### Community 89 - "Order Row UI"
Cohesion: 0.27
Nodes (8): Order, OrderRow(), OrderRowProps, statusOptions, uiToApiStatus(), Order, OrderTable(), OrderTableProps

### Community 92 - "Inventory Movements"
Cohesion: 0.31
Nodes (7): InventoryMovementType, ADJUST, IN, OUT, InventoryMovement, InventoryMovementAttributes, InventoryMovementCreationAttributes

### Community 93 - "Subscription Routes"
Cohesion: 0.36
Nodes (7): router, createSubscriptionPaymentSchema, createSubscriptionSchema, dateTime, subscriptionParamsSchema, subscriptionQuerySchema, updateSubscriptionSchema

### Community 95 - "Casinos Month Picker"
Cohesion: 0.25
Nodes (4): CalendarIcon(), MESES, MonthPicker(), Props

### Community 96 - "Casinos Back Deps"
Cohesion: 0.22
Nodes (9): dependencies, archiver, cors, dotenv, express, multer, pdfkit, pg (+1 more)

### Community 97 - "Casinos Back Scripts"
Cohesion: 0.22
Nodes (9): scripts, db:down, db:up, dev, import, migrate, report:mensual, start (+1 more)

### Community 98 - "Back NPM Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, format:check, lint, lint:fix, start

### Community 99 - "Env Config & Server"
Cohesion: 0.32
Nodes (5): env, EnvConfig, startServer(), connectDatabase(), ref_dotenv

### Community 101 - "Customer Models"
Cohesion: 0.29
Nodes (6): Customer, CustomerAttributes, CustomerCreationAttributes, CustomerAddress, CustomerAddressAttributes, CustomerAddressCreationAttributes

### Community 102 - "Casinos Backup & Close"
Cohesion: 0.29
Nodes (3): ImportarTab(), onArchivoElegido(), subirArchivo()

### Community 104 - "Inventory Import Service"
Cohesion: 0.29
Nodes (4): inventoryImportRepository, ImportRow, inventoryImportService, exceljs

### Community 107 - "Superadmin Overview"
Cohesion: 0.40
Nodes (5): AdminOverviewPage(), EstadoBadge(), EstadoColor, eventos, kpis

### Community 108 - "Casinos Client Report"
Cohesion: 0.67
Nodes (4): ReporteClienteContent(), ReporteClientePage(), formatMonthLabel(), formatNumber()

### Community 111 - "Event Model"
Cohesion: 0.67
Nodes (3): Event, EventAttributes, EventCreationAttributes

## Ambiguous Edges - Review These
- `back service (casinos-back, port 5000)` → `fast_trucks_back container (port 5000)`  [AMBIGUOUS]
  app-backend/docker-compose.yml · relation: conceptually_related_to
- `fast_trucks_back container (port 5000)` → `NEXT_PUBLIC_API_URL (default localhost:3001/api)`  [AMBIGUOUS]
  app-frontend/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **557 isolated node(s):** `parser`, `ecmaVersion`, `sourceType`, `project`, `eslint:recommended` (+552 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 801 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `back service (casinos-back, port 5000)` and `fast_trucks_back container (port 5000)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `fast_trucks_back container (port 5000)` and `NEXT_PUBLIC_API_URL (default localhost:3001/api)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `AppError` connect `Category/User/Event Services` to `Orders Cost & Repositories`, `Sequelize Models & Associations`, `Operfoods Auth Module`, `Events/Inventory/Options Wiring`, `Express App & Middlewares`, `API Router Mounting`, `Payment & Event Repos`, `Product Repository`, `Inventory Import & Order Repos`, `Payment Config Repo`, `Cash Register Service`, `Subscription Repository`, `Business Repository`, `Customer Service`, `Promotions & Public Menu`, `Customer Repository`, `Plans Repository`, `User Repository`, `Cash Register Repository`, `Business Controller`, `Business Service`, `Cash Movement Model`, `Promotion Service`, `Locations Module`, `Payment Config Controller`, `Auth Token Service`, `Promotion Repository`, `Event Service`, `Category Repository`, `Public Controller`, `Product Option Repo`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `UserRole` connect `Events/Inventory/Options Wiring` to `Orders Cost & Repositories`, `Sequelize Models & Associations`, `Operfoods Auth Module`, `Category/User/Event Services`, `Express App & Middlewares`, `API Router Mounting`, `Product Repository`, `Payment Config Repo`, `Product Controller & Uploads`, `Cash Register Service`, `Subscription Repository`, `Category Controller`, `Event & Location Schemas`, `Customer Service`, `Order Routes & Schemas`, `Inventory Recipe Import`, `Plans Repository`, `User Routes & Demo User`, `User Repository`, `Plan Controller`, `Business Service`, `Promotion Service`, `Locations Module`, `Payment Config Controller`, `Promotion Routes`, `Cash Register Routes`, `Event Service`, `Subscription Routes`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `sequelize` connect `DB Connection & Models` to `Orders Cost & Repositories`, `Sequelize Models & Associations`, `Operfoods Auth Module`, `Cash Movement Model`, `Customer Models`, `Customer OTP Login`, `Promotions & Public Menu`, `Event Model`, `Payment & Event Repos`, `Operfoods Back Package`, `Inventory Import & Order Repos`, `Payment Config Repo`, `Inventory Movements`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `parser`, `ecmaVersion`, `sourceType` to the rest of the system?**
  _557 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Operfoods Front Auth & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.08490566037735849 - nodes in this community are weakly interconnected._