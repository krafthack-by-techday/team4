import pandas as pd
from entsoe import EntsoePandasClient
import os

client = EntsoePandasClient(api_key=os.environ["ENTSOKEY"])

start = pd.Timestamp("2025-04-25T00:00", tz="Europe/Oslo")
end   = pd.Timestamp("2025-04-25T23:00", tz="Europe/Oslo")

df = client.query_day_ahead_prices("NO_1", start=start, end=end)
df.to_csv("day_ahead_prices_for_march.csv", index=False)