import React, { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ko from 'date-fns/locale/ko';
registerLocale('ko', ko);

// utils
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function parseReviewString(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(/[|,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeRows(arr = [], topic) {
  return (arr || []).map((r) => ({
    id: r.id || uid(),
    title: r.title || '제목',
    date: r.date || '',
    revisit: r.revisit || '',
    topic: r.topic ?? topic,
    level: r.level || 'L2',
    reviews: parseReviewString(r.reviews),
    link: r.link || '#',
  }));
}

function formatDateKo(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function parseKoDateString(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    return isNaN(dt) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
}

function csvEscape(s = '') {
  const str = String(s ?? '');
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function toCSV(rows) {
  const header = ['id', 'title', 'date', 'revisit', 'topic', 'level', 'reviews', 'link'];
  const lines = [header.join(',')];
  rows.forEach((r) => {
    const line = [
      r.id,
      r.title,
      r.date,
      r.revisit,
      r.topic,
      r.level,
      (r.reviews || []).join(' '),
      r.link || '',
    ].map(csvEscape);
    lines.push(line.join(','));
  });
  return lines.join('\n');
}

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else cur += ch;
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQ = true;
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const get = (k) => cols[idx[k]] ?? '';
    rows.push({
      id: get('id') || uid(),
      title: get('title'),
      date: get('date'),
      revisit: get('revisit'),
      topic: get('topic'),
      level: get('level'),
      reviews: parseReviewString(get('reviews')),
      link: get('link'),
    });
  }
  return rows;
}

function levelClasses(level) {
  if (level === 'L3') return 'bg-amber-900/40 text-amber-200 border-amber-700/50';
  if (level === 'L2') return 'bg-emerald-900/30 text-emerald-200 border-emerald-700/40';
  return 'bg-neutral-800 text-neutral-200 border-neutral-700';
}

export default function StudyScheduleTable({ title = 'Study Schedule', topic = '다이나믹 프로그래밍', storageKey, defaultRows = [] }) {
  const key = storageKey || `studyRows:${topic}`;

  const [rows, setRows] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeRows(JSON.parse(raw), topic);
    } catch {}
    return normalizeRows(defaultRows, topic);
  });

  // filters
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [q, setQ] = useState('');

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  // csv import
  const fileRef = useRef(null);

  // cell pop editors
  const [openReviewId, setOpenReviewId] = useState(null);
  const [openDateId, setOpenDateId] = useState(null);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch {}
  }, [key, rows]);

  // reload when topic/storageKey changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setRows(raw ? normalizeRows(JSON.parse(raw), topic) : normalizeRows(defaultRows, topic));
    } catch {
      setRows(normalizeRows(defaultRows, topic));
    }
  }, [key, topic]);

  const availableLevels = useMemo(() => {
    const s = new Set(rows.map((r) => r.level).filter(Boolean));
    return ['ALL', ...Array.from(s)];
  }, [rows]);

  const availableReviews = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => (r.reviews || []).forEach((t) => s.add(t)));
    return ['ALL', ...Array.from(s)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okLevel = levelFilter === 'ALL' || r.level === levelFilter;
      const okReview =
        reviewFilter === 'ALL' || (r.reviews || []).some((t) => t === reviewFilter);
      const okSearch =
        ql.length === 0 ||
        (r.title || '').toLowerCase().includes(ql) ||
        (r.revisit || '').toLowerCase().includes(ql) ||
        (r.topic || '').toLowerCase().includes(ql) ||
        (r.level || '').toLowerCase().includes(ql);
      return okLevel && okReview && okSearch;
    });
  }, [rows, levelFilter, reviewFilter, q]);

  const addRow = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    setRows((r) => [
      {
        id: uid(),
        title: '새 문제',
        date: dateStr,
        revisit: '',
        topic,
        level: 'L2',
        reviews: ['1일'],
        link: '#',
      },
      ...r,
    ]);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      ...row,
      reviewsText: Array.isArray(row.reviews) ? row.reviews.join(' ') : String(row.reviews || ''),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    const updated = {
      ...draft,
      reviews: parseReviewString(draft.reviewsText),
    };
    setRows((r) => r.map((it) => (it.id === editingId ? { ...it, ...updated } : it)));
    cancelEdit();
  };

  const removeRow = (id) => {
    setRows((r) => r.filter((it) => it.id !== id));
  };

  const exportCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importCSV = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeRows(parseCSV(String(reader.result || '')), topic);
        // append to top, de-dup by id
        const existing = new Map(rows.map((r) => [r.id, r]));
        const merged = [...parsed, ...rows].filter((r, i, self) => {
          if (existing.has(r.id)) return false;
          existing.set(r.id, r);
          return true;
        });
        setRows(merged);
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert('CSV 파싱 중 오류가 발생했습니다. 형식을 확인해주세요.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const toggleReviewTag = (rowId, tag) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== rowId) return r;
        if (tag === '__clear__') return { ...r, reviews: [] };
        const set = new Set(r.reviews || []);
        if (set.has(tag)) set.delete(tag);
        else set.add(tag);
        return { ...r, reviews: Array.from(set) };
      })
    );
  };

  const handleDateSelect = (rowId, date) => {
    setRows((rs) => rs.map((r) => (r.id === rowId ? { ...r, date: formatDateKo(date) } : r)));
    setOpenDateId(null);
  };

  return (
    <section className="max-w-6xl mx-auto">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700">📚</div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <span className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              ✨ {topic}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm border border-indigo-500/60"
            >
              새로 만들기
            </button>
            <button
              onClick={() => setRows(normalizeRows(defaultRows, topic))}
              className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 border border-neutral-700 hover:border-neutral-500"
              title="샘플 데이터로 초기화"
            >
              초기화
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 mr-2">
            <label className="opacity-80">검색</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="제목/주제/레벨 검색"
              className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="opacity-80">Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
            >
              {availableLevels.map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="opacity-80">복습</label>
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
            >
              {availableReviews.map((rv) => (
                <option key={rv} value={rv}>{rv}</option>
              ))}
            </select>
          </div>
          {(levelFilter !== 'ALL' || reviewFilter !== 'ALL') && (
            <button
              onClick={() => { setLevelFilter('ALL'); setReviewFilter('ALL'); }}
              className="px-2 py-1 rounded-md border border-neutral-700 hover:border-neutral-500 bg-neutral-900"
            >
              필터 초기화
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={exportCSV} className="px-2 py-1 rounded-md border border-neutral-700 hover:border-neutral-500 bg-neutral-900">CSV 내보내기</button>
            <button onClick={() => fileRef.current?.click()} className="px-2 py-1 rounded-md border border-neutral-700 hover:border-neutral-500 bg-neutral-900">CSV 가져오기</button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
            <div className="opacity-70">총 {filteredRows.length} 건</div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible relative">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-300">
                <th className="py-2 pr-3 font-medium">문제</th>
                <th className="py-2 pr-3 font-medium">날짜</th>
                <th className="py-2 pr-3 font-medium">다시 한번</th>
                <th className="py-2 pr-3 font-medium">주제</th>
                <th className="py-2 pr-3 font-medium">Level</th>
                <th className="py-2 pr-3 font-medium">복습</th>
                <th className="py-2 pr-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRows.map((row) => {
                const isEdit = editingId === row.id;
                return (
                  <tr key={row.id} className="hover:bg-neutral-900/60">
                    <td className="py-3 pr-3">
                      {isEdit ? (
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
                        />
                      ) : (
                        <a
                          href={row.link || '#'}
                          target={row.link && row.link !== '#' ? '_blank' : undefined}
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 hover:underline"
                        >
                          <span className="opacity-80">📄</span>
                          <span className="text-neutral-100">{row.title}</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-neutral-300 relative">
                      {isEdit ? (
                        <DatePicker
                          selected={parseKoDateString(draft.date) || new Date()}
                          onChange={(d) => setDraft({ ...draft, date: formatDateKo(d) })}
                          locale="ko"
                          dateFormat="yyyy년 M월 d일"
                          className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
                          calendarClassName="!bg-neutral-900 !text-neutral-100"
                          popperClassName="!z-50"
                          portalId="root"
                        />
                      ) : openDateId === row.id ? (
                        <div className="absolute z-50 top-full left-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg p-2 shadow-2xl">
                          <DatePicker
                            inline
                            selected={parseKoDateString(row.date) || new Date()}
                            onChange={(d) => handleDateSelect(row.id, d)}
                            locale="ko"
                            calendarClassName="!bg-neutral-900 !text-neutral-100"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setOpenDateId(row.id)}
                          className="text-left hover:underline"
                        >
                          {row.date || '날짜 선택'}
                        </button>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {isEdit ? (
                        <input
                          value={draft.revisit}
                          onChange={(e) => setDraft({ ...draft, revisit: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
                        />
                      ) : row.revisit ? (
                        <span>{row.revisit}</span>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {isEdit ? (
                        <input
                          value={draft.topic}
                          onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
                        />
                      ) : (
                        <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">✨ {row.topic}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {isEdit ? (
                        <select
                          value={draft.level}
                          onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                          className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
                        >
                          {['L1', 'L2', 'L3', 'L4'].map((lv) => (
                            <option key={lv} value={lv}>{lv}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-md border ${levelClasses(row.level)}`}>{row.level}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 relative">
                      {isEdit ? (
                        <input
                          value={draft.reviewsText}
                          onChange={(e) => setDraft({ ...draft, reviewsText: e.target.value })}
                          placeholder="예: 1일 3일 1주일"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1"
                        />
                      ) : openReviewId === row.id ? (
                        <div className="absolute z-50 top-full left-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg p-2 shadow-2xl min-w-[220px]">
                          <div className="text-xs opacity-70 mb-2">복습 선택</div>
                          <div className="flex gap-2 mb-3">
                            {['1일', '3일', '1주일'].map((tag) => {
                              const active = (row.reviews || []).includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleReviewTag(row.id, tag)}
                                  className={`px-2 py-1 rounded-md border text-sm ${
                                    active
                                      ? 'bg-purple-700/40 text-purple-200 border-purple-500/50'
                                      : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-500'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleReviewTag(row.id, '__clear__')}
                              className="px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 hover:border-neutral-500"
                            >
                              초기화
                            </button>
                            <button
                              onClick={() => setOpenReviewId(null)}
                              className="px-2 py-1 rounded-md bg-indigo-600 text-white border border-indigo-500/70"
                            >
                              완료
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setOpenReviewId(row.id)} className="block w-full text-left">
                          <div className="flex flex-wrap gap-2">
                            {(row.reviews || []).length > 0 ? (
                              (row.reviews || []).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="opacity-50">선택…</span>
                            )}
                          </div>
                        </button>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {isEdit ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="px-2 py-1 rounded-md bg-emerald-600 text-white border border-emerald-500/70">저장</button>
                          <button onClick={cancelEdit} className="px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700">취소</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(row)} className="px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 hover:border-neutral-500">편집</button>
                          <button onClick={() => removeRow(row.id)} className="px-2 py-1 rounded-md bg-red-600/20 text-red-200 border border-red-500/40 hover:bg-red-600/30">삭제</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
