from flask import Flask, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/product/<int:product_id>')
def get_product(product_id):
    try:
        wb_url = f"https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm={product_id}"
        response = requests.get(wb_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('data', {}).get('products'):
                product = data['data']['products'][0]
                return jsonify({
                    'id': product.get('id'),
                    'name': product.get('name', 'Товар'),
                    'brand': product.get('brand', 'Бренд'),
                    'price': product.get('salePriceU', 0),
                    'rating': product.get('rating', 0),
                    'feedbacks': product.get('feedbacks', 0),
                })
        
        return jsonify({'error': 'Товар не найден'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/')
def home():
    return jsonify({'message': 'WB Telegram API'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)