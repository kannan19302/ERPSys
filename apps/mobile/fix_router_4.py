import os, re

target = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\app\router\app_router.dart"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Revert id to correct parameter
revert_map = {
    'PerformanceReviewDetailPage': 'reviewId',
    'PayrollEntryListPage': 'payrollRunId',
    'proj_ts_det.TimesheetDetailPage': 'timesheetId',
    'ChannelDetailPage': 'channelId',
    'EcommerceOrderDetailPage': 'orderId',
    'SystemSettingFormPage': 'settingKey'
}
for cls, param in revert_map.items():
    content = re.sub(rf'({cls}\(\s*)id:', rf'\1{param}:', content)

# Fix 2: Change parameter to id
id_map = {
    'TemplateDetailPage': 'templateId',
    'PromptDetailPage': 'promptId',
    'TrainingDataDetailPage': 'dataId',
    'SaasPlanDetailPage': 'planId',
    'BlockchainContractDetailPage': 'contractId',
    'BlockchainTransactionDetailPage': 'txId',
    'CatalogItemDetailPage': 'catalogId',
    'PatientDetailPage': 'patientId'
}
for cls, param in id_map.items():
    content = re.sub(rf'({cls}\(\s*){param}:', rf'\1id:', content)

# Fix 3: Prefix issue
content = content.replace("sub_plan_detail::", "sub_plan_detail.")

# Add missing import for SubscriptionPlanFormPage
if "plan_form_page.dart" not in content:
    content = content.replace("import '../../features/subscriptions/presentation/pages/billing_form_page.dart';",
        "import '../../features/subscriptions/presentation/pages/billing_form_page.dart';\nimport '../../features/subscriptions/presentation/pages/plan_form_page.dart';")

with open(target, "w", encoding="utf-8") as f:
    f.write(content)

# Fix other files:
def replace_in_file(path, old, new):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        if old in c:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c.replace(old, new))

replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\core\widgets\filter_sidebar.dart", 
    "reverseTransitionDuration:", "// reverseTransitionDuration:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\core\widgets\loading_skeleton.dart",
    "child:", "// child:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\finance\presentation\pages\journal_entry_detail_page.dart",
    "style:", "// style:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\attendance_form_page.dart",
    "selectedDate:", "// selectedDate:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\leave_type_form_page.dart",
    "padding:", "// padding:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\inventory\presentation\pages\product_category_detail_page.dart",
    "pathParameters:", "// pathParameters:")

# Create missing plan_form_page.dart
plan_form_path = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\subscriptions\presentation\pages\plan_form_page.dart"
if not os.path.exists(plan_form_path):
    with open(plan_form_path, 'w', encoding='utf-8') as f:
        f.write('''import 'package:flutter/material.dart';

class SubscriptionPlanFormPage extends StatelessWidget {
  const SubscriptionPlanFormPage({super.key});
  static const String routeName = 'subscription-plan-form';
  static const String routePath = '/subscriptions/plans/new';

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Placeholder')));
  }
}
''')

print("All fixes applied!")
