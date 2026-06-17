app.post('/api/nutrisi', async (req, res) => {
    const { makanan } = req.body; 
    try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: `Berikan data gizi dan resep untuk: ${makanan}. Jawab dalam format JSON persis: {"kalori": "...", "protein": "...", "karbohidrat": "...", "lemak": "...", "resep": "..."}` }],
            temperature: 0.1
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });

        const rawContent = groqResponse.data.choices[0].message.content;
        // Pembersih JSON biar tidak undefined
        const jsonString = rawContent.replace(/```json/g, '').replace(/
```/g, '');
        res.json(JSON.parse(jsonString));
    } catch (error) {
        res.status(500).json({ error: "Mesin AI sedang sibuk." });
    }
});
