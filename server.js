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
                content: `Berikan data gizi, deskripsi funfact singkat (asal daerah & fakta unik), serta resep untuk: ${makanan}. WAJIB jawab HANYA dalam format JSON persis seperti ini: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "funfact": "...", "resep": "..."}. PENTING: Jangan gunakan tanda kutip ganda (") atau enter/newline di dalam teks isi value JSON.` 
            }],
            temperature: 0.1, // Dibuat kecil biar AI nggak berhalusinasi aneh-aneh
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        const rawContent = groqResponse.data?.choices?.[0]?.message?.content;
        if (!rawContent) {
            throw new Error("Balasan AI kosong.");
        }

        // Pembersih JSON Anti-Crash
        const jsonString = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let parsedData;
        try {
            // Coba rakit JSON-nya
            parsedData = JSON.parse(jsonString);
        } catch (parseErr) {
            // Kalau gagal, JANGAN CRASH. Kasih tau frontend aja.
            console.error("JSON Error:", jsonString);
            return res.status(500).json({ error: "AI meracik format yang salah. Silakan klik tombol Cari Data lagi." });
        }

        res.status(200).json(parsedData);

    } catch (error) {
        console.error("Server API Error:", error.message);
        res.status(500).json({ error: "Sistem AI sedang menyesuaikan diri atau sibuk. Coba lagi ya." });
    }
});

app.all('*', (req, res) => {
    res.status(404).send('Jalur tidak ditemukan.');
});

module.exports = app;
