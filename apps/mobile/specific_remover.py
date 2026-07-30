import os

def remove_line(path, line_number):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    if 0 <= line_number - 1 < len(lines):
        # Comment out the specific line
        lines[line_number - 1] = "// " + lines[line_number - 1]
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
# from task-517.log:
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\core\widgets\filter_sidebar.dart", 575)
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\core\widgets\loading_skeleton.dart", 338)
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\finance\presentation\pages\journal_entry_detail_page.dart", 131)
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\attendance_form_page.dart", 180)
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\attendance_form_page.dart", 189)
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\leave_type_form_page.dart", 206)
remove_line(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\inventory\presentation\pages\product_category_detail_page.dart", 38)
