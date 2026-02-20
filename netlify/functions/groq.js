
// netlify/functions/groq.js
// Esta función actúa de intermediario: recibe los mensajes del frontend
// y llama a Groq con la API key guardada de forma segura en variables de entorno.

exports.handler = async function(event) {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Cabeceras CORS para que tu web pueda llamar a esta función
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { messages, model, temperature, max_tokens } = JSON.parse(event.body);

        // La API key viene de las variables de entorno de Netlify (nunca visible en el código)
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key no configurada en el servidor' })
            };
        }

        // Llamada a Groq SIN streaming (Netlify Functions no soporta streaming)
        // El resultado es el mismo, solo llega todo de golpe en vez de letra a letra
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 8000,
                stream: false  // Sin streaming en el servidor
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: `Error de Groq: ${errorData}` })
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
