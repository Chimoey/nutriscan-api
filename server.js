const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd()));

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'kalori.html'));
});

app.post('/api/nutrisi', async (req, res) => {
    const { makanan } = req.body; 
    try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ 
                role: "user", 
                content: `Berikan data gizi (Kalori dalam kcal, Protein dalam g, Karbohidrat dalam g, Lemak dalam g) dan resep singkat untuk makanan: ${makanan}. Berikan jawaban dalam format JSON: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "resep": "..."}` 
            }],
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        res.json(JSON.parse(groqResponse.data.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Mesin AI sedang sibuk." });
    }
});

module.exports = app;
