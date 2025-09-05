import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './style.css';
import { format, isWithinInterval, parseISO } from 'date-fns';
import {
    onAuthStateChanged,
    signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    where
} from 'firebase/firestore';
import Login from "./Login";

// Типы событий
type EventType = "trip" | "concert" | "hiking" | "other";
const eventTypes: { value: EventType; label: string }[] = [
    { value: "trip", label: "Поездка ✈️" },
    { value: "concert", label: "Концерт 🎵" },
    { value: "hiking", label: "Хайкинг 🥾" },
    { value: "other", label: "Другое 📝" },
];

interface EventItem {
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    note: string;
    type: EventType;
    user?: string; // Добавляем поле user
}

export default function App() {
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [form, setForm] = useState<Omit<EventItem, "id">>({
        title: '',
        startDate: '',
        endDate: '',
        note: '',
        type: "trip",
        user: ''
    });

    const [selectedDate, setSelectedDate] = useState<CalendarProps['value']>(new Date());

    // Следим за авторизацией
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Загрузка событий из Firestore
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "events"),
            where("user", "==", user.uid),
            orderBy("startDate")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedEvents: EventItem[] = snapshot.docs.map((doc) => {
                const data = doc.data() as Omit<EventItem, 'id'>;
                return { id: doc.id, ...data };
            });
            setEvents(loadedEvents);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.startDate || !user) return;

        try {
            await addDoc(collection(db, "events"), { ...form, user: user.uid });
            setForm({ title: '', startDate: '', endDate: '', note: '', type: "trip", user: '' });
        } catch (err) {
            console.error("Ошибка добавления события:", err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "events", id));
        } catch (err) {
            console.error("Ошибка удаления события:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const found = events.find(ev => {
                const start = parseISO(ev.startDate);
                const end = ev.endDate ? parseISO(ev.endDate) : start;
                return isWithinInterval(date, { start, end });
            });
            if (found) {
                switch (found.type) {
                    case 'trip': return 'event-trip';
                    case 'concert': return 'event-concert';
                    case 'hiking': return 'event-hiking';
                    case 'other': return 'event-other';
                }
            }
        }
        return '';
    };

    if (!user) {
        return <Login onLogin={() => {}} />;
    }

    return (
        <div className="columns is-gapless" style={{ height: '100vh' }}>
            {/* Календарь */}
            <div className="column is-half" style={{ padding: '1rem', height: '100%' }}>
                <Calendar
                    onChange={(date) => {
                        if (!date) return;
                        setSelectedDate(date);
                    }}
                    value={selectedDate}
                    selectRange={true}
                    tileClassName={tileClassName}
                    className="calendar-fullheight"
                />
            </div>

            {/* Форма и список */}
            <div className="column is-half" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <button onClick={handleLogout} className="button is-danger mb-4">
                    Выйти
                </button>

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

                    <div className="field mb-2">
                        <div className="control">
                            <div className="select is-fullwidth">
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                                >
                                    {eventTypes.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="field">
                        <div className="control">
                            <button className="button is-primary">Добавить</button>
                        </div>
                    </div>
                </form>

                <div className="box events-list" style={{ flex: 1, overflowY: 'auto' }}>
                    <h2 className="title is-5 mb-3">Мероприятия</h2>
                    {events.length === 0 && <p className="has-text-grey">Нет событий</p>}
                    <ul>
                        {events.map(ev => (
                            <li key={ev.id} className="box mb-2">
                                <div className="level">
                                    <div className="level-left">
                                        <div>
                                            <p className="has-text-weight-semibold">
                                                {ev.title} - {eventTypes.find(t => t.value === ev.type)?.label}
                                            </p>
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
    );
}