const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Rute Halaman Utama (Mencegah Error GET /)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'kalori.html'));
});

// 2. Rute Mesin Pencari Gizi AI
app.post('/api/nutrisi', async (req, res) => {
    const { makanan } = req.body; 
    
    if (!makanan) {
        return res.status(400).json({ error: "Nama makanan tidak boleh kosong!" });
    }

    try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ 
                role: "user", 
                content: `Berikan estimasi data gizi dan resep singkat untuk porsi tunggal: ${makanan}. WAJIB jawab hanya menggunakan format JSON persis seperti ini: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "resep": "..."}` 
            }],
            temperature: 0.2, 
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        // Pengaman ekstra jika Groq sedang bermasalah
        if (!groqResponse.data || !groqResponse.data.choices || !groqResponse.data.choices[0]) {
            throw new Error("Respon AI tidak valid.");
        }

        const rawContent = groqResponse.data.choices[0].message.content;
        const jsonString = rawContent.replace(/```json/g, '').replace(/
```/g, '').trim();
        
        res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error("Error API:", error.message);
        res.status(500).json({ error: "Sistem AI sedang sibuk atau API Key tidak valid." });
    }
});

module.exports = app;
