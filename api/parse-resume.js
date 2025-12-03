import formidable from 'formidable';
import fs from 'fs';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse form data
        const form = formidable({});
        const [fields, files] = await form.parse(req);

        const uploadedFile = files.file?.[0];
        if (!uploadedFile) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Extract text based on file type
        let resumeText;
        const filePath = uploadedFile.filepath;
        const mimeType = uploadedFile.mimetype;

        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse.default(dataBuffer);
            resumeText = data.text;
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ path: filePath });
            resumeText = result.value;
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ error: 'Could not extract enough text from file' });
        }

        // Parse with Claude
        const prompt = `You are an expert at parsing resumes. Extract structured information from this resume text.

RESUME TEXT:
${resumeText}

TASK:
Parse this resume and extract all information into a structured JSON format. Be thorough and extract everything you can find.

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks) in this EXACT structure:
{
  "fullName": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "linkedin": "LinkedIn URL if found",
  "location": "City, State",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty if current",
      "current": false,
      "achievements": [
        "Achievement bullet point 1",
        "Achievement bullet point 2"
      ]
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "graduationYear": "YYYY"
    }
  ],
  "certifications": ["cert1", "cert2"]
}

Extract the information now:`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            return res.status(response.status).json({
                error: 'Claude API error',
                details: errorText
            });
        }

        const data = await response.json();
        const parsedProfile = parseResponse(data.content[0].text);

        return res.status(200).json(parsedProfile);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

function parseResponse(text) {
    try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Failed to parse response:', error);
        throw new Error('Failed to parse AI response');
    }
}