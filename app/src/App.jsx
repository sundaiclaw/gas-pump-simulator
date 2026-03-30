import { useEffect, useMemo, useState } from 'react';
import './styles.css';

const FUEL_GRADES = [
  { id: 'regular', label: 'Regular', price: 3.49, color: '#5dd39e' },
  { id: 'plus', label: 'Plus', price: 4.09, color: '#ffd166' },
  { id: 'premium', label: 'Premium', price: 4.69, color: '#ff6b6b' },
];

const CUSTOMER_NAMES = ['Maya', 'Jules', 'Nico', 'Priya', 'Dante', 'Rin', 'Theo', 'Ava'];
const CAR_TYPES = ['sedan', 'truck', 'van', 'sports coupe', 'tiny hatchback', 'SUV'];
const MOODS = ['late for work', 'running on fumes', 'dramatically impatient', 'way too chill', 'watching the meter like a hawk'];

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeCustomer(round) {
  const grade = randomChoice(FUEL_GRADES);
  const targetGallons = Number((6 + Math.random() * 12).toFixed(1));
  const patience = Math.max(18, 34 - round * 1.5);
  return {
    id: crypto.randomUUID(),
    name: randomChoice(CUSTOMER_NAMES),
    car: randomChoice(CAR_TYPES),
    mood: randomChoice(MOODS),
    grade: grade.id,
    targetGallons,
    patience,
  };
}

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

export default function App() {
  const [phase, setPhase] = useState('idle');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [chaos, setChaos] = useState(0);
  const [combo, setCombo] = useState(0);
  const [pumpRate, setPumpRate] = useState(0.28);
  const [selectedGrade, setSelectedGrade] = useState('regular');
  const [queue, setQueue] = useState(() => [makeCustomer(1), makeCustomer(1), makeCustomer(1)]);
  const [currentGallons, setCurrentGallons] = useState(0);
  const [timeLeft, setTimeLeft] = useState(queue[0].patience);
  const [isPumping, setIsPumping] = useState(false);
  const [eventText, setEventText] = useState('Open the lane and keep the station from descending into total chaos.');
  const [shiftSeconds, setShiftSeconds] = useState(75);

  const currentCustomer = queue[0];
  const currentGrade = useMemo(
    () => FUEL_GRADES.find((grade) => grade.id === selectedGrade) ?? FUEL_GRADES[0],
    [selectedGrade],
  );

  useEffect(() => {
    if (!currentCustomer) return;
    setSelectedGrade(currentCustomer.grade);
    setCurrentGallons(0);
    setTimeLeft(currentCustomer.patience);
    setIsPumping(false);
    setEventText(`${currentCustomer.name} rolled up in a ${currentCustomer.car}, ${currentCustomer.mood}. They want ${currentCustomer.targetGallons} gallons of ${currentCustomer.grade}.`);
  }, [currentCustomer?.id]);

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const timer = setInterval(() => {
      setShiftSeconds((prev) => {
        if (prev <= 1) {
          setPhase('gameover');
          setIsPumping(false);
          return 0;
        }
        return prev - 1;
      });
      setTimeLeft((prev) => {
        if (!currentCustomer) return prev;
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          failCustomer('Customer rage-quit and peeled away from the pump.');
          return currentCustomer.patience;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, currentCustomer?.id]);

  useEffect(() => {
    if (phase !== 'running' || !isPumping || !currentCustomer) return undefined;
    const tick = setInterval(() => {
      setCurrentGallons((prev) => {
        const next = Number((prev + pumpRate).toFixed(2));
        if (next > currentCustomer.targetGallons + 0.55) {
          failCustomer('You overfilled the tank and triggered a full forecourt meltdown.');
          return 0;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(tick);
  }, [phase, isPumping, pumpRate, currentCustomer?.id]);

  function failCustomer(message) {
    setChaos((prev) => {
      const next = Math.min(100, prev + 18);
      if (next >= 100) {
        setPhase('gameover');
        setEventText('The station is in unrecoverable chaos. Shift over.');
      }
      return next;
    });
    setCombo(0);
    setScore((prev) => Math.max(0, prev - 60));
    setEventText(message);
    advanceQueue();
  }

  function advanceQueue(success = false, payout = 0) {
    setQueue((prev) => {
      const [, ...rest] = prev;
      const nextRound = round + (success ? 1 : 0);
      const nextCustomer = makeCustomer(nextRound);
      return [...rest, nextCustomer];
    });
    if (success) {
      setRound((prev) => prev + 1);
      setRevenue((prev) => prev + payout);
    }
  }

  function startShift() {
    setPhase('running');
    setScore(0);
    setRevenue(0);
    setChaos(0);
    setCombo(0);
    setRound(1);
    const freshQueue = [makeCustomer(1), makeCustomer(1), makeCustomer(1)];
    setQueue(freshQueue);
    setShiftSeconds(75);
    setCurrentGallons(0);
    setSelectedGrade(freshQueue[0].grade);
    setTimeLeft(freshQueue[0].patience);
    setEventText('Shift started. First customer is rolling in now.');
  }

  function submitPump() {
    if (!currentCustomer) return;
    const error = Math.abs(currentGallons - currentCustomer.targetGallons);
    if (selectedGrade !== currentCustomer.grade) {
      failCustomer('Wrong fuel grade. The customer is furious.');
      return;
    }
    if (error > 0.35) {
      failCustomer(`Missed the target by ${error.toFixed(2)} gallons. The line is getting ugly.`);
      return;
    }
    const quality = Math.max(0, 100 - Math.round(error * 100) - Math.round((currentCustomer.patience - timeLeft) * 1.5));
    const payout = Number((currentCustomer.targetGallons * currentGrade.price).toFixed(2));
    setCombo((prev) => prev + 1);
    setScore((prev) => prev + quality + combo * 5);
    setEventText(`Perfect stop. ${currentCustomer.name} paid ${formatMoney(payout)} and peeled away happy.`);
    advanceQueue(true, payout);
  }

  const moodPercent = currentCustomer ? Math.max(0, Math.round((timeLeft / currentCustomer.patience) * 100)) : 0;

  return (
    <div className="shell">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Gas station panic simulator</p>
          <h1>Gas Pump Simulator</h1>
          <p className="subcopy">
            Run a single cursed gas lane. Hit customer fuel targets, pick the right grade, and stop pumping before the whole station turns into a screaming disaster.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary" onClick={startShift}>{phase === 'running' ? 'Restart Shift' : 'Start Shift'}</button>
          <div className="stat-pill">Shift clock: {shiftSeconds}s</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel stats-panel">
          <div className="stat-row"><span>Score</span><strong>{score}</strong></div>
          <div className="stat-row"><span>Revenue</span><strong>{formatMoney(revenue)}</strong></div>
          <div className="stat-row"><span>Combo</span><strong>x{combo}</strong></div>
          <div className="stat-row"><span>Chaos</span><strong>{chaos}%</strong></div>
          <div className="chaos-bar"><div style={{ width: `${chaos}%` }} /></div>
        </section>

        <section className="panel customer-panel">
          <div className="panel-header">
            <h2>Current customer</h2>
            <span className="badge">Round {round}</span>
          </div>
          {currentCustomer ? (
            <>
              <h3>{currentCustomer.name} in a {currentCustomer.car}</h3>
              <p>{currentCustomer.mood}</p>
              <div className="order-card">
                <div><span>Order</span><strong>{currentCustomer.targetGallons} gal</strong></div>
                <div><span>Grade</span><strong>{currentCustomer.grade}</strong></div>
                <div><span>Mood</span><strong>{moodPercent}%</strong></div>
              </div>
              <div className="mood-bar"><div style={{ width: `${moodPercent}%` }} /></div>
            </>
          ) : <p>No customer at the pump.</p>}
        </section>

        <section className="panel controls-panel">
          <div className="panel-header">
            <h2>Pump controls</h2>
            <span className="badge">{currentGallons.toFixed(2)} gal</span>
          </div>
          <div className="grade-grid">
            {FUEL_GRADES.map((grade) => (
              <button
                key={grade.id}
                className={`grade-button ${selectedGrade === grade.id ? 'active' : ''}`}
                onClick={() => setSelectedGrade(grade.id)}
                style={{ '--grade-color': grade.color }}
              >
                <span>{grade.label}</span>
                <strong>{formatMoney(grade.price)}</strong>
              </button>
            ))}
          </div>
          <label className="slider-wrap">
            <span>Pump rate: {pumpRate.toFixed(2)} gal / tick</span>
            <input type="range" min="0.18" max="0.5" step="0.01" value={pumpRate} onChange={(e) => setPumpRate(Number(e.target.value))} />
          </label>
          <div className="pump-actions">
            <button className="primary" disabled={phase !== 'running'} onMouseDown={() => setIsPumping(true)} onMouseUp={() => setIsPumping(false)} onMouseLeave={() => setIsPumping(false)} onTouchStart={() => setIsPumping(true)} onTouchEnd={() => setIsPumping(false)}>
              Hold to pump
            </button>
            <button className="secondary" disabled={phase !== 'running'} onClick={() => setIsPumping(false)}>Stop flow</button>
            <button className="secondary" disabled={phase !== 'running'} onClick={submitPump}>Complete sale</button>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-header">
            <h2>Queue</h2>
            <span className="badge">{queue.length} cars</span>
          </div>
          <div className="queue-list">
            {queue.slice(1).map((customer) => (
              <div className="queue-item" key={customer.id}>
                <strong>{customer.name}</strong>
                <span>{customer.targetGallons} gal · {customer.grade}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel event-panel">
        <div className="panel-header">
          <h2>Forecourt radio</h2>
          <span className={`badge ${phase}`}>{phase}</span>
        </div>
        <p>{eventText}</p>
        {phase === 'gameover' && (
          <p className="gameover-copy">
            Shift over. Final score: <strong>{score}</strong> · Revenue: <strong>{formatMoney(revenue)}</strong>
          </p>
        )}
      </section>
    </div>
  );
}
