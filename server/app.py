# server/app.py
from flask import Flask, jsonify
from flask_cors import CORS
import requests
import os
import json

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        'message': 'WB Telegram Mini App Backend',
        'endpoints': {
            'health': '/api/health',
            'product': '/api/product/<id>',
            'debug': '/api/debug/wb'
        }
    })

@app.route('/api/product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        print(f"🔍 Запрос товара {product_id}")
        
        # Основной URL WB API
        wb_url = f"https://card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm={product_id}"
        
        print(f"🔄 Пробуем URL: {wb_url}")
        
        # Делаем запрос с подробными заголовками
        response = requests.get(
            wb_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.wildberries.ru/',
                'Origin': 'https://www.wildberries.ru',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
            },
            timeout=10
        )
        
        print(f"📊 Статус ответа: {response.status_code}")
        print(f"📋 Заголовки ответа: {dict(response.headers)}")
        
        if response.status_code != 200:
            return jsonify({
                'error': f'WB API вернул статус {response.status_code}',
                'status_code': response.status_code,
                'product_id': product_id
            }), 502
            
        # Пробуем распарсить JSON
        try:
            data = response.json()
            print(f"📦 JSON получен успешно")
        except json.JSONDecodeError as e:
            print(f"❌ Ошибка парсинга JSON: {e}")
            print(f"📄 Содержимое ответа: {response.text[:200]}")
            return jsonify({
                'error': 'Неверный формат ответа от WB API',
                'response_preview': response.text[:200]
            }), 502
        
        # Проверяем структуру ответа
        if not data:
            return jsonify({'error': 'Пустой ответ от WB API'}), 404
            
        # Пробуем разные возможные структуры данных
        product_data = None
        if data.get('data', {}).get('products'):
            product_data = data['data']['products'][0]
        elif data.get('products'):
            product_data = data['products'][0]
        else:
            print(f"📋 Структура данных: {json.dumps(data, ensure_ascii=False)[:500]}")
            return jsonify({
                'error': 'Неизвестная структура данных от WB API',
                'data_structure': list(data.keys()) if data else []
            }), 502
        
        if not product_data:
            return jsonify({'error': 'Товар не найден в ответе'}), 404
        
        # Форматируем успешный ответ
        result = {
            'id': product_data.get('id', product_id),
            'name': product_data.get('name', 'Название не указано'),
            'brand': product_data.get('brand', 'Бренд не указан'),
            'price': product_data.get('salePriceU', 0),
            'rating': product_data.get('rating', 0),
            'feedbacks': product_data.get('feedbacks', 0),
            'quantity': product_data.get('totalQuantity', 0),
        }
        
        print(f"✅ Успешно получен товар: {result['name']}")
        return jsonify(result)
        
    except requests.exceptions.Timeout:
        print("⏰ Таймаут при запросе к WB API")
        return jsonify({'error': 'Таймаут при запросе к WB API'}), 504
    except requests.exceptions.ConnectionError:
        print("🔌 Ошибка подключения к WB API")
        return jsonify({'error': 'Ошибка подключения к WB API'}), 503
    except requests.exceptions.RequestException as e:
        print(f"🌐 Ошибка сети: {e}")
        return jsonify({'error': f'Ошибка сети: {str(e)}'}), 503
    except Exception as e:
        print(f"💥 Неожиданная ошибка: {e}")
        return jsonify({'error': f'Внутренняя ошибка: {str(e)}'}), 500

@app.route('/api/debug/wb', methods=['GET'])
def debug_wb():
    """Эндпоинт для отладки подключения к WB"""
    test_id = 205886056
    wb_url = f"https://card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm={test_id}"
    
    try:
        print(f"🔧 Отладка: проверка подключения к {wb_url}")
        response = requests.get(wb_url, timeout=10)
        
        debug_info = {
            'status_code': response.status_code,
            'url': wb_url,
            'headers': dict(response.headers),
            'content_type': response.headers.get('content-type'),
            'content_length': len(response.text),
            'content_preview': response.text[:500] if response.text else 'Empty response',
        }
        
        # Пробуем распарсить JSON если это возможно
        if 'application/json' in response.headers.get('content-type', ''):
            try:
                json_data = response.json()
                debug_info['json_structure'] = list(json_data.keys()) if json_data else []
                debug_info['json_preview'] = str(json_data)[:500]
            except:
                debug_info['json_error'] = 'Cannot parse JSON'
        
        return jsonify(debug_info)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok', 
        'service': 'WB API Proxy',
        'timestamp': os.times().user
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Запуск сервера на порту {port}")
    app.run(host='0.0.0.0', port=port, debug=True)