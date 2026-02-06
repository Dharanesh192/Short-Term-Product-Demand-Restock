from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

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

    required_cols = ['Date', 'Product ID', 'Category', 'Price', 'Units Sold']
    missing = [c for c in required_cols if c not in df.columns]

    if missing:
        return jsonify({"error": f"Missing columns: {missing}"}), 400

    # ---------- PREPROCESS ----------
    df = df[required_cols]
    df['Date'] = pd.to_datetime(df['Date'])

    df['Month'] = df['Date'].dt.month_name()
    df['Month_Num'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year

    # ---------- SORT ----------
    df = df.sort_values(by='Date')

    # ---------- TABLE DATA ----------
    table_data = df.head(10).to_dict(orient="records")

    # ---------- PRODUCT TOTAL SALES ----------
    product_sales = (
        df.groupby('Product ID')['Units Sold']
        .sum()
        .sort_values(ascending=False)
        .head(5)
        .reset_index()
    )

    # ---------- MONTHLY SALES ----------
    monthly_sales = (
        df.groupby(['Product ID', 'Month', 'Month_Num'])['Units Sold']
        .sum()
        .reset_index()
    )

    # ---------- REGRESSION: DEMAND TREND ANALYSIS ----------
    regression_results = []
    restock_suggestions = []

    for product in df['Product ID'].unique():

        product_df = df[df['Product ID'] == product]

        if len(product_df) < 10:
            continue

        # Convert time to numeric index
        product_df = product_df.copy()
        product_df['Time_Index'] = (
            product_df['Date'].dt.year * 12 + product_df['Date'].dt.month
        )

        X = product_df[['Time_Index']]
        y = product_df['Units Sold']

        model = LinearRegression()
        model.fit(X, y)

        trend = model.coef_[0]

        # Best month (historical peak)
        peak_month = (
            product_df.groupby('Month')['Units Sold']
            .sum()
            .idxmax()
        )

        regression_results.append({
            "product": product,
            "trend": round(trend, 2)
        })

        # ---------- RESTOCK LOGIC ----------
        if trend > 0:
            msg = f"Increase stock of {product} before {peak_month} due to rising demand."
        else:
            msg = f"Maintain stock of {product} demand trend is stable {peak_month} month."

        restock_suggestions.append({
            "product": product,
            "month": peak_month,
            "message": msg
        })

    # ---------- RESPONSE ----------
    response = {
        "tableData": table_data,
        "topProducts": product_sales.to_dict(orient="records"),
        "monthlySales": monthly_sales.to_dict(orient="records"),
        "regressionTrends": regression_results,
        "restockSuggestions": restock_suggestions
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)
