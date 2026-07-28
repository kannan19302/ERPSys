import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/entities/session.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/mfa_challenge_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/auth/presentation/pages/verify_email_pending_page.dart';
import '../../features/auth/presentation/providers/auth_providers.dart';
import '../../features/auth/presentation/providers/auth_state.dart';
import '../../features/crm/presentation/pages/customer_detail_page.dart';
import '../../features/crm/presentation/pages/customer_list_page.dart';
import '../../features/crm/presentation/pages/lead_list_page.dart';
import '../../features/finance/presentation/pages/invoice_detail_page.dart';
import '../../features/finance/presentation/pages/invoice_list_page.dart';
import '../../features/finance/presentation/pages/payment_list_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/hr/presentation/pages/employee_detail_page.dart';
import '../../features/hr/presentation/pages/employee_list_page.dart';
import '../../features/hr/presentation/pages/leave_request_list_page.dart';
import '../../features/inventory/presentation/pages/product_detail_page.dart';
import '../../features/inventory/presentation/pages/product_list_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_detail_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_list_page.dart';
import '../../features/procurement/presentation/pages/vendor_list_page.dart';
import '../../features/sales/presentation/pages/quotation_detail_page.dart';
import '../../features/sales/presentation/pages/quotation_list_page.dart';
import '../../features/sales/presentation/pages/sales_order_detail_page.dart';
import '../../features/sales/presentation/pages/sales_order_list_page.dart';
import '../../features/supply_chain/presentation/pages/shipment_list_page.dart';
import '../../features/pos/presentation/pages/pos_order_list_page.dart';
import '../../features/manufacturing/presentation/pages/work_order_list_page.dart';
import '../../features/projects/presentation/pages/project_list_page.dart';
import '../../features/documents/presentation/pages/documents_list_page.dart';
import '../../features/workflow/presentation/pages/workflow_list_page.dart';
import '../shell/app_shell.dart';

final Provider<GoRouter> appRouterProvider = Provider<GoRouter>((Ref ref) {
  final GoRouter router = GoRouter(
    initialLocation: HomePage.routePath,
    refreshListenable: _AuthRefreshListenable(ref),
    redirect: (BuildContext context, GoRouterState state) {
      final AuthState auth = ref.read(authControllerProvider);
      final String location = state.matchedLocation;

      final bool onSplash = location == '/splash';
      final bool onLogin = location == LoginPage.routePath;
      final bool onMfa = location == MfaChallengePage.routePath;
      final bool onRegister = location == RegisterPage.routePath;
      final bool onVerifyPending = location == VerifyEmailPendingPage.routePath;

      if (auth.status == AuthStatus.initialising) {
        return onSplash ? null : '/splash';
      }
      if (auth.status == AuthStatus.mfaRequired) {
        return onMfa ? null : MfaChallengePage.routePath;
      }
      if (!auth.isAuthenticated) {
        if (onLogin || onRegister || onVerifyPending) return null;
        return LoginPage.routePath;
      }
      if (onLogin || onMfa || onSplash || onRegister || onVerifyPending) {
        return HomePage.routePath;
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/splash', builder: (_, __) => const SplashPage()),
      GoRoute(
        path: LoginPage.routePath,
        name: LoginPage.routeName,
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: RegisterPage.routePath,
        name: RegisterPage.routeName,
        builder: (_, __) => const RegisterPage(),
      ),
      GoRoute(
        path: VerifyEmailPendingPage.routePath,
        name: VerifyEmailPendingPage.routeName,
        redirect: (_, GoRouterState state) =>
            state.extra is RegisteredAccount ? null : LoginPage.routePath,
        builder: (_, GoRouterState state) => VerifyEmailPendingPage(
          account: state.extra! as RegisteredAccount,
        ),
      ),
      GoRoute(
        path: MfaChallengePage.routePath,
        name: MfaChallengePage.routeName,
        builder: (_, __) => const MfaChallengePage(),
      ),
      GoRoute(
        path: OnboardingPage.routePath,
        name: OnboardingPage.routeName,
        builder: (_, __) => const OnboardingPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, StatefulNavigationShell shell) =>
            AppShell(navigationShell: shell),
        branches: <StatefulShellBranch>[
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: HomePage.routePath,
                name: HomePage.routeName,
                builder: (_, __) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ProductListPage.routePath,
                name: ProductListPage.routeName,
                builder: (_, __) => const ProductListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: ProductDetailPage.routeName,
                    builder: (_, GoRouterState state) => ProductDetailPage(
                      productId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: QuotationListPage.routePath,
                name: QuotationListPage.routeName,
                builder: (_, __) => const QuotationListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'quotation/:id',
                    name: QuotationDetailPage.routeName,
                    builder: (_, GoRouterState state) => QuotationDetailPage(
                      quotationId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'orders',
                    name: SalesOrderListPage.routeName,
                    builder: (_, __) => const SalesOrderListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'order/:id',
                        name: SalesOrderDetailPage.routeName,
                        builder: (_, GoRouterState state) => SalesOrderDetailPage(
                          orderId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'customers',
                    name: CustomerListPage.routeName,
                    builder: (_, __) => const CustomerListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: CustomerDetailPage.routeName,
                        builder: (_, GoRouterState state) => CustomerDetailPage(
                          customerId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'leads',
                    name: LeadListPage.routeName,
                    builder: (_, __) => const LeadListPage(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: InvoiceListPage.routePath,
                name: InvoiceListPage.routeName,
                builder: (_, __) => const InvoiceListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: InvoiceDetailPage.routeName,
                    builder: (_, GoRouterState state) => InvoiceDetailPage(
                      invoiceId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'payments',
                    name: PaymentListPage.routeName,
                    builder: (_, __) => const PaymentListPage(),
                  ),
                  GoRoute(
                    path: 'purchase-orders',
                    name: PurchaseOrderListPage.routeName,
                    builder: (_, __) => const PurchaseOrderListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PurchaseOrderDetailPage.routeName,
                        builder: (_, GoRouterState state) => PurchaseOrderDetailPage(
                          poId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'vendors',
                    name: VendorListPage.routeName,
                    builder: (_, __) => const VendorListPage(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: EmployeeListPage.routePath,
                name: EmployeeListPage.routeName,
                builder: (_, __) => const EmployeeListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: EmployeeDetailPage.routeName,
                    builder: (_, GoRouterState state) => EmployeeDetailPage(
                      employeeId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'leave',
                    name: LeaveRequestListPage.routeName,
                    builder: (_, __) => const LeaveRequestListPage(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: NotificationsPage.routePath,
                name: NotificationsPage.routeName,
                builder: (_, __) => const NotificationsPage(),
              ),
            ],
          ),
          // ── Supply Chain ──────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ShipmentListPage.routePath,
                name: ShipmentListPage.routeName,
                builder: (_, __) => const ShipmentListPage(),
              ),
            ],
          ),
          // ── POS ───────────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: PosOrderListPage.routePath,
                name: PosOrderListPage.routeName,
                builder: (_, __) => const PosOrderListPage(),
              ),
            ],
          ),
          // ── Manufacturing ─────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: WorkOrderListPage.routePath,
                name: WorkOrderListPage.routeName,
                builder: (_, __) => const WorkOrderListPage(),
              ),
            ],
          ),
          // ── Projects ──────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ProjectListPage.routePath,
                name: ProjectListPage.routeName,
                builder: (_, __) => const ProjectListPage(),
              ),
            ],
          ),
          // ── Documents ─────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: DocumentsListPage.routePath,
                name: DocumentsListPage.routeName,
                builder: (_, __) => const DocumentsListPage(),
              ),
            ],
          ),
          // ── Communication & Workflow ──────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/workflow/workflows',
                name: WorkflowListPage.routeName,
                builder: (_, __) => const WorkflowListPage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});

class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Ref ref) {
    ref.listen<AuthState>(
      authControllerProvider,
      (AuthState? previous, AuthState next) {
        if (previous?.status != next.status) notifyListeners();
      },
    );
  }
}
