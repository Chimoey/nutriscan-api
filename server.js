const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Rute Halaman Utama (Wajib untuk nampilin UI)
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'kalori.html'));
});

// 2. Rute Mesin AI (Mode Sangat Aman)
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
                content: `Berikan data gizi dan resep singkat untuk porsi tunggal: ${makanan}. WAJIB jawab HANYA dengan format JSON persis seperti ini: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "resep": "..."}` 
            }],
            temperature: 0.1, 
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        // PENGAMAN 1: Cegah crash jika Groq error atau balasan kosong
        const rawContent = groqResponse.data?.choices?.[0]?.message?.content;
        if (!rawContent) {
            return res.status(500).json({ error: "Sistem AI Groq sedang tidak merespons. Coba lagi." });
        }

        // PENGAMAN 2: Pembersihan JSON
        const jsonString = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error("Log Error Server:", error.message);
        res.status(500).json({ error: "Gagal memproses data. Mesin AI kelebihan beban atau kunci API salah." });
    }
});

// 3. PENGAMAN 3: Penangkap Rute Nyasar (Mencegah Crash karena Favicon)
app.all('*', (req, res) => {
    res.status(404).send('Jalur tidak ditemukan.');
});

module.exports = app;
