import os

log_path = r"C:\Users\kanna\.gemini\antigravity-ide\brain\72ee2c30-39fa-4f9a-8a56-a0b1b811163d\.system_generated\tasks\task-517.log"
router_path = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\app\router\app_router.dart"

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

errors = []
for line in lines:
    if " error - " in line and "lib\\app\\router\\app_router.dart" in line:
        errors.append(line.strip())

with open(router_path, 'r', encoding='utf-8') as f:
    router_lines = f.readlines()

skip_next = False
for i in range(len(errors)):
    if skip_next:
        skip_next = False
        continue
        
    e1 = errors[i]
    e2 = errors[i+1] if i + 1 < len(errors) else ""
    
    if "missing_required_argument" in e1 and "undefined_named_parameter" in e2:
        # Paired errors
        line_num1 = int(e1.split("app_router.dart:")[1].split(":")[0])
        line_num2 = int(e2.split("app_router.dart:")[1].split(":")[0])
        
        if line_num1 == line_num2 - 1 or line_num1 == line_num2:
            req_param = e1.split("The named parameter '")[1].split("'")[0]
            wrong_param = e2.split("The named parameter '")[1].split("'")[0]
            
            line_idx = line_num2 - 1
            router_lines[line_idx] = router_lines[line_idx].replace(f"{wrong_param}:", f"{req_param}:")
            print(f"Fixed paired line {line_num2}: {wrong_param} -> {req_param}")
            skip_next = True
            continue
            
    if "undefined_named_parameter" in e1:
        # Isolated wrong parameter, likely should be id
        wrong_param = e1.split("The named parameter '")[1].split("'")[0]
        line_num = int(e1.split("app_router.dart:")[1].split(":")[0])
        line_idx = line_num - 1
        router_lines[line_idx] = router_lines[line_idx].replace(f"{wrong_param}:", "id:")
        print(f"Fixed isolated line {line_num}: {wrong_param} -> id")

# Fix missing class / imports
for i in range(len(router_lines)):
    if "const ReportTemplateListPage()" in router_lines[i] and "TemplateListPage" not in router_lines[i]:
        pass # Not needed
    if "sub_plan_detail.PlanDetailPage" in router_lines[i]:
        pass

# Fix routeName for SaasPlanDetailPage
saas_path = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\saas\presentation\pages\saas_plan_detail_page.dart"
if os.path.exists(saas_path):
    with open(saas_path, "r", encoding="utf-8") as f:
        c = f.read()
    if "static const String routeName" not in c:
        c = c.replace("class SaasPlanDetailPage extends ConsumerStatefulWidget {", 
                      "class SaasPlanDetailPage extends ConsumerStatefulWidget {\n  static const String routeName = 'saas-plan-detail';\n  static const String routePath = '/saas/plans/:id';")
        with open(saas_path, "w", encoding="utf-8") as f:
            f.write(c)

with open(router_path, 'w', encoding='utf-8') as f:
    f.writelines(router_lines)

print("Auto fix complete!")
