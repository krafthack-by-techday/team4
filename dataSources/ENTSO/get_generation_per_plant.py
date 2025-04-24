import pandas as pd
from entsoe import EntsoePandasClient
import os

client = EntsoePandasClient(api_key=os.environ["ENTSOKEY"])

start = pd.Timestamp("2025-03-01", tz="Europe/Oslo")
end   = pd.Timestamp("2025-03-31", tz="Europe/Oslo")

df = client.query_generation_per_plant("NO", start=start, end=end)
df.to_csv("generation_pr_plant_for_march.csv", index=False)
