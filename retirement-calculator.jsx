import React, { useState, useMemo, useRef, useCallback } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

export default function RetirementCalculator() {
  const [currentIncome, setCurrentIncome] = useState(35000);
  const [retireAge, setRetireAge] = useState(67);
  const [lifeExpectancy, setLifeExpectancy] = useState(94);
  const [contributionPercent, setContributionPercent] = useState(10);
  const [annualRaise, setAnnualRaise] = useState(2.5);

  const currentAge = 30;
  const investmentReturn = 0.05;

  const projectionData = useMemo(() => {
    const data = [];
    let salary = currentIncome;
    let potBalance = 0;

    for (let age = currentAge; age <= lifeExpectancy; age++) {
      if (age < retireAge) {
        const contribution = salary * (contributionPercent / 100);
        potBalance = potBalance * (1 + investmentReturn) + contribution;
        salary = salary * (1 + annualRaise / 100);
      } else {
        const remainingYears = lifeExpectancy - age + 1;
        const withdrawal = potBalance / remainingYears;
        potBalance = (potBalance - withdrawal) * (1 + investmentReturn * 0.5);
      }

      data.push({
        age,
        balance: Math.round(potBalance),
        phase: age < retireAge ? 'saving' : 'retirement'
      });
    }

    return data;
  }, [currentIncome, retireAge, lifeExpectancy, contributionPercent, annualRaise]);

  const balanceAtRetirement = projectionData.find(d => d.age === retireAge)?.balance || 0;
  const monthlyRetirementIncome = Math.round(balanceAtRetirement / ((lifeExpectancy - retireAge) * 12));

  const formatCurrency = (value) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  // Custom draggable slider component
  const DraggableSlider = ({ label, value, setValue, min, max, step, format, unit = '', highlight = false }) => {
    const trackRef = useRef(null);
    const isDraggingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    const percentage = ((value - min) / (max - min)) * 100;

    const updateValue = useCallback((clientX) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const rawValue = min + percent * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      // Round to handle floating point precision
      const finalValue = Math.round(clampedValue * 1000) / 1000;
      setValue(finalValue);
    }, [min, max, step, setValue]);

    const handlePointerDown = useCallback((e) => {
      // Capture pointer for reliable tracking across all devices
      e.target.setPointerCapture(e.pointerId);
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      updateValue(e.clientX);
    }, [updateValue]);

    const handlePointerMove = useCallback((e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      updateValue(e.clientX);
    }, [updateValue]);

    const handlePointerUp = useCallback((e) => {
      if (isDraggingRef.current) {
        e.target.releasePointerCapture(e.pointerId);
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    }, []);

    const handlePointerLeave = useCallback((e) => {
      // Only stop if pointer is released (not captured)
      if (isDraggingRef.current && !e.target.hasPointerCapture(e.pointerId)) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    }, []);

    return (
      <div className={`slider-control ${highlight ? 'highlight' : ''}`}>
        <div className="slider-header">
          <span className="slider-label">{label}</span>
          <span className={`slider-value ${isDragging ? 'dragging' : ''}`}>
            {format ? format(value) : value}{unit}
          </span>
        </div>

        <div
          ref={trackRef}
          className={`slider-track ${isDragging ? 'active' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          style={{ touchAction: 'none' }}
        >
          <div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
          />
          <div
            className={`slider-thumb ${isDragging ? 'dragging' : ''}`}
            style={{ left: `${percentage}%` }}
          />
        </div>

        <div className="slider-range">
          <span>{format ? format(min) : min}{unit}</span>
          <span>{format ? format(max) : max}{unit}</span>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-age">Age {label}</p>
          <p className="tooltip-balance">{formatCurrency(data.balance)}</p>
          <p className="tooltip-phase">{data.phase === 'saving' ? 'Saving' : 'Retirement'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="calculator-container">
      {/* Header */}
      <header className="header">
        <div className="logo-row">
          <div className="logo">S</div>
          <span className="logo-label">FINANCIAL TOOLS</span>
        </div>
        <h1 className="title">Retirement Calculator</h1>
        <p className="subtitle">See how small changes today can transform your retirement</p>
      </header>

      {/* Summary Cards - Mobile first */}
      <div className="summary-cards">
        <div className="card primary">
          <p className="card-label">Pot at retirement</p>
          <p className="card-value">{formatCurrency(balanceAtRetirement)}</p>
        </div>
        <div className="card secondary">
          <p className="card-label">Monthly income</p>
          <p className="card-value purple">£{monthlyRetirementIncome.toLocaleString()}</p>
        </div>
        <div className="card secondary">
          <p className="card-label">Years retired</p>
          <p className="card-value dark">{lifeExpectancy - retireAge}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3 className="chart-title">Your pension pot over time</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="age"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v) => v % 20 === 0 || v === retireAge ? v : ''}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={formatCurrency}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={retireAge}
                stroke="#c4b5fd"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-legend">
          <span className="legend-dot"></span> Dashed line = retirement age
        </p>
      </div>

      {/* Sliders */}
      <div className="controls-panel">
        <h2 className="controls-title">
          <span>⚙️</span> Adjust your inputs
        </h2>

        <DraggableSlider
          label="Annual income"
          value={currentIncome}
          setValue={setCurrentIncome}
          min={15000}
          max={150000}
          step={1000}
          format={(v) => `£${(v/1000).toFixed(0)}K`}
        />

        <DraggableSlider
          label="Retire at age"
          value={retireAge}
          setValue={setRetireAge}
          min={55}
          max={75}
          step={1}
        />

        <DraggableSlider
          label="Life expectancy"
          value={lifeExpectancy}
          setValue={setLifeExpectancy}
          min={70}
          max={100}
          step={1}
        />

        <DraggableSlider
          label="Contribution %"
          value={contributionPercent}
          setValue={setContributionPercent}
          min={1}
          max={30}
          step={0.5}
          unit="%"
        />

        <div className="highlight-box">
          <DraggableSlider
            label="Annual raise ⭐"
            value={annualRaise}
            setValue={setAnnualRaise}
            min={0}
            max={10}
            step={0.1}
            unit="%"
            highlight
          />
          <p className="highlight-text">
            This is the important one! Small increases compound over time.
          </p>
        </div>
      </div>

      {/* Insight */}
      <div className="insight-box">
        <span className="insight-icon">💡</span>
        <div>
          <p className="insight-title">Quick insight</p>
          <p className="insight-text">
            {annualRaise >= 3
              ? `With ${annualRaise}% annual raises, your contributions grow significantly!`
              : annualRaise >= 1.5
              ? `${annualRaise}% raises keep you ahead of inflation. Consider negotiating for more!`
              : `At ${annualRaise}% raises, you may fall behind inflation. Focus on career growth.`
            }
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="footer">
        Simplified illustration. Actual returns may vary. Assumes 5% annual growth.
      </p>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .calculator-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px 16px;
          padding-bottom: 40px;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Header */
        .header {
          margin-bottom: 20px;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .logo {
          width: 32px;
          height: 32px;
          background: #7c3aed;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-label {
          font-size: 10px;
          color: #7c3aed;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .title {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a2e;
          margin: 0 0 6px 0;
          line-height: 1.1;
        }

        .subtitle {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
        }

        /* Summary Cards */
        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .card {
          border-radius: 14px;
          padding: 14px;
        }

        .card.primary {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
          color: white;
          text-align: center;
        }

        .card.secondary {
          background: white;
          border: 2px solid #e9d5ff;
        }

        .card-label {
          margin: 0 0 2px;
          font-size: 11px;
          opacity: 0.8;
        }

        .card.secondary .card-label {
          color: #9ca3af;
        }

        .card-value {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
        }

        .card.primary .card-value {
          font-size: 32px;
        }

        .card-value.purple {
          color: #7c3aed;
        }

        .card-value.dark {
          color: #1a1a2e;
        }

        /* Chart */
        .chart-container {
          background: white;
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 4px 24px rgba(124, 58, 237, 0.08);
        }

        .chart-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 12px 0;
        }

        .chart-wrapper {
          height: 200px;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 8px 0 0;
          font-size: 11px;
          color: #9ca3af;
        }

        .legend-dot {
          width: 16px;
          height: 2px;
          background: #c4b5fd;
          border-radius: 1px;
        }

        .chart-tooltip {
          background: white;
          padding: 10px 14px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .tooltip-age {
          margin: 0;
          font-weight: 600;
          color: #1a1a2e;
          font-size: 13px;
        }

        .tooltip-balance {
          margin: 2px 0 0;
          color: #7c3aed;
          font-weight: 700;
          font-size: 15px;
        }

        .tooltip-phase {
          margin: 2px 0 0;
          font-size: 11px;
          color: #9ca3af;
        }

        /* Controls */
        .controls-panel {
          background: white;
          border-radius: 20px;
          padding: 20px 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 24px rgba(124, 58, 237, 0.08);
        }

        .controls-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Custom Draggable Slider */
        .slider-control {
          margin-bottom: 24px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .slider-label {
          color: #1a1a2e;
          font-weight: 500;
          font-size: 14px;
        }

        .slider-value {
          color: #7c3aed;
          font-weight: 700;
          font-size: 15px;
          background: #f3e8ff;
          padding: 4px 14px;
          border-radius: 20px;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .slider-value.dragging {
          transform: scale(1.05);
          background: #ede9fe;
        }

        .slider-track {
          position: relative;
          height: 12px;
          background: #e9d5ff;
          border-radius: 6px;
          cursor: pointer;
          touch-action: none;
          transition: height 0.15s ease;
        }

        .slider-track.active {
          height: 14px;
        }

        .slider-track:hover {
          height: 14px;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #7c3aed 0%, #9333ea 100%);
          border-radius: 6px;
          pointer-events: none;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          width: 28px;
          height: 28px;
          background: white;
          border: 3px solid #7c3aed;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          cursor: grab;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slider-thumb:hover {
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.45);
        }

        .slider-thumb.dragging {
          cursor: grabbing;
          transform: translate(-50%, -50%) scale(1.15);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
          border-color: #9333ea;
        }

        .slider-range {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 11px;
          color: #9ca3af;
        }

        .highlight-box {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-radius: 14px;
          padding: 14px;
          border: 2px solid #e9d5ff;
          margin-top: 8px;
        }

        .highlight-box .slider-control {
          margin-bottom: 8px;
        }

        .highlight-text {
          font-size: 12px;
          color: #7c3aed;
          margin: 0;
          font-style: italic;
        }

        /* Insight */
        .insight-box {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
        }

        .insight-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .insight-title {
          margin: 0;
          font-weight: 600;
          color: #92400e;
          font-size: 13px;
        }

        .insight-text {
          margin: 4px 0 0;
          color: #a16207;
          font-size: 12px;
          line-height: 1.4;
        }

        /* Footer */
        .footer {
          text-align: center;
          color: #9ca3af;
          font-size: 11px;
          margin: 0;
        }

        /* Tablet & Desktop */
        @media (min-width: 640px) {
          .calculator-container {
            padding: 32px 24px;
          }

          .title {
            font-size: 36px;
          }

          .summary-cards {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .card.primary {
            grid-column: auto;
            text-align: left;
          }

          .card.primary .card-value {
            font-size: 28px;
          }

          .chart-wrapper {
            height: 280px;
          }

          .slider-thumb {
            width: 26px;
            height: 26px;
          }
        }

        @media (min-width: 1024px) {
          .calculator-container {
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .title {
            font-size: 42px;
          }

          .card-value {
            font-size: 28px;
          }

          .card.primary .card-value {
            font-size: 28px;
          }

          .chart-wrapper {
            height: 320px;
          }
        }
      `}</style>
    </div>
  );
}
