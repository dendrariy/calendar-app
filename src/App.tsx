import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './style.css';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface EventItem {
    id: number;
    title: string;
    startDate: string; // ISO string
    endDate?: string;  // ISO string
    note: string;
}

export default function App() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [form, setForm] = useState<Omit<EventItem, "id">>({
        title: '',
        startDate: '',
        endDate: '',
        note: ''
    });

    const [selectedDate, setSelectedDate] = useState<CalendarProps['value']>(new Date());

    // Загрузка из localStorage
    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('events');
            if (saved) {
                try {
                    setEvents(JSON.parse(saved) as EventItem[]);
                } catch (e) {
                    console.error('Ошибка парсинга events из localStorage:', e);
                }
            }
        }
    }, []);

    // Сохранение в localStorage
    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('events', JSON.stringify(events));
        }
    }, [events]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.startDate) return;
        setEvents([...events, { ...form, id: Date.now() }]);
        setForm({ title: '', startDate: '', endDate: '', note: '' });
    };

    const handleDelete = (id: number) => {
        setEvents(events.filter(ev => ev.id !== id));
    };

    // Подсветка дней с событиями
    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const found = events.find(ev => {
                const start = parseISO(ev.startDate);
                const end = ev.endDate ? parseISO(ev.endDate) : start;
                return isWithinInterval(date, { start, end });
            });
            if (found) return 'has-background-primary-light';
        }
        return '';
    };

    return (
        <div className="container mt-5">
            <div className="columns">
                {/* Левая часть — календарь */}
                <div className="column is-half">
                    <Calendar
                        onChange={(date) => {
                            if (!date) return;
                            setSelectedDate(date);
                        }}
                        value={selectedDate}
                        selectRange={true}
                        tileClassName={tileClassName}
                    />
                </div>

                {/* Правая часть — форма и список */}
                <div className="column is-half">
                    <form onSubmit={handleSubmit} className="box mb-4">
                        <h2 className="title is-5 mb-3">Добавить событие</h2>

                        <div className="field mb-2">
                            <div className="control">
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Название"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="field mb-2">
                            <div className="control">
                                <label className="label is-small">Дата начала</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={form.startDate}
                                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="field mb-2">
                            <div className="control">
                                <label className="label is-small">Дата окончания (необязательно)</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="field mb-2">
                            <div className="control">
                <textarea
                    className="textarea"
                    placeholder="Заметка"
                    value={form.note || ''}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
                            </div>
                        </div>

                        <div className="field">
                            <div className="control">
                                <button className="button is-primary">Добавить</button>
                            </div>
                        </div>
                    </form>

                    <div className="box events-list">
                        <h2 className="title is-5 mb-3">Мероприятия</h2>
                        {events.length === 0 && <p className="has-text-grey">Нет событий</p>}
                        <ul>
                            {events.map(ev => (
                                <li key={ev.id} className="box mb-2">
                                    <div className="level">
                                        <div className="level-left">
                                            <div>
                                                <p className="has-text-weight-semibold">{ev.title}</p>
                                                <p className="is-size-7 has-text-grey">
                                                    {format(parseISO(ev.startDate), 'dd.MM.yyyy')}
                                                    {ev.endDate ? ` – ${format(parseISO(ev.endDate), 'dd.MM.yyyy')}` : ''}
                                                </p>
                                                {ev.note && <p className="is-italic is-size-7">{ev.note}</p>}
                                            </div>
                                        </div>
                                        <div className="level-right">
                                            <button
                                                onClick={() => handleDelete(ev.id)}
                                                className="button is-small is-danger"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}