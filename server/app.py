from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
import json
import hmac
import hashlib
from datetime import datetime, timedelta


app = Flask(__name__)
CORS(app)

ALLOWED_USERS = {
    5429222882: {"username": "Suslick", "name": "SuslickSLS", "role": "admin"},
    987654321: {"username": "manager", "name": "Менеджер", "role": "manager"},
}

access_cache = {}

@app.route('/api/check-access', methods=['POST'])
def check_access():
    """
    Проверка доступа пользователя к Mini App
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        init_data = data.get('initData')
        
        if not user_id:
            return jsonify({'access': False, 'error': 'No user ID'}), 400
        
        # Проверка кеша (5 минут)
        cache_key = f"user_{user_id}"
        if cache_key in access_cache:
            cached_data = access_cache[cache_key]
            if datetime.now() - cached_data['timestamp'] < timedelta(minutes=5):
                return jsonify({'access': cached_data['access'], 'user': cached_data['user']})
        
        # Проверка подписи Telegram (опционально, но рекомендуется)
        if not verify_telegram_init_data(init_data):
            return jsonify({'access': False, 'error': 'Invalid signature'}), 403
        
        # Проверка в белом списке
        user_info = ALLOWED_USERS.get(user_id)
        
        if user_info:
            # Сохраняем в кеш
            access_cache[cache_key] = {
                'access': True,
                'user': user_info,
                'timestamp': datetime.now()
            }
            
            return jsonify({
                'access': True,
                'user': user_info,
                'message': f'Добро пожаловать, {user_info["name"]}!'
            })
        else:
            # Логируем попытку доступа
            print(f"Попытка доступа от неподтвержденного пользователя: {user_id}")
            
            # Сохраняем в кеш
            access_cache[cache_key] = {
                'access': False,
                'user': None,
                'timestamp': datetime.now()
            }
            
            return jsonify({
                'access': False,
                'error': 'User not in whitelist'
            }), 403
            
    except Exception as e:
        print(f"Ошибка проверки доступа: {e}")
        return jsonify({'access': False, 'error': 'Internal server error'}), 500

def verify_telegram_init_data(init_data):
    """
    Проверка подписи Telegram Web App
    """
    try:
        # Ваш bot token из @BotFather
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        
        if not bot_token or not init_data:
            return True  # Пропускаем проверку если нет токена
        
        # Разбираем initData
        params = {}
        for pair in init_data.split('&'):
            key, value = pair.split('=')
            params[key] = value
        
        # Получаем подпись
        received_hash = params.get('hash')
        if not received_hash:
            return False
        
        # Удаляем hash из параметров
        del params['hash']
        
        # Сортируем параметры
        data_check_string = '\n'.join([f"{k}={v}" for k, v in sorted(params.items())])
        
        # Вычисляем секретный ключ
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Вычисляем хеш
        computed_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return computed_hash == received_hash
        
    except Exception as e:
        print(f"Ошибка проверки подписи: {e}")
        return False

@app.route('/api/admin/users', methods=['GET'])
def get_allowed_users():
    """
    Получить список разрешенных пользователей (для админки)
    """
    return jsonify({
        'users': ALLOWED_USERS,
        'total': len(ALLOWED_USERS)
    })

@app.route('/api/admin/add-user', methods=['POST'])
def add_user():
    """
    Добавить пользователя в белый список
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        username = data.get('username')
        name = data.get('name')
        role = data.get('role', 'user')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        ALLOWED_USERS[user_id] = {
            'username': username,
            'name': name,
            'role': role,
            'added_at': datetime.now().isoformat()
        }
        
        # Очищаем кеш для этого пользователя
        cache_key = f"user_{user_id}"
        access_cache.pop(cache_key, None)
        
        return jsonify({'success': True, 'user': ALLOWED_USERS[user_id]})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# Обновленный URL вашего локального API с HTTPS и портом 8443
LOCAL_API_URL = "https://192.168.171.248:8443"

@app.route('/')
def home():
    return jsonify({
        'message': 'WB Telegram Mini App Backend',
        'endpoints': {
            'health': '/api/health',
            'product': '/api/product/<id>',
            'DenCool': '/api/DenCool/<id>',
            'debug': '/api/debug/wb',
            'local_raw': '/api/local/raw/nmInfo?nmId=224851397',
            'local_health': '/api/local/health'
        }
    })

@app.route('/api/local/raw/nmInfo', methods=['GET'])
def local_raw_nm_info():
    """
    Получение всех данных с локального API как есть
    """
    try:
        nm_id = request.args.get('nmId')
        if not nm_id:
            return jsonify({'error': 'nmId parameter is required'}), 400
        
        # Формируем URL к локальному API
        target_url = f"{LOCAL_API_URL}/api/nmInfo?nmId={nm_id}"
        
        print(f"🔗 Запрос к локальному API: {target_url}")
        
        # Делаем запрос с отключенной проверкой SSL (для самоподписанных сертификатов)
        response = requests.get(
            target_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout=10,
            verify=False  # Отключаем проверку SSL сертификата
        )
        
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code != 200:
            return jsonify({
                'error': f'Локальный API вернул статус {response.status_code}',
                'status_code': response.status_code,
                'url': target_url
            }), 502
        
        # Возвращаем данные как есть
        raw_data = response.json()
        
        print(f"✅ Получены сырые данные с локального API")
        
        result = {
            **raw_data,
            '_metadata': {
                'source': 'local_api',
                'status': 'success',
                'local_api_url': LOCAL_API_URL,
                'nm_id_requested': nm_id
            }
        }
        
        return jsonify(result)
            
    except requests.exceptions.SSLError as e:
        print(f"🔒 Ошибка SSL: {e}")
        return jsonify({
            'error': 'SSL ошибка при подключении к локальному API',
            'solution': 'Сертификат не доверенный или самоподписанный',
            'local_api_url': LOCAL_API_URL,
            '_metadata': {
                'source': 'error',
                'status': 'ssl_error'
            }
        }), 503
        
    except requests.exceptions.ConnectionError as e:
        print(f"🔌 Ошибка подключения: {e}")
        return jsonify({
            'error': 'Не удалось подключиться к локальному API',
            'solution': 'Убедитесь что сервер 192.168.171.248:8443 запущен и доступен',
            'local_api_url': LOCAL_API_URL,
            '_metadata': {
                'source': 'error',
                'status': 'connection_failed'
            }
        }), 503
        
    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Таймаут при запросе к локальному API',
            'local_api_url': LOCAL_API_URL,
            '_metadata': {
                'source': 'error', 
                'status': 'timeout'
            }
        }), 504
        
    except Exception as e:
        print(f"💥 Ошибка: {e}")
        return jsonify({
            'error': f'Ошибка при запросе к локальному API: {str(e)}',
            'local_api_url': LOCAL_API_URL,
            '_metadata': {
                'source': 'error',
                'status': 'exception'
            }
        }), 500

@app.route('/api/local/health', methods=['GET'])
def local_health_check():
    """Проверка доступности локального API"""
    try:
        # Отключаем проверку SSL для локального API
        response = requests.get(
            f"{LOCAL_API_URL}/api/health", 
            timeout=5,
            verify=False
        )
        
        health_info = {
            'local_api_status': 'available' if response.status_code == 200 else 'unavailable',
            'status_code': response.status_code,
            'local_api_url': LOCAL_API_URL,
            'protocol': 'https'
        }
        
        # Если доступен, пробуем получить информацию о nmInfo
        if response.status_code == 200:
            try:
                nm_test = requests.get(
                    f"{LOCAL_API_URL}/api/nmInfo?nmId=224851397", 
                    timeout=3,
                    verify=False
                )
                health_info['nm_info_endpoint'] = 'available' if nm_test.status_code == 200 else 'unavailable'
                health_info['nm_info_status'] = nm_test.status_code
            except Exception as e:
                health_info['nm_info_endpoint'] = 'unavailable'
                health_info['nm_info_error'] = str(e)
        
        return jsonify(health_info)
        
    except requests.exceptions.SSLError as e:
        return jsonify({
            'local_api_status': 'ssl_error',
            'local_api_url': LOCAL_API_URL,
            'error': f'SSL ошибка: {str(e)}',
            'solution': 'Сервер использует самоподписанный сертификат'
        }), 503
        
    except Exception as e:
        return jsonify({
            'local_api_status': 'unavailable',
            'local_api_url': LOCAL_API_URL,
            'error': str(e),
            'solution': 'Проверьте что сервер запущен и доступен по сети'
        }), 503

@app.route('/api/local/debug', methods=['GET'])
def local_debug():
    """Детальная отладка подключения к локальному API"""
    try:
        nm_id = request.args.get('nmId', '224851397')
        target_url = f"{LOCAL_API_URL}/api/nmInfo?nmId={nm_id}"
        
        debug_info = {
            'target_url': target_url,
            'local_api_url': LOCAL_API_URL,
            'ssl_verify': False
        }
        
        try:
            # Пробуем без SSL проверки
            response = requests.get(target_url, timeout=10, verify=False)
            debug_info['response'] = {
                'status_code': response.status_code,
                'headers': dict(response.headers),
                'content_preview': response.text[:500] if response.text else 'empty'
            }
            
            if response.status_code == 200:
                try:
                    debug_info['response']['json_data'] = response.json()
                except:
                    debug_info['response']['json_error'] = 'Cannot parse JSON'
                    
        except requests.exceptions.SSLError as e:
            debug_info['ssl_error'] = str(e)
        except requests.exceptions.ConnectionError as e:
            debug_info['connection_error'] = str(e)
        except Exception as e:
            debug_info['other_error'] = str(e)
        
        return jsonify(debug_info)
        
    except Exception as e:
        return jsonify({'error': f'Debug error: {str(e)}'}), 500

# server/app.py - добавить этот эндпоинт
@app.route('/api/wb/product', methods=['GET'])
def get_wb_product():
    """
    Получение данных одного товара с Wildberries API
    """
    try:
        nm_id = request.args.get('nmId')
        if not nm_id:
            return jsonify({'error': 'nmId parameter is required'}), 400
        
        print(f"🔍 Запрос товара {nm_id} с WB API")
        
        # URL Wildberries API для одного товара
        wb_url = f"https://card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest=-5818883&spp=30&ab_testing=false&lang=ru&nm={nm_id}"
        
        response = requests.get(
            wb_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({
                'error': f'WB API вернул статус {response.status_code}',
                'status_code': response.status_code
            }), 502
        
        data = response.json()
        
        if not data.get('products') or len(data['products']) == 0:
            return jsonify({'error': 'Товар не найден'}), 404
        
        product = data['products'][0]
        
        # Получаем информацию о цене и складах
        sizes = product.get('sizes', [])
        price_info = sizes[0].get('price', {}) if sizes else {}
        stocks = sizes[0].get('stocks', []) if sizes else []
        
        basic_price = price_info.get('basic', 0) // 100
        product_price = price_info.get('product', 0) // 100
        discount = round((1 - product_price / basic_price) * 100, 1) if basic_price > 0 else 0
        
        # Формируем информацию о складах
        warehouses = []
        for stock in stocks:
            warehouses.append({
                'warehouse_id': stock.get('wh'),
                'quantity': stock.get('qty', 0),
                'time1': stock.get('time1'),
                'time2': stock.get('time2')
            })
        
        result = {
            'id': product.get('id'),
            'brand': product.get('brand'),
            'name': product.get('name'),
            'rating': product.get('rating'),
            'reviewRating': product.get('reviewRating'),
            'feedbacks': product.get('feedbacks'),
            'totalQuantity': product.get('totalQuantity'),
            'basicPrice': basic_price,
            'productPrice': product_price,
            'discount': discount,
            'discountAmount': basic_price - product_price if basic_price > product_price else 0,
            'supplier': product.get('supplier'),
            'supplierRating': product.get('supplierRating'),
            'pics': product.get('pics', 0),
            'subject': product.get('entity'),
            'subjectId': product.get('subjectId'),
            'volume': product.get('volume'),
            'weight': product.get('weight'),
            'time1': product.get('time1'),
            'time2': product.get('time2'),
            'promotions': product.get('promotions', []),
            'warehouses': warehouses,
            'sizesCount': len(sizes),
            'hasStocks': len(stocks) > 0
        }
        
        print(f"✅ Получен товар {product.get('name')} с WB API")
        
        return jsonify({
            'product': result,
            '_metadata': {
                'source': 'wildberries_api',
                'status': 'success'
            }
        })
        
    except Exception as e:
        print(f"💥 Ошибка: {e}")
        return jsonify({'error': f'Ошибка при запросе к WB API: {str(e)}'}), 500

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
    print(f"🔗 Локальный API: {LOCAL_API_URL}")
    app.run(host='0.0.0.0', port=port, debug=True)