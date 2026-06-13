"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performResearch = void 0;
const functions = require("firebase-functions");
const billing_1 = require("./billing");
const groq_sdk_1 = require("groq-sdk");
const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY || functions.config().groq?.key;
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Groq API Key is not configured in the backend.');
    }
    return new groq_sdk_1.Groq({ apiKey });
};
exports.performResearch = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    await (0, billing_1.checkAndIncrementTokens)(context.auth.uid, 1000);
    const { url } = data;
    const groq = getGroqClient();
    const prompt = `
    Conduct professional market research on this company website URL: ${url}.
    Extract/simulate key insights about their business services, industry vertical, and potential pain points.
    
    Respond ONLY with a JSON object in this format:
    {
      "industry": "string",
      "services": ["service1", "service2"],
      "summary": "string",
      "opportunityScore": number (0-100),
      "painPoints": ["pain1", "pain2"],
      "growthSignals": ["signal1", "signal2"],
      "recommendedPitch": "string",
      "hiringSignals": ["hiring1", "hiring2"],
      "customerSegment": "string",
      "businessMaturity": "Early-stage" | "Growth" | "Mature" | "Enterprise" | "Unknown",
      "confidenceLevel": "High" | "Medium" | "Low",
      "researchSource": "website"
    }
  `;
    const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            { role: 'system', content: 'You are an elite business analyst. Only return valid JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });
    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
});
//# sourceMappingURL=research.js.map