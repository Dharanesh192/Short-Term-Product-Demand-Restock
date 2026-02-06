from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route("/upload", methods=["POST"])
def upload_file():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files allowed"}), 400

    # Read CSV
    df = pd.read_csv(file)

    # Keep only required columns
    df = df[['Date', 'Product ID', 'Category', 'Price', 'Units Sold']]

    # Convert Date
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.month_name()

    # ---------- SORT DATA ----------
    df_sorted = df.sort_values(by='Date')

    # ---------- TABLE DATA (first 20 rows) ----------
    table_data = df_sorted.head(10).to_dict(orient="records")

    # ---------- PRODUCT MONTHLY SALES ----------
    monthly_sales = (
        df.groupby(['Product ID', 'Month'])['Units Sold']
        .sum()
        .reset_index()
    )

    # ---------- BEST MONTH PER PRODUCT ----------
    best_month = (
        monthly_sales
        .loc[monthly_sales.groupby('Product ID')['Units Sold'].idxmax()]
    )

    # ---------- RESTOCK SUGGESTIONS ----------
    suggestions = []
    for _, row in best_month.iterrows():
        suggestions.append({
            "product": row['Product ID'],
            "month": row['Month'],
            "message": f"Increase stock of {row['Product ID']} before {row['Month']} due to high demand"
        })

    # ---------- TOP PRODUCTS ----------
    top_products = (
        df.groupby('Product ID')['Units Sold']
        .sum()
        .sort_values(ascending=False)
        .head(5)
        .reset_index()
    )

    # ---------- RESPONSE ----------
    response = {
        "tableData": table_data,
        "monthlySales": monthly_sales.to_dict(orient="records"),
        "topProducts": top_products.to_dict(orient="records"),
        "restockSuggestions": suggestions
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)
