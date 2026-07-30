import os, re

target = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\app\router\app_router.dart"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    'runId', 'orderId', 'registerId', 'shiftId', 'priceListId', 
    'discountId', 'couponId', 'cardId', 'programId', 'memberId', 
    'workOrderId', 'bomId'
]

for r in replacements:
    content = re.sub(rf'\b{r}:\s*(state\.pathParameters)', r'id: \1', content)

with open(target, "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced app_router.dart arguments")

pages = [
    ("manufacturing_dashboard_page.dart", "ManufacturingDashboardPage", "manufacturing", "/manufacturing"),
    ("work_order_list_page.dart", "WorkOrderListPage", "work-orders", "/manufacturing/work-orders"),
    ("work_order_detail_page.dart", "WorkOrderDetailPage", "work-order-detail", "/manufacturing/work-orders/:id"),
    ("work_order_form_page.dart", "WorkOrderFormPage", "work-order-form", "/manufacturing/work-orders/new"),
    ("bom_list_page.dart", "BomListPage", "boms", "/manufacturing/boms"),
    ("bom_detail_page.dart", "BomDetailPage", "bom-detail", "/manufacturing/boms/:id"),
    ("bom_form_page.dart", "BomFormPage", "bom-form", "/manufacturing/boms/new"),
]
base_dir = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\manufacturing\presentation\pages"

for file_name, class_name, route_name, route_path in pages:
    path = os.path.join(base_dir, file_name)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Insert before @override Widget build
        insertion = f"  static const String routeName = '{route_name}';\n  static const String routePath = '{route_path}';\n"
        if "static const String routeName" not in content:
            if "  @override\n  Widget build" in content:
                content = content.replace("  @override\n  Widget build", insertion + "  @override\n  Widget build")
            elif "  @override\r\n  Widget build" in content:
                content = content.replace("  @override\r\n  Widget build", insertion + "  @override\r\n  Widget build")
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Fixed {file_name}")
