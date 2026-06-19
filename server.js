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
    if (!makanan) return res.status(400).json({ error: "Nama makanan kosong!" });

    try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ 
                role: "user", 
                content: `Berikan data gizi untuk ${makanan}. WAJIB jawab JSON format: {"kalori": "angka", "protein": "angka", "karbohidrat": "angka", "lemak": "angka", "funfact": "deskripsi singkat asal daerah dan fakta unik", "resep": "langkah masak singkat"}. JANGAN kirim rentang angka, berikan satu angka rata-rata saja.` 
            }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            timeout: 8500 // PENTING: Matikan paksa di 8.5 detik sebelum Vercel nge-crash (10 detik)
        });

        const rawContent = groqResponse.data.choices[0].message.content;
        res.status(200).json(JSON.parse(rawContent.replace(/```json/gi, '').replace(/```/g, '').trim()));
    } catch (error) {
        console.error(error.message);
        // Kalau lelet, kirim pesan error rapi, JANGAN biarkan Vercel layar putih
        res.status(500).json({ error: "AI sedang sibuk atau jaringan lelet. Silakan klik tombol Cari lagi." });
    }
});

module.exports = app;
