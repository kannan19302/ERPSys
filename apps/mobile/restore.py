import json
import re

log_file = r"C:\Users\kanna\.gemini\antigravity-ide\brain\72ee2c30-39fa-4f9a-8a56-a0b1b811163d\.system_generated\logs\transcript_full.jsonl"
with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        if "manufacturing_detail_pages_test.dart" in line and "Showing lines 1 to 592" in line:
            data = json.loads(line)
            content = data.get("content", "")
            if not content and "tool_calls" in data:
                content = str(data["tool_calls"])
            
            # The content should contain the lines
            # Split it by `\n` or `\\n`
            if "\\n" in content:
                lines = content.split("\\n")
            else:
                lines = content.split("\n")
                
            out = ""
            started = False
            for l in lines:
                if l.startswith("1: import 'dart:async';"):
                    started = True
                
                if started:
                    m = re.match(r"^\d+: (.*)$", l)
                    if m:
                        code_line = m.group(1).replace("\\r", "").replace("\\n", "")
                        code_line = code_line.replace("workOrderId:", "id:").replace("bomId:", "id:")
                        out += code_line + "\n"
                    if "class MockSharedPreferences extends Mock implements SharedPreferences {}" in l:
                        break
            if out:
                with open(r"c:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile\test\features\manufacturing\manufacturing_detail_pages_test.dart", "w", encoding="utf-8") as out_f:
                    out_f.write(out)
                print("Done correctly!")
                break
