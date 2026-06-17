import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

// ==========================================
// 1. MIDDLEWARE WAJIB
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd()));

// ==========================================
// 2. RUTE UTAMA TAMPILAN WEB
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'kalori.html'));
});

// ==========================================
// 3. MESIN API NUTRISCAN (FATSECRET & GROQ)
// ==========================================
app.post('/api/nutrisi', async (req, res) => {
    const { makanan } = req.body; 

    try {
        // --- A. PROSES FATSECRET ---
        const credentials = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await axios.post('https://oauth.fatsecret.com/connect/token', 
            'grant_type=client_credentials&scope=basic', {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const access_token = tokenResponse.data.access_token;

        const fatsecretResponse = await axios.get('https://platform.fatsecret.com/rest/server.api', {
            headers: { 'Authorization': `Bearer ${access_token}` },
            params: {
                method: 'foods.search',
                search_expression: makanan,
                format: 'json',
                max_results: 1
            }
        });

        // --- B. PROSES GROQ AI ---
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { 
                    role: "user", 
                    content: `Tolong berikan instruksi resep masakan yang singkat, sehat, dan jelas untuk membuat porsi tunggal: ${makanan}` 
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // --- C. KIRIM BALIK KE HTML ---
        res.json({
            nutrisi: fatsecretResponse.data,
            resep: groqResponse.data.choices[0].message.content
        });

    } catch (error) {
        console.error("Error API:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Mesin gagal terhubung ke satelit API." });
    }
});

// ==========================================
// 4. EXPORT KHUSUS VERCEL (ES MODULE)
// ==========================================
export default app;