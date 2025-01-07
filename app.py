from flask import Flask, request, jsonify
import base64
import requests

app = Flask(__name__)

# Générer une adresse email temporaire
def generate_email():
    url = "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1"
    response = requests.get(url).json()
    email = response[0]
    return email

# Chiffrer l'adresse email en "numéro"
def encrypt_email(email):
    encoded = base64.b64encode(email.encode()).decode()
    temp_number = "+261" + ''.join(filter(str.isdigit, encoded))[:9]
    return temp_number, encoded

# Décoder l'email et récupérer les messages
def get_messages(encoded_email):
    email = base64.b64decode(encoded_email.encode()).decode()
    login, domain = email.split('@')
    url = f"https://www.1secmail.com/api/v1/?action=getMessages&login={login}&domain={domain}"
    response = requests.get(url).json()
    return response

@app.route('/generate', methods=['GET'])
def generate():
    try:
        email = generate_email()
        temp_number, encoded_email = encrypt_email(email)
        return jsonify({
            "temp_number": temp_number,
            "encoded_email": encoded_email
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/messages', methods=['GET'])
def messages():
    encoded_email = request.args.get('encoded_email')
    if not encoded_email:
        return jsonify({"error": "encoded_email parameter is required"}), 400
    try:
        messages = get_messages(encoded_email)
        return jsonify(messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Permet à Flask d'écouter sur l'interface publique
    app.run(host='0.0.0.0', port=5000)
