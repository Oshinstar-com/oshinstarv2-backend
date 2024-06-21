import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load CSV data into a pandas DataFrame
data = pd.read_csv('worldcities.csv')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '')

    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400

    # Perform a case-insensitive search for the query in city and country columns
    results = data[
        data['city_ascii'].str.contains(query, case=False, na=False) |
        data['country'].str.contains(query, case=False, na=False)
    ]

    # Convert the search results to a list of dictionaries
    result_dicts = results.to_dict(orient='records')

    return jsonify(result_dicts)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
