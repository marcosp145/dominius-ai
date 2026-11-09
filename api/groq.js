export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages, model, temperature, max_tokens } = req.body;
        const GROQ_API_KEY = process.env.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;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: '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' });
        }

        const response = await fetch('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', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${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}`
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 8000,
                stream: false
            })
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
