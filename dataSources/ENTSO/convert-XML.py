import pandas as pd
import sys

import xml.etree.ElementTree as ET

def xml_to_csv(xml_file, csv_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    # Assuming each child of root is a record
    data = []
    columns = set()

    for record in root:
        row = {}
        for elem in record:
            row[elem.tag] = elem.text
            columns.add(elem.tag)
        data.append(row)

    columns = list(columns)
    df = pd.DataFrame(data, columns=columns)
    df.to_csv(csv_file, index=False)
    print(f"Converted {xml_file} to {csv_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: uv run convert-XML.py input.xml output.csv")
    else:
        xml_to_csv(sys.argv[1], sys.argv[2])