import { useEffect, useRef, useState } from 'react';
import type { AnimalId, SaveData, Screen, Visit } from './game/types';
import { ANIMAL_BY_ID } from './game/animals';
import { makeVisit } from './game/levels';
import { loadSave, persistSave } from './lib/storage';
import { setMuted } from './lib/sfx';
import { analytics } from './lib/analytics';
import { Title } from './components/Title';
import { Lobby } from './components/Lobby';
import { Treatment } from './components/Treatment';
import { Celebrate } from './components/Celebrate';
import './styles/app.css';

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>('title');
  const [visit, setVisit] = useState<Visit | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    setMuted(save.muted);
    persistSave(save);
  }, [save]);

  // Usage analytics: log app open once, and a session-length ping on hide.
  useEffect(() => {
    analytics.appOpen();
    const onHide = () => {
      if (document.visibilityState === 'hidden') analytics.sessionEnd();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  function startVisit(id: AnimalId) {
    const treatedBefore = save.treated[id] ?? 0;
    analytics.track('animal_open', id);
    setVisit(makeVisit(id, treatedBefore, save.totalVisits));
    recordedRef.current = false;
    setScreen('treat');
  }

  function completeVisit() {
    if (visit && !recordedRef.current) {
      recordedRef.current = true;
      setSave((s) => ({
        ...s,
        treated: {
          ...s.treated,
          [visit.animal]: (s.treated[visit.animal] ?? 0) + 1,
        },
        totalVisits: s.totalVisits + 1,
      }));
    }
    setScreen('celebrate');
  }

  const toggleMute = () => setSave((s) => ({ ...s, muted: !s.muted }));

  if (screen === 'title') {
    return (
      <Title
        onPlay={() => setScreen('lobby')}
        muted={save.muted}
        onToggleMute={toggleMute}
      />
    );
  }

  if (screen === 'treat' && visit) {
    return (
      <Treatment
        key={`${visit.animal}-${save.totalVisits}`}
        visit={visit}
        spec={ANIMAL_BY_ID[visit.animal]}
        onHome={() => setScreen('lobby')}
        onComplete={completeVisit}
      />
    );
  }

  if (screen === 'celebrate' && visit) {
    return (
      <Celebrate
        spec={ANIMAL_BY_ID[visit.animal]}
        onNext={() => setScreen('lobby')}
      />
    );
  }

  return (
    <Lobby
      save={save}
      onPick={startVisit}
      muted={save.muted}
      onToggleMute={toggleMute}
    />
  );
}
