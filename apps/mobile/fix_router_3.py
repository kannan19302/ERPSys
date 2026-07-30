import os, re

target = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\app\router\app_router.dart"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    'workflowId', 'approvalId', 'viewId', 'channelId', 'orderId',
    'settingKey', 'logId', 'keyId', 'timesheetId'
]
for r in replacements:
    content = re.sub(rf'\b{r}:\s*(state\.pathParameters)', r'id: \1', content)

content = content.replace("proj_ts::", "proj_ts.")
content = content.replace("proj_ts_det::", "proj_ts_det.")
content = content.replace("proj_ts_form::", "proj_ts_form.")

content = content.replace("DocumentTemplateListPage", "TemplateListPage")
content = content.replace("ReportTemplateDetailPage", "TemplateDetailPage")
content = content.replace("AiPromptDetailPage", "PromptDetailPage")
content = content.replace("AiTrainingDataDetailPage", "TrainingDataDetailPage")

content = re.sub(r"import\s+'[^']*/marketplace_submission_list_page\.dart';\r?\n", "", content)

with open(target, "w", encoding="utf-8") as f:
    f.write(content)

ecom_path = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\ecommerce\presentation\pages\ecommerce_category_form_page.dart"
if os.path.exists(ecom_path):
    with open(ecom_path, "r", encoding="utf-8") as f:
        content = f.read()
    insertion = f"  static const String routeName = 'ecommerce-category-form';\n  static const String routePath = '/ecommerce/categories/new';\n"
    if "static const String routeName" not in content:
        content = content.replace("  @override\n  Widget build", insertion + "  @override\n  Widget build")
        content = content.replace("  @override\r\n  Widget build", insertion + "  @override\r\n  Widget build")
        with open(ecom_path, "w", encoding="utf-8") as f:
            f.write(content)

print("Done")
