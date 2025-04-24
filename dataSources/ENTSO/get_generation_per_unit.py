import pandas as pd
from entsoe import EntsoePandasClient

client = EntsoePandasClient(api_key="YOUR_TOKEN")

start = pd.Timestamp("2025-04-01", tz="Europe/Oslo")
end   = pd.Timestamp("2025-04-30T23:00", tz="Europe/Oslo")

# 1) get unit outputs
df = client.query_generation_per_unit(
    domain="10YNO-1--------2", start=start, end=end
)  # yields columns ['resource','GenerationPerUnit']

# 2) get metadata (via HTTP or entsoe-py helper)
meta = fetch_entsoe_masterdata_units()  
# meta has ['unitEic','ownerName']

# 3) merge and filter for Hafslund
df = df.reset_index().merge(
    meta, left_on="resource", right_on="unitEic"
)
haf = df[df.ownerName.str.contains("Hafslund", case=False)]

# 4) aggregate by day or month
haf['date'] = haf['Datetime'].dt.to_period("D")
daily_prod = haf.groupby('date')['GenerationPerUnit'].sum()
print(daily_prod)
