import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 👇 KUNCI DISENSOR: Render yang akan mengisi ini dari brankas rahasia
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Melayani file HTML
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/kalori.html');
});

async function getFatSecretToken() {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const response = await fetch('https://oauth.api.fatsecret.com/connect/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=basic'
    });
    const data = await response.json();
    return data.access_token;
}

app.get('/api/cari', async (req, res) => {
    const namaMakanan = req.query.makanan;
    if (!namaMakanan) return res.json({ error: 'Nama makanan kosong!' });

    try {
        const token = await getFatSecretToken();
        const url = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(namaMakanan)}&format=json&language=id&region=ID&max_results=5`;
        const fatsecretResponse = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await fatsecretResponse.json();
        res.json(data);
    } catch (error) {
        console.log(`⚠️ Mode Offline untuk: ${namaMakanan}`);
        res.json({ foods: { food: [{ food_name: `${namaMakanan} Khas Nusantara`, food_description: "Per 100g - Kalori: 168kkal | Lemak: 7.15g | Karbo: 21.40g | Protein: 4.80g" }] }});
    }
});

app.post('/api/resep', async (req, res) => {
    const { namaMakanan, deskripsiGizi } = req.body;
    if (!namaMakanan) return res.status(400).json({ error: 'Nama makanan tidak boleh kosong!' });

    try {
        const prompt = `Kamu chef profesional. Buatkan resep sehat untuk "${namaMakanan}" sesuaikan dengan data gizi ini: ${deskripsiGizi || '-'}. Balas HANYA dalam format JSON valid: {"nama_resep":"...","waktu_masak":"...","tingkat_kesulitan":"...","porsi":"...","bahan":["..."],"langkah":["..."],"tips_sehat":"..."}`;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] })
        });

        const groqData = await groqResponse.json();
        const teksResep = groqData.choices[0].message.content.trim();
        const bersih = teksResep.replace(/```json|```/g, '').trim();
        res.json({ sukses: true, resep: JSON.parse(bersih) });
    } catch (error) {
        res.status(500).json({ error: `Gagal generate resep: ${error.message}` });
    }
});

// 👇 PORT DINAMIS: Wajib untuk Render.com
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 SERVER RENDER SIAP TEMPUR DI PORT ${PORT}!`);
});