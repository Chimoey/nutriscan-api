const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'kalori.html'));
});

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
                content: `Berikan data gizi, deskripsi funfact (berisi asal daerah, waktu makan terbaik, dan fakta unik), serta resep singkat untuk porsi tunggal: ${makanan}. WAJIB jawab HANYA dengan format JSON persis seperti ini: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "funfact": "...", "resep": "..."}` 
            }],
            temperature: 0.2, 
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        const rawContent = groqResponse.data?.choices?.[0]?.message?.content;
        if (!rawContent) {
            return res.status(500).json({ error: "Sistem AI Groq sedang tidak merespons. Coba lagi." });
        }

        const jsonString = rawContent.replace(/```json/g, '').replace(/
```/g, '').trim();
        res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error("Log Error Server:", error.message);
        res.status(500).json({ error: "Gagal memproses data. Mesin AI kelebihan beban atau kunci API salah." });
    }
});

app.all('*', (req, res) => {
    res.status(404).send('Jalur tidak ditemukan.');
});

module.exports = app;
