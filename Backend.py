from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__)
CORS(app)

@app.route("/upload", methods=["POST"])
def upload_file():

    # ---------- FILE CHECK ----------
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # ---------- READ CSV ----------
    df = pd.read_csv(file)

    required_cols = ['Date', 'Product Name', 'Location', 'Units Sold', 'No of Products']
    missing = [c for c in required_cols if c not in df.columns]

    if missing:
        return jsonify({"error": f"Missing columns: {missing}"}), 400

    # ---------- PREPROCESS ----------
    df = df[required_cols]
    df['Date-format'] = pd.to_datetime(df['Date'])

    df['Month'] = df['Date-format'].dt.month_name()
    df['Month_Num'] = df['Date-format'].dt.month
    df['Year'] = df['Date-format'].dt.year

    # Time index for regression
    df['Time_Index'] = df['Year'] * 12 + df['Month_Num']

    # ---------- ENCODE CATEGORICAL FEATURES ----------
    le_product = LabelEncoder()
    le_location = LabelEncoder()

    df['Product_Enc'] = le_product.fit_transform(df['Product Name'])
    df['Location_Enc'] = le_location.fit_transform(df['Location'])

    # ---------- REGRESSION MODEL ----------
    X = df[['Time_Index', 'Product_Enc', 'Location_Enc']]
    y = df['Units Sold']

    model = LinearRegression()
    model.fit(X, y)

    # ---------- ANALYSIS: PRODUCT-MONTH-LOCATION DEMAND ----------
    demand_analysis = (
        df.groupby(['Product Name', 'Month', 'Month_Num', 'Location'])['Units Sold']
        .sum()
        .reset_index()
        .sort_values(by='Units Sold', ascending=False)
    )

    # ---------- TOP DEMAND COMBINATIONS ----------
    top_demand = demand_analysis.head(10)

    # ---------- RESTOCK SUGGESTIONS ----------
    restock_suggestions = []

    for _, row in top_demand.iterrows():
        msg = (
            f"High demand for {row['Product Name']} in {row['Location']} "
            f"during {row['Month']}. Increase stock before this period."
        )

        restock_suggestions.append({
            "product": row['Product Name'],
            "location": row['Location'],
            "month": row['Month'],
            "unitsSold": int(row['Units Sold']),
            "message": msg
        })

    # ---------- TABLE DATA ----------
    table_data = df.head(10).to_dict(orient="records")

    # ---------- RESPONSE ----------
    response = {
        "tableData": table_data,
        "topDemandByMonthLocation": top_demand.to_dict(orient="records"),
        "restockSuggestions": restock_suggestions
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)
