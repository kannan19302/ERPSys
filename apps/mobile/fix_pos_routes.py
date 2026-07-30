import os, re

pages = [
    ("pos_order_list_page.dart", "PosOrderListPage", "pos-orders", "/pos/orders"),
    ("pos_order_detail_page.dart", "PosOrderDetailPage", "pos-order-detail", "/pos/orders/:id"),
    ("pos_order_form_page.dart", "PosOrderFormPage", "pos-order-form", "/pos/orders/new"),
    ("pos_register_list_page.dart", "PosRegisterListPage", "pos-registers", "/pos/registers"),
    ("pos_register_detail_page.dart", "PosRegisterDetailPage", "pos-register-detail", "/pos/registers/:id"),
    ("pos_register_form_page.dart", "PosRegisterFormPage", "pos-register-form", "/pos/registers/new"),
    ("pos_shift_list_page.dart", "PosShiftListPage", "pos-shifts", "/pos/shifts"),
    ("pos_shift_detail_page.dart", "PosShiftDetailPage", "pos-shift-detail", "/pos/shifts/:id"),
    ("pos_price_list_list_page.dart", "PosPriceListListPage", "pos-price-lists", "/pos/price-lists"),
    ("pos_price_list_form_page.dart", "PosPriceListFormPage", "pos-price-list-form", "/pos/price-lists/new"),
    ("pos_discount_list_page.dart", "PosDiscountListPage", "pos-discounts", "/pos/discounts"),
    ("pos_discount_detail_page.dart", "PosDiscountDetailPage", "pos-discount-detail", "/pos/discounts/:id"),
]

base_dir = r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\lib\features\pos\presentation\pages"

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
