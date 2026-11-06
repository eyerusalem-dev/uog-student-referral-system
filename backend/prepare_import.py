import json
from pathlib import Path

records = json.loads(
    Path("local-data.json").read_text(encoding="utf-8")
)

users = [
    record for record in records
    if record["model"] == "users.user"
]

for user in users:
    phone = user["fields"].get("phone")
    if phone is None or phone.strip() == "":
        user["fields"]["phone"] = None

Path("neon-import.json").write_text(
    json.dumps(records, ensure_ascii=False),
    encoding="utf-8",
)

print(f"Prepared {len(records)} records, including {len(users)} users.")