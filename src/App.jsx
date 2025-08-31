import React, { useEffect, useMemo, useState } from 'react';
import VipSeatingVisualizer from './VipSeatingVisualizer.jsx';
import StudyScheduleTable from './StudyScheduleTable.jsx';

const DEFAULT_ROWS = {
  dp: [
    {
      title: '가장 큰 증가하는 부분 수열',
      date: '2025년 8월 23일',
      revisit: '👀 1주일차 복습!',
      topic: '다이나믹 프로그래밍',
      level: 'L2',
      reviews: ['1일', '3일'],
      link: 'https://www.acmicpc.net/problem/11053',
    },
    {
      title: '연속 부분 수열 합의 개수',
      date: '2025년 8월 23일',
      revisit: '👀 3일차 복습!',
      topic: '다이나믹 프로그래밍',
      level: 'L2',
      reviews: ['1일'],
      link: '#',
    },
    {
      title: '극장 좌석',
      date: '2025년 8월 20일',
      revisit: '',
      topic: '다이나믹 프로그래밍',
      level: 'L2',
      reviews: ['1일', '3일', '1주일'],
      link: 'https://www.acmicpc.net/problem/2302',
    },
    {
      title: '욕심쟁이 판다',
      date: '2025년 8월 18일',
      revisit: '👀 1주일차 복습!',
      topic: '다이나믹 프로그래밍',
      level: 'L3',
      reviews: ['1일'],
      link: 'https://www.acmicpc.net/problem/1937',
    },
  ],
  greedy: [
    {
      title: '회의실 배정',
      date: '2025년 8월 10일',
      revisit: '',
      topic: '그리디',
      level: 'L2',
      reviews: ['1일'],
      link: 'https://www.acmicpc.net/problem/1931',
    },
    {
      title: '동전 0',
      date: '2025년 8월 10일',
      revisit: '',
      topic: '그리디',
      level: 'L1',
      reviews: ['1일', '3일'],
      link: 'https://www.acmicpc.net/problem/11047',
    },
  ],
  graph: [
    {
      title: 'DFS와 BFS',
      date: '2025년 8월 12일',
      revisit: '👀 3일차 복습!',
      topic: '그래프',
      level: 'L1',
      reviews: ['1일', '3일'],
      link: 'https://www.acmicpc.net/problem/1260',
    },
  ],
};

function getTopicLabel(key) {
  if (key === 'greedy') return '그리디';
  if (key === 'graph') return '그래프';
  return '다이나믹 프로그래밍';
}

function useHashRoute(defaultKey = 'dp') {
  const parse = () => {
    const h = (window.location.hash || '').toLowerCase();
    if (h.includes('greedy')) return 'greedy';
    if (h.includes('graph')) return 'graph';
    return 'dp';
  };
  const [route, setRoute] = useState(parse());
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) window.location.hash = `#/` + defaultKey;
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute('dp');
  const topicLabel = getTopicLabel(route);
  const storageKey = `studyRows:${route}`;
  const defaultRows = useMemo(() => DEFAULT_ROWS[route] ?? [], [route]);

  const Tab = ({ id, children }) => {
    const active = route === id;
    return (
      <a
        href={`#/${id}`}
        className={`px-3 py-1.5 rounded-lg border text-sm transition ${
          active
            ? 'bg-indigo-600 text-white border-indigo-500'
            : 'bg-neutral-900 text-neutral-200 border-neutral-700 hover:border-neutral-500'
        }`}
      >
        {children}
      </a>
    );
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 p-6 space-y-8">
      <header className="flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Study UI</h1>
        <nav className="flex gap-2">
          <Tab id="dp">DP</Tab>
          <Tab id="greedy">Greedy</Tab>
          <Tab id="graph">Graph</Tab>
        </nav>
      </header>

      <StudyScheduleTable
        title="Study Schedule"
        topic={topicLabel}
        storageKey={storageKey}
        defaultRows={defaultRows}
      />

      {route === 'dp' && (
        <div className="border-t border-neutral-800 pt-6">
          <VipSeatingVisualizer />
        </div>
      )}
    </div>
  );
}
