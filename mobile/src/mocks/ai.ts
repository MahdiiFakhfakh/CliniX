import type { AIChatPayload, AIChatResponse, AssistantTextResponse, DraftAssistantPayload, ExplainResultPayload } from '@/src/core/types/domain';

export function mockExplainResult(payload: ExplainResultPayload): AssistantTextResponse {
  return {
    title: 'AI Result Explanation',
    content:
      `For result ${payload.resultId}: this appears mildly abnormal but not immediately dangerous. ` +
      `Trend, symptoms, and your full history determine next steps. Question received: ${payload.patientQuestion}`,
    caution: 'AI summary only. Confirm interpretation with your treating doctor.',
  };
}

export function mockDraftClinicalText(payload: DraftAssistantPayload): AssistantTextResponse {
  if (payload.kind === 'consultation-note') {
    return {
      title: 'Draft Consultation Note',
      content:
        'Subjective: patient reports gradual symptom improvement. Objective: stable vitals and no acute distress. ' +
        'Assessment: likely controlled chronic condition with intermittent flare. Plan: continue current therapy, ' +
        'reinforce adherence, and schedule follow-up in 1 week. Context: ' + payload.context,
      caution: 'Doctor must verify and edit before signing.',
    };
  }

  return {
    title: 'Draft Prescription Plan',
    content:
      'Medication: choose guideline-aligned first-line therapy. Dose: start low and titrate. Frequency: once daily. ' +
      'Safety: counsel on side effects, interactions, and red flags. Context: ' + payload.context,
    caution: 'Prescribing clinician is fully responsible for final medication order.',
  };
}

export function mockAIChat(payload: AIChatPayload): AIChatResponse {
  const lastMessage = payload.messages[payload.messages.length - 1];
  const prompt = lastMessage?.content ?? '';
  const contextSuffix = payload.patientContext ? ` Patient context: ${payload.patientContext}.` : '';

  if (payload.role === 'doctor') {
    return {
      content:
        'Draft suggestion: summarize key findings, add focused assessment, and include an actionable care plan. ' +
        'For prescriptions, verify dose, frequency, duration, contraindications, and patient counseling points.' +
        contextSuffix +
        (prompt ? ` Request: ${prompt}` : ''),
      caution: 'AI draft support only. Doctor must review and approve all final documentation and orders.',
    };
  }

  return {
    content:
      'I can help explain results in plain language and provide medication-use guidance. ' +
      'I cannot replace your clinician. For urgent symptoms, contact your care team immediately.' +
      (prompt ? ` Question: ${prompt}` : ''),
    caution: 'Informational only. Always confirm medical decisions with your doctor.',
  };
}
