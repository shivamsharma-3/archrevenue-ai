"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTasks = exports.generateNotesSummary = exports.regenerateOutreach = exports.dealCoach = exports.generateEmail = exports.scoreLead = void 0;
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
exports.scoreLead = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    await (0, billing_1.checkAndIncrementTokens)(context.auth.uid, 1000);
    const { lead, sellerProfile } = data;
    const groq = getGroqClient();
    const prompt = `
    Analyze the following sales lead and determine their quality based on the Seller Profile.
    
    Lead Info:
    Name: ${lead.fullName}
    Email: ${lead.email || 'N/A'}
    Website: ${lead.website || 'N/A'}
    Company: ${lead.company || 'N/A'}
    Industry: ${lead.industry || 'N/A'}
    Size: ${lead.companySize || 'N/A'}
    Revenue: ${lead.monthlyRevenue || 'N/A'}
    Pain Point: ${lead.painPoint || 'N/A'}
    Current Solution: ${lead.currentSolution || 'N/A'}
    Urgency: ${lead.urgency || 'N/A'}
    Interested Service: ${lead.interestedService || 'N/A'}
    
    Seller Profile:
    ${JSON.stringify(sellerProfile || {})}
    
    Respond ONLY with a JSON object in this format:
    {
      "score": number (0-100),
      "category": "Hot" | "Warm" | "Cold" | "Dead",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "recommendedAction": "string",
      "reason": "string",
      "evidence": {
        "websiteWeight": number,
        "formWeight": number,
        "budgetSignal": "string",
        "maturitySignal": "string",
        "growthSignal": "string",
        "buyingLikelihood": "High" | "Medium" | "Low",
        "limitedConfidence": boolean
      },
      "suggestedFollowUpDays": number
    }
  `;
    const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            { role: 'system', content: 'You are an expert sales analyst. You must only return valid JSON matching the requested schema.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });
    const content = response.choices[0]?.message?.content || '{}';
    return {
        analysis: JSON.parse(content),
        research: null
    };
});
exports.generateEmail = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    await (0, billing_1.checkAndIncrementTokens)(context.auth.uid, 1000);
    const { lead, sellerProfile, customPrompt } = data;
    const groq = getGroqClient();
    const prompt = `
    Generate a personalized sales outreach email for this lead.
    
    Lead Info:
    Name: ${lead.fullName}
    Company: ${lead.company || 'N/A'}
    Pain Point: ${lead.painPoint || 'N/A'}
    Interested Service: ${lead.interestedService || 'N/A'}
    
    Seller Profile:
    ${JSON.stringify(sellerProfile || {})}
    
    Custom Instructions: ${customPrompt || 'None'}
    
    Respond ONLY with a JSON object:
    {
      "subject": "Email Subject Line",
      "body": "Email Body (use HTML paragraphs/breaks if necessary)"
    }
  `;
    const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            { role: 'system', content: 'You are a professional copywriter. Only return valid JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });
    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
});
exports.dealCoach = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    await (0, billing_1.checkAndIncrementTokens)(context.auth.uid, 1000);
    const { lead, sellerProfile } = data;
    const groq = getGroqClient();
    const prompt = `
    Provide deal coaching for the following lead in our sales pipeline.
    
    Lead Info:
    Name: ${lead.fullName}
    Company: ${lead.company || 'N/A'}
    Pain Point: ${lead.painPoint || 'N/A'}
    Current Solution: ${lead.currentSolution || 'N/A'}
    Urgency: ${lead.urgency || 'N/A'}
    
    Seller Profile:
    ${JSON.stringify(sellerProfile || {})}
    
    Respond ONLY with a JSON object:
    {
      "blockers": ["blocker1", "blocker2"],
      "talkTrack": "Sales talking points/scripts to handle objections",
      "recommendedActions": ["action1", "action2"]
    }
  `;
    const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            { role: 'system', content: 'You are an elite sales consultant. Only return valid JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });
    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
});
exports.regenerateOutreach = functions.https.onCall(async (data, context) => {
    // Directly forward to generateEmail
    return exports.generateEmail.run(data, context);
});
exports.generateNotesSummary = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    await (0, billing_1.checkAndIncrementTokens)(context.auth.uid, 500);
    const { notes } = data;
    const groq = getGroqClient();
    const notesText = notes.map((n) => `[${n.type || 'Note'}] ${n.content}`).join('\n');
    const prompt = `
    Summarize these sales notes:
    ${notesText}
    
    Provide a concise summary of the key findings, customer needs, and next steps.
  `;
    const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            { role: 'system', content: 'You are a sales operations analyst.' },
            { role: 'user', content: prompt }
        ]
    });
    return response.choices[0]?.message?.content || '';
});
exports.generateTasks = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    await (0, billing_1.checkAndIncrementTokens)(context.auth.uid, 500);
    const { lead, sellerProfile } = data;
    const groq = getGroqClient();
    const prompt = `
    Generate a checklist of action items/tasks to move this deal forward.
    
    Lead Info:
    Name: ${lead.fullName}
    Company: ${lead.company || 'N/A'}
    Pain Point: ${lead.painPoint || 'N/A'}
    
    Seller Profile:
    ${JSON.stringify(sellerProfile || {})}
    
    Respond ONLY with a JSON object containing an array:
    {
      "tasks": [
        { "title": "Task 1 description" },
        { "title": "Task 2 description" }
      ]
    }
  `;
    const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            { role: 'system', content: 'You are a sales operations analyst. Only return valid JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });
    const content = response.choices[0]?.message?.content || '{"tasks":[]}';
    const result = JSON.parse(content);
    return (result.tasks || []).map((t, idx) => ({
        id: `ai-task-${idx}-${Date.now()}`,
        title: t.title,
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'ai'
    }));
});
//# sourceMappingURL=ai.js.map