import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { words } = req.body;
    if (!words || words.length < 5) {
        return res.status(400).json({ error: 'Need at least 5 words' });
    }

    // Use only Arabic words (ignore translations for prompt)
    const arabicWords = words.map(w => w.arabic).join('، ');
    
    // Arabic prompt (MSA) asking for a short story of 5-10 sentences
    const prompt = `اكتب قصة قصيرة باللغة العربية الفصحى من ٥ إلى ١٠ جمل. استخدم الكلمات التالية فقط: ${arabicWords}. لا تشرح نفسك ولا تزد أي كلمات خارج هذه القائمة. أجب فقط باللغة العربية.`;

    try {
        const response = await hf.textGeneration({
            model: 'bigscience/bloom-560m',
            inputs: prompt,
            parameters: {
                max_new_tokens: 250,
                temperature: 0.8,
                do_sample: true,
                repetition_penalty: 1.1
            }
        });
        let generated = response.generated_text;
        // Remove the prompt from the beginning if present
        if (generated.startsWith(prompt)) {
            generated = generated.substring(prompt.length);
        }
        generated = generated.trim();
        if (generated.length === 0) throw new Error('Empty generation');
        return res.status(200).json({ text: generated });
    } catch (error) {
        console.error(error);
        // Fallback: simple concatenation with a generic sentence
        const fallback = `${arabicWords}. هذه قصة قصيرة تحتوي على الكلمات المطلوبة. شكراً.`;
        return res.status(200).json({ text: fallback });
    }
}
