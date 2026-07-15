import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Top, TextField, Button, Switch, Paragraph, Spacing, Toast } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { useAppProfile } from '@/lib/store/AppStore';
import type { UserProfile, FitnessGoal, FitnessLevel } from '@/lib/types';

const GOALS: FitnessGoal[] = ['체중감량', '근력증가', '자세교정'];
const LEVELS: FitnessLevel[] = ['초급', '중급', '상급'];

const HEIGHT_MIN = 120;
const HEIGHT_MAX = 220;
const WEIGHT_MIN = 30;
const WEIGHT_MAX = 200;

const HEIGHT_ERROR = `키는 ${HEIGHT_MIN}~${HEIGHT_MAX}cm로 입력해주세요`;
const WEIGHT_ERROR = `몸무게는 ${WEIGHT_MIN}~${WEIGHT_MAX}kg로 입력해주세요`;

export default function Profile() {
  const navigate = useNavigate();
  const { status, profile, save } = useAppProfile();
  const isLoading = status === 'loading';

  const [heightStr, setHeightStr] = useState(() => (profile ? String(profile.heightCm) : ''));
  const [weightStr, setWeightStr] = useState(() => (profile ? String(profile.weightKg) : ''));
  const [goal, setGoal] = useState<FitnessGoal>(profile?.goal ?? '체중감량');
  const [level, setLevel] = useState<FitnessLevel>(profile?.level ?? '초급');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(
    profile?.voiceFeedbackEnabled ?? true,
  );

  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [saveErrorToast, setSaveErrorToast] = useState(false);

  async function handleSave() {
    const heightCm = Number(heightStr);
    const weightKg = Number(weightStr);

    const nextHeightError =
      !Number.isFinite(heightCm) || heightCm < HEIGHT_MIN || heightCm > HEIGHT_MAX
        ? HEIGHT_ERROR
        : null;
    const nextWeightError =
      !Number.isFinite(weightKg) || weightKg < WEIGHT_MIN || weightKg > WEIGHT_MAX
        ? WEIGHT_ERROR
        : null;

    setHeightError(nextHeightError);
    setWeightError(nextWeightError);
    if (nextHeightError || nextWeightError) return;

    const now = Date.now();
    const nextProfile: UserProfile = {
      version: 1,
      id: 'me',
      heightCm,
      weightKg,
      goal,
      level,
      voiceFeedbackEnabled,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };

    const result = await save(nextProfile);
    if (result.ok) {
      navigate('/');
    } else {
      setSaveErrorToast(true);
    }
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>프로필</Top.TitleParagraph>} />}>
      <Card>
        <Paragraph.Text typography="t5">신체 정보</Paragraph.Text>
        <Spacing size={12} />
        <TextField
          variant="box"
          label="키"
          placeholder="키를 입력해주세요 (120~220cm)"
          inputMode="numeric"
          value={heightStr}
          onChange={(e) => {
            setHeightStr(e.target.value);
            setHeightError(null);
          }}
          disabled={isLoading}
          hasError={!!heightError}
          help={heightError ?? undefined}
        />
        <Spacing size={12} />
        <TextField
          variant="box"
          label="몸무게"
          placeholder="몸무게를 입력해주세요 (30~200kg)"
          inputMode="numeric"
          value={weightStr}
          onChange={(e) => {
            setWeightStr(e.target.value);
            setWeightError(null);
          }}
          disabled={isLoading}
          hasError={!!weightError}
          help={weightError ?? undefined}
        />
      </Card>

      <Spacing size={16} />

      <Card>
        <Paragraph.Text typography="t5">목표</Paragraph.Text>
        <Spacing size={8} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GOALS.map((g) => (
            <Button
              key={g}
              variant={goal === g ? 'fill' : 'weak'}
              size="small"
              onClick={() => setGoal(g)}
            >
              {g}
            </Button>
          ))}
        </div>
        <Spacing size={16} />
        <Paragraph.Text typography="t5">난이도</Paragraph.Text>
        <Spacing size={8} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LEVELS.map((l) => (
            <Button
              key={l}
              variant={level === l ? 'fill' : 'weak'}
              size="small"
              onClick={() => setLevel(l)}
            >
              {l}
            </Button>
          ))}
        </div>
      </Card>

      <Spacing size={16} />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Paragraph.Text typography="t5">음성 피드백</Paragraph.Text>
          <Switch
            checked={voiceFeedbackEnabled}
            onChange={(e) => setVoiceFeedbackEnabled(e.target.checked)}
          />
        </div>
      </Card>

      <Spacing size={24} />

      <Button variant="fill" display="block" onClick={handleSave} disabled={isLoading}>
        저장
      </Button>

      <Spacing size={24} />

      <Toast
        open={saveErrorToast}
        text="저장에 실패했어요. 다시 시도해주세요"
        position="bottom"
        onClose={() => setSaveErrorToast(false)}
      />
    </ScreenScaffold>
  );
}
