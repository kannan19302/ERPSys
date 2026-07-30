import os, re

target = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\app\router\app_router.dart"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

# Fix syntax errors with hr_ts::
content = content.replace("hr_ts::", "hr_ts.")
content = content.replace("hr_ts_det::", "hr_ts_det.")
content = content.replace("hr_ts_form::", "hr_ts_form.")

# Fix remaining arguments
replacements = {
    r"PerformanceReviewDetailPage\(\s*(?:id|reviewId):\s*(state\.pathParameters\['[^']+']!\s*),?": r"PerformanceReviewDetailPage(\n                          performanceReviewId: \1,",
    r"PayrollEntryListPage\(\s*(?:id|runId):\s*(state\.pathParameters\['[^']+']!\s*),?": r"PayrollEntryListPage(\n                          payrollRunId: \1,",
    r"TimesheetDetailPage\(\s*id:\s*(state\.pathParameters\['[^']+']!\s*),?": r"TimesheetDetailPage(\n                          timesheetId: \1,",
    r"TemplateDetailPage\(\s*id:\s*(state\.pathParameters\['[^']+']!\s*),?": r"TemplateDetailPage(\n                          templateId: \1,",
    r"ChannelDetailPage\(\s*id:\s*(state\.pathParameters\['[^']+']!\s*),?": r"ChannelDetailPage(\n                          channelId: \1,",
    r"SystemSettingFormPage\(\s*id:\s*(state\.pathParameters\['[^']+']!\s*),?": r"SystemSettingFormPage(\n                          settingKey: \1,"
}

for pattern, repl in replacements.items():
    content = re.sub(pattern, repl, content)

# Fix class names
content = content.replace("const TemplateListPage()", "const ReportTemplateListPage()")
content = content.replace("TemplateListPage.routeName", "ReportTemplateListPage.routeName")
content = content.replace("sub_plan_detail.SubscriptionPlanDetailPage", "sub_plan_detail.PlanDetailPage")

# Add missing import for SubscriptionPlanFormPage
if "plan_form_page.dart" not in content:
    content = content.replace("import '../../features/subscriptions/presentation/pages/billing_form_page.dart';",
        "import '../../features/subscriptions/presentation/pages/billing_form_page.dart';\nimport '../../features/subscriptions/presentation/pages/plan_form_page.dart';")

with open(target, "w", encoding="utf-8") as f:
    f.write(content)

# Fix missing routeName
def add_route(path, route_name, route_path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            c = f.read()
        insertion = f"  static const String routeName = '{route_name}';\n  static const String routePath = '{route_path}';\n"
        if "static const String routeName" not in c:
            c = c.replace("  @override\n  Widget build", insertion + "  @override\n  Widget build")
            c = c.replace("  @override\r\n  Widget build", insertion + "  @override\r\n  Widget build")
            with open(path, "w", encoding="utf-8") as f:
                f.write(c)

add_route(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\ecommerce\presentation\pages\ecommerce_category_form_page.dart", "ecommerce-category-form", "/ecommerce/categories/new")
