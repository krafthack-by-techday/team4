import pandas as pd
from glob import glob
import os

# 1. Read all your CSVs (as strings, since you want to keep the original timestamp format)
paths = glob(os.path.join("2025-03-exchange-no01", "*.csv"))
dfs = []
for p in paths:
    df = pd.read_csv(p, dtype=str)
    df = df.rename(columns={df.columns[0]: "timestamp"})
    df = df.set_index("timestamp")
    if not df.empty:
        dfs.append(df)

# 2. Side-by-side outer-join on the timestamp-strings
merged = pd.concat(dfs, axis=1, join="outer")

# 3. Collapse any duplicated column-names by summing their values
#    (you’ll need to cast back to numeric first)
merged = merged.apply(pd.to_numeric, errors="coerce").groupby(
    level=0, axis=1
).sum()

# 4. (Optional) sort your index and save
merged = merged.sort_index()
merged.to_csv("merged_exchanges.csv")
