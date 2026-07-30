import os

def replace_in_file(path, old, new):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        if old in c:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c.replace(old, new))

replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\core\widgets\filter_sidebar.dart", 
    "// reverseTransitionDuration:", "reverseTransitionDuration:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\core\widgets\loading_skeleton.dart",
    "// child:", "child:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\finance\presentation\pages\journal_entry_detail_page.dart",
    "// style:", "style:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\attendance_form_page.dart",
    "// selectedDate:", "selectedDate:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\hr\presentation\pages\leave_type_form_page.dart",
    "// padding:", "padding:")
replace_in_file(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\inventory\presentation\pages\product_category_detail_page.dart",
    "// pathParameters:", "pathParameters:")
