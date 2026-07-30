import os, re

target = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\app\router\app_router.dart"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    'mrpRunId', 'workstationId', 'routingId', 'qualityInspectionId', 'ecoId'
]
for r in replacements:
    content = re.sub(rf'\b{r}:\s*(state\.pathParameters)', r'id: \1', content)

content = content.replace("EngineeringChangeOrderListPage", "EcoListPage")
content = content.replace("EngineeringChangeOrderDetailPage", "EcoDetailPage")
content = content.replace("EngineeringChangeOrderFormPage", "EcoFormPage")

content = content.replace("builder: (_, GoRouterState state) => PayrollEntryListPage(\n                          id: state.pathParameters['runId']!,", 
"builder: (_, GoRouterState state) => PayrollEntryListPage(\n                          payrollRunId: state.pathParameters['runId']!,")
content = content.replace("builder: (_, GoRouterState state) => PayrollEntryListPage(\r\n                          id: state.pathParameters['runId']!,", 
"builder: (_, GoRouterState state) => PayrollEntryListPage(\r\n                          payrollRunId: state.pathParameters['runId']!,")


with open(target, "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced app_router.dart arguments")

pages = [
    ("mrp_run_list_page.dart", "MrpRunListPage", "mrp-runs", "/manufacturing/mrp-runs"),
    ("mrp_run_detail_page.dart", "MrpRunDetailPage", "mrp-run-detail", "/manufacturing/mrp-runs/:id"),
    ("mrp_run_form_page.dart", "MrpRunFormPage", "mrp-run-form", "/manufacturing/mrp-runs/new"),
    ("workstation_list_page.dart", "WorkstationListPage", "workstations", "/manufacturing/workstations"),
    ("workstation_detail_page.dart", "WorkstationDetailPage", "workstation-detail", "/manufacturing/workstations/:id"),
    ("workstation_form_page.dart", "WorkstationFormPage", "workstation-form", "/manufacturing/workstations/new"),
    ("routing_list_page.dart", "RoutingListPage", "routings", "/manufacturing/routings"),
    ("routing_detail_page.dart", "RoutingDetailPage", "routing-detail", "/manufacturing/routings/:id"),
    ("routing_form_page.dart", "RoutingFormPage", "routing-form", "/manufacturing/routings/new"),
    ("quality_inspection_list_page.dart", "QualityInspectionListPage", "quality-inspections", "/manufacturing/quality-inspections"),
    ("quality_inspection_detail_page.dart", "QualityInspectionDetailPage", "quality-inspection-detail", "/manufacturing/quality-inspections/:id"),
    ("quality_inspection_form_page.dart", "QualityInspectionFormPage", "quality-inspection-form", "/manufacturing/quality-inspections/new"),
    ("eco_list_page.dart", "EcoListPage", "ecos", "/manufacturing/ecos"),
    ("eco_detail_page.dart", "EcoDetailPage", "eco-detail", "/manufacturing/ecos/:id"),
    ("eco_form_page.dart", "EcoFormPage", "eco-form", "/manufacturing/ecos/new"),
]
base_dir_mfg = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\manufacturing\presentation\pages"

for file_name, class_name, route_name, route_path in pages:
    path = os.path.join(base_dir_mfg, file_name)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        insertion = f"  static const String routeName = '{route_name}';\n  static const String routePath = '{route_path}';\n"
        if "static const String routeName" not in content:
            if "  @override\n  Widget build" in content:
                content = content.replace("  @override\n  Widget build", insertion + "  @override\n  Widget build")
            elif "  @override\r\n  Widget build" in content:
                content = content.replace("  @override\r\n  Widget build", insertion + "  @override\r\n  Widget build")
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

pos_path = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\pos\presentation\pages\pos_discount_form_page.dart"
if os.path.exists(pos_path):
    with open(pos_path, "r", encoding="utf-8") as f:
        content = f.read()
    insertion = f"  static const String routeName = 'pos-discount-form';\n  static const String routePath = '/pos/discounts/new';\n"
    if "static const String routeName" not in content:
        if "  @override\n  Widget build" in content:
            content = content.replace("  @override\n  Widget build", insertion + "  @override\n  Widget build")
        elif "  @override\r\n  Widget build" in content:
            content = content.replace("  @override\r\n  Widget build", insertion + "  @override\r\n  Widget build")
        with open(pos_path, "w", encoding="utf-8") as f:
            f.write(content)
print("Finished fixes")
