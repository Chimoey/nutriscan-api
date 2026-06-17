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
                content: `Berikan data gizi (Kalori dalam kcal, Protein dalam g, Karbohidrat dalam g, Lemak dalam g) dan resep untuk: ${makanan}. Jawab format JSON: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "resep": "..."}` 
            }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        const rawContent = groqResponse.data.choices[0].message.content;
        const jsonString = rawContent.replace(/```json/g, '').replace(/
```/g, '');
        res.json(JSON.parse(jsonString));
    } catch (error) {
        res.status(500).json({ error: "Mesin AI sedang sibuk." });
    }
});

module.exports = app;
