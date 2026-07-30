import os
import re

missing_files = [
    "field_service/presentation/pages/schedule_form_page.dart",
    "field_service/presentation/pages/technician_form_page.dart",
    "field_service/presentation/pages/ticket_form_page.dart",
    "fixed_assets/presentation/pages/asset_form_page.dart",
    "fixed_assets/presentation/pages/disposal_form_page.dart",
    "fixed_assets/presentation/pages/maintenance_form_page.dart",
    "healthcare/presentation/pages/lab_order_form_page.dart",
    "healthcare/presentation/pages/patient_form_page.dart",
    "healthcare/presentation/pages/prescription_detail_page.dart",
    "healthcare/presentation/pages/prescription_form_page.dart",
    "saas_portal/presentation/pages/saas_portal_plan_detail_page.dart",
    "saas_portal/presentation/pages/saas_portal_support_ticket_detail_page.dart",
    "saas_portal/presentation/pages/saas_portal_support_ticket_form_page.dart"
]

def to_camel_case(snake_str):
    components = snake_str.split('_')
    return "".join(x.title() for x in components)

router_path = "lib/app/router/app_router.dart"

with open(router_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
imports_to_add = []
for file in missing_files:
    imports_to_add.append(f"import '../../features/{file}';")

import_block = "\n".join(imports_to_add)

# Find last import
last_import_idx = content.rfind("import ")
end_of_last_import = content.find("\n", last_import_idx)

content = content[:end_of_last_import] + "\n" + import_block + content[end_of_last_import:]

# 2. Add routes
routes_to_add = []
for file in missing_files:
    basename = file.split('/')[-1].replace('.dart', '')
    class_name = to_camel_case(basename)
    # Ex: ScheduleFormPage
    routes_to_add.append(f"""
      GoRoute(
        path: {class_name}.routePath,
        name: {class_name}.routeName,
        builder: (_, __) => const {class_name}(),
      ),""")

route_block = "".join(routes_to_add)

# Add them right before the closing of main routes list which is before StatefulShellRoute
# Wait, let's just append to the very end of the file where the main routes might end?
# Actually, the router might end with something else.
# Let's find: StatefulShellRoute.indexedStack
idx = content.find("StatefulShellRoute.indexedStack")
if idx != -1:
    content = content[:idx] + route_block.strip("\n") + "\n      " + content[idx:]
else:
    print("Could not find StatefulShellRoute.indexedStack")

with open(router_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Router updated!")
