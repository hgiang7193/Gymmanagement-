class NutritionChatUseCase {
  constructor({ healthProfileRepository, weightLogRepository }) {
    this.healthProfileRepository = healthProfileRepository;
    this.weightLogRepository = weightLogRepository;
  }

  async execute({ userId, message, history = [] }) {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('AI_NOT_CONFIGURED');
    }

    const [profile, weightLogs] = await Promise.all([
      this.healthProfileRepository.findByUserId(userId),
      this.weightLogRepository.listByUserId(userId, 5),
    ]);

    const systemPrompt = buildSystemPrompt(profile, weightLogs);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-12),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'AI_SERVICE_UNAVAILABLE');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? '';

    return { reply };
  }
}

function buildSystemPrompt(profile, weightLogs) {
  const lines = [
    'Bạn là trợ lý dinh dưỡng của phòng gym MYFIT. Trả lời bằng tiếng Việt, ngắn gọn, thực tế và thân thiện.',
    'Chỉ tư vấn về dinh dưỡng, chế độ ăn, calo, protein, lịch ăn quanh buổi tập — từ chối các chủ đề không liên quan.',
    'Không thay thế bác sĩ, không kê đơn thuốc.',
  ];

  if (profile) {
    if (profile.heightCm)   lines.push(`Chiều cao hội viên: ${profile.heightCm} cm`);
    if (profile.weightKg)   lines.push(`Cân nặng hiện tại: ${profile.weightKg} kg`);
    if (profile.goalType)   lines.push(`Mục tiêu tập luyện: ${profile.goalType}`);
    if (profile.activityLevel) lines.push(`Mức độ hoạt động: ${profile.activityLevel}`);
  }

  if (weightLogs && weightLogs.length > 0) {
    const recent = weightLogs[0];
    lines.push(`Cân nặng đo gần nhất: ${recent.weightKg} kg (${recent.loggedAt?.toISOString?.()?.slice(0, 10) ?? ''})`);
  }

  return lines.join('\n');
}

module.exports = { NutritionChatUseCase };
