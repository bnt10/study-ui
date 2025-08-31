import React, { useMemo, useState, useEffect } from "react";

// VIP 자세트 문제 (BOJ 2302) 실화키자 컨퍼
// 타입 포기 제거, 실헅 환경 환화 계정

export default function VipSeatingVisualizer() {
  const [n, setN] = useState(9);
  const [vipInput, setVipInput] = useState("4,7");

  const vip = useMemo(() => {
    const parsed = vipInput
      .split(/[ ,\n\t]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => parseInt(x, 10))
      .filter((x) => !Number.isNaN(x) && x >= 1 && x <= n);
    return Array.from(new Set(parsed)).sort((a, b) => a - b);
  }, [vipInput, n]);

  const segments = useMemo(() => {
    let prev = 0;
    const segs = [];
    for (const v of vip) {
      segs.push(v - prev - 1);
      prev = v;
    }
    segs.push(n - prev);
    return segs;
  }, [vip, n]);

  const maxLen = useMemo(() => (segments.length ? Math.max(...segments) : 0), [segments]);

  const f = useMemo(() => {
    const arr = new Array(Math.max(2, maxLen + 1)).fill(0);
    arr[0] = 1;
    arr[1] = 1;
    for (let i = 2; i <= maxLen; i++) arr[i] = arr[i - 1] + arr[i - 2];
    return arr;
  }, [maxLen]);

  const [animIndex, setAnimIndex] = useState(0);
  const [animRunning, setAnimRunning] = useState(false);
  const [speed, setSpeed] = useState(600);

  useEffect(() => {
    setAnimIndex(0);
    setAnimRunning(false);
  }, [maxLen]);

  useEffect(() => {
    if (!animRunning) return;
    if (animIndex >= maxLen) return;
    const t = setTimeout(() => setAnimIndex((i) => Math.min(maxLen, i + 1)), speed);
    return () => clearTimeout(t);
  }, [animRunning, animIndex, maxLen, speed]);

  const isExample = useMemo(() => n === 9 && vip.length === 2 && vip[0] === 4 && vip[1] === 7, [n, vip]);

  const answer = useMemo(() => {
    return segments.reduce((acc, L) => acc * f[L], 1);
  }, [segments, f]);

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">BOJ 2302 – 좌석 배치 (VIP) 시각화</h1>
          <a className="text-sm opacity-70 hover:opacity-100 underline" href="https://www.acmicpc.net/problem/2302" target="_blank" rel="noreferrer">
            문제 링크
          </a>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setN(9);
              setVipInput("4,7");
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm"
          >
            예제 입력 1 적용 (N=9, VIP=4,7)
          </button>
          {isExample && (
            <span className="text-sm px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/40">
              예제 출력 1 = <b>12</b> ✓ (현재 입력과 일치)
            </span>
          )}
        </div>

        <section className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="block text-sm opacity-80">좌석 수 N</label>
            <input
              type="number"
              min={1}
              max={60}
              value={n}
              onChange={(e) => setN(Math.max(1, Math.min(60, parseInt(e.target.value || "1", 10))))}
              className="w-full rounded-xl px-3 py-2 bg-neutral-900 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm opacity-80">VIP 좌석 (쉼표/공백 구분, 1-based)</label>
            <input
              type="text"
              value={vipInput}
              onChange={(e) => setVipInput(e.target.value)}
              placeholder="예: 4, 7"
              className="w-full rounded-xl px-3 py-2 bg-neutral-900 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">좌석 & VIP 고정</h2>
          <SeatRow n={n} vip={vip} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">구간 분해</h2>
          <div className="text-sm opacity-90 flex flex-wrap gap-2">
            {segments.map((L, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-1 bg-neutral-900">
                <span className="text-xs opacity-60">구간 {idx + 1}</span>
                <strong className="text-base">L = {L}</strong>
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">DP 값 f(L)</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAnimRunning((r) => !r)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition ${animRunning ? "bg-red-600/20 border-red-500 text-red-200" : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500"}`}
            >
              {animRunning ? "일시정지" : "애니메이션 시작"}
            </button>
            <button onClick={() => setAnimIndex((i) => Math.min(maxLen, i + 1))} className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 border border-neutral-600 hover:border-neutral-400">
              한 단계 진행
            </button>
            <button
              onClick={() => {
                setAnimIndex(0);
                setAnimRunning(false);
              }}
              className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 border border-neutral-600 hover:border-neutral-400"
            >
              초기화
            </button>
            <label className="text-sm opacity-80 ml-2">속도(ms/step)</label>
            <input type="range" min={200} max={1500} step={50} value={speed} onChange={(e) => setSpeed(parseInt(e.target.value, 10))} className="accent-indigo-500" />
            <span className="text-sm opacity-70 w-10">{speed}</span>
          </div>

          <FibonacciBoardAnimated f={f} maxLen={maxLen} segments={segments} animIndex={animIndex} />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">최종 정답</h2>
          <div className="text-2xl font-bold bg-neutral-900 border border-neutral-700 rounded-2xl px-4 py-3 inline-block">
            정답 = {segments.map((L, i) => `f(${L})${i < segments.length - 1 ? " × " : ""}`).join("")}
            {segments.length > 0 ? ` = ${answer}` : ` = 1`}
          </div>
          {isExample && (
            <div className="text-sm mt-2 px-3 py-2 rounded-xl bg-emerald-600/10 text-emerald-300 border border-emerald-500/30 inline-block">
              검증: N=9, VIP=[4,7] → 구간 L = [{segments.join(", ")}] → f = [{segments.map((L) => f[L]).join(", ")}] → 곱 = {answer} (예제 출력 1과 일치)
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SeatRow({ n, vip }) {
  const isVip = new Set(vip);
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2">
        {Array.from({ length: n }, (_, i) => i + 1).map((idx) => (
          <div
            key={idx}
            className={
              "relative size-10 shrink-0 grid place-items-center rounded-xl border text-sm transition " +
              (isVip.has(idx) ? "bg-red-600/20 border-red-500 text-red-200" : "bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-500")
            }
          >
            {idx}
            {isVip.has(idx) && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full shadow">VIP</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FibonacciBoardAnimated({ f, maxLen, segments, animIndex }) {
  const usedLens = Array.from(new Set(segments.filter((x) => x >= 0)));
  const current = Math.min(animIndex, maxLen);
  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto">
        <div className="flex items-end gap-2">
          {Array.from({ length: maxLen + 1 }, (_, i) => {
            const revealed = i <= current;
            const active = i === current;
            const isUsed = usedLens.includes(i);
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={
                    "min-w-16 h-20 rounded-xl border grid place-items-center px-2 text-sm transition-all duration-300 " +
                    (revealed
                      ? active
                        ? "scale-105 shadow-[0_0_0_2px_rgba(99,102,241,0.4)] bg-neutral-800 border-indigo-500/70"
                        : "bg-neutral-900 border-neutral-700"
                      : "opacity-30 bg-neutral-900 border-neutral-800")
                  }
                  title={revealed ? `f(${i}) = ${f[i]}` : `f(${i})`}
                >
                  <div className={"font-mono " + (active ? "text-indigo-300" : "text-neutral-200")}>f({i})</div>
                  <div className="text-xs opacity-80">{revealed ? f[i] : "?"}</div>
                </div>
                <div className="text-[10px] mt-1 opacity-70">{i >= 2 ? "f(i-1)+f(i-2)" : "base"}</div>
                {isUsed && <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-200">L에 사용</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm">
        {current === 0 && <div>f(0) = <b>1</b> (base)</div>}
        {current === 1 && <div>f(1) = <b>1</b> (base)</div>}
        {current >= 2 && (
          <div>
            f({current}) = f({current - 1}) + f({current - 2}) = {f[current - 1]} + {f[current - 2]} = <b>{f[current]}</b>
          </div>
        )}
      </div>
      <p className="text-xs opacity-70">애니메이션은 f(0)부터 f(max L)까지 순서대로 전이를 보여줍니다. 입력이 바뀌면 자동 초기화됩니다.</p>
    </div>
  );
}
