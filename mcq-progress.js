/* =========================================================
   KANDEL SARKAR - CLASS 10 MCQ PROGRESS TRACKER
   Saves practice history, weak topics and exam results
   locally on the student's device. No account required.
========================================================= */

(function (global) {
    "use strict";

    var STORAGE_KEY = "ks_mcq_progress_v1";
    var COOKIE_KEY = "ks_mcq_progress";
    var VERSION = 1;
    var MAX_ATTEMPTS = 80;

    var SUBJECTS = {
        science: {
            name: "Science",
            short: "Science",
            href: "science-mcq.html",
            accent: "#58a6ff"
        },
        math: {
            name: "Mathematics",
            short: "Math",
            href: "math-mcq.html",
            accent: "#c084fc"
        },
        computer: {
            name: "Computer Science",
            short: "Computer",
            href: "computer-mcq.html",
            accent: "#57ffb0"
        },
        exam: {
            name: "SEE Mock Exam",
            short: "Mock Exam",
            href: "see-mock-exam.html",
            accent: "#ffb347"
        }
    };

    function clamp(value, min, max) {
        value = Number(value);
        if (!Number.isFinite(value)) return min;
        return Math.min(max, Math.max(min, value));
    }

    function int(value, fallback) {
        value = Math.trunc(Number(value));
        return Number.isFinite(value) ? value : (fallback || 0);
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function emptyData() {
        return {
            version: VERSION,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            attempts: []
        };
    }

    function normalizeTopic(raw, fallbackSubject, fallbackAt) {
        if (!raw) return null;

        var subject = SUBJECTS[raw.subject] ? raw.subject : fallbackSubject;

        if (!SUBJECTS[subject]) subject = "science";

        var questions = Math.max(0, int(raw.questions, 0));
        var correct = Math.min(questions, Math.max(0, int(raw.correct, 0)));

        if (questions === 0) return null;

        return {
            subject: subject,
            topicId: raw.topicId == null ? "" : String(raw.topicId),
            topicName: String(raw.topicName || "General"),
            questions: questions,
            correct: correct,
            accuracy: questions ? correct / questions : 0,
            lastAt: raw.lastAt || fallbackAt || nowIso()
        };
    }

    function normalizeAttempt(raw) {
        if (!raw || !raw.attempts || !Array.isArray(raw.attempts)) {
            return emptyData();
        }

        var data = emptyData();
        data.createdAt = raw.createdAt || data.createdAt;
        data.updatedAt = raw.updatedAt || data.updatedAt;

        data.attempts = raw.attempts
            .filter(function (item) {
                return item && typeof item === "object";
            })
            .map(function (item) {
                var subject = SUBJECTS[item.subject] ? item.subject : "science";
                var total = Math.max(0, int(item.total, 0));
                var correct = Math.min(total, Math.max(0, int(item.correct, 0)));

                return {
                    id: String(item.id || ("a_" + Math.random().toString(36).slice(2))),
                    type: item.type === "exam" ? "exam" : "practice",
                    subject: subject,
                    subjectName: item.subjectName || SUBJECTS[subject].name,
                    title: String(item.title || "Practice session"),
                    unitId: item.unitId == null ? null : String(item.unitId),
                    unitName: item.unitName == null ? "" : String(item.unitName),
                    total: total,
                    correct: correct,
                    accuracy: total ? correct / total : 0,
                    timeSeconds: Math.max(0, int(item.timeSeconds, 0)),
                    at: item.at || nowIso(),
                    topics: Array.isArray(item.topics)
                        ? item.topics.map(function (t) {
                            return normalizeTopic(t, subject, item.at);
                        }).filter(Boolean)
                        : [],
                    missed: Array.isArray(item.missed)
                        ? item.missed.filter(function (m) {
                            return m && m.question;
                        }).slice(0, 100)
                        : [],
                    examBreakdown: item.examBreakdown && typeof item.examBreakdown === "object"
                        ? item.examBreakdown
                        : null
                };
            })
            .sort(function (a, b) {
                return new Date(b.at).getTime() - new Date(a.at).getTime();
            })
            .slice(0, MAX_ATTEMPTS);

        return data;
    }

    function read() {
        try {
            var raw = global.localStorage.getItem(STORAGE_KEY);

            if (!raw) return emptyData();

            return normalizeAttempt(JSON.parse(raw));
        } catch (error) {
            return emptyData();
        }
    }

    function syncCookie(data) {
        try {
            var summary = buildSummary(data);
            var payload = {
                t: summary.totalTests,
                q: summary.totalQuestions,
                a: Math.round(summary.accuracy * 100),
                d: new Date().toISOString().slice(0, 10)
            };

            document.cookie =
                COOKIE_KEY + "=" + encodeURIComponent(JSON.stringify(payload)) +
                "; Max-Age=31536000; Path=/; SameSite=Lax";
        } catch (error) {
            /* Cookies can be blocked. Local storage still works. */
        }
    }

    function write(data) {
        data.updatedAt = nowIso();

        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            /* Storage can be full or blocked. Keep the page usable. */
        }

        syncCookie(data);

        try {
            global.dispatchEvent(new CustomEvent("ks:progress-updated", {
                detail: { data: data }
            }));
        } catch (error) {
            /* Older browsers. */
        }

        return data;
    }

    function buildTopics(answers, fallbackSubject, at) {
        var map = {};

        (answers || []).forEach(function (answer) {
            if (!answer) return;

            var subject = SUBJECTS[answer.subject] ? answer.subject : fallbackSubject;

            if (!SUBJECTS[subject]) subject = "science";

            var topicId = answer.topicId == null ? "" : String(answer.topicId);
            var key = subject + "::" + topicId;

            if (!map[key]) {
                map[key] = {
                    subject: subject,
                    topicId: topicId,
                    topicName: String(answer.topicName || "General"),
                    questions: 0,
                    correct: 0,
                    accuracy: 0,
                    lastAt: at
                };
            }

            map[key].questions += 1;

            if (answer.correct) map[key].correct += 1;
        });

        return Object.keys(map).map(function (key) {
            var topic = map[key];
            topic.accuracy = topic.questions ? topic.correct / topic.questions : 0;
            return topic;
        });
    }

    function recordAttempt(attempt) {
        attempt = attempt || {};

        var data = read();
        var at = nowIso();
        var subject = SUBJECTS[attempt.subject] ? attempt.subject : "science";
        var total = Math.max(0, int(attempt.total, 0));
        var correct = Math.min(total, Math.max(0, int(attempt.correct, 0)));
        var answers = Array.isArray(attempt.answers) ? attempt.answers : [];

        var topics = buildTopics(answers, subject, at);

        var record = {
            id: "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
            type: attempt.type === "exam" ? "exam" : "practice",
            subject: subject,
            subjectName: SUBJECTS[subject].name,
            title: String(attempt.title || (attempt.type === "exam" ? "Full SEE Mock Exam" : "Practice session")),
            unitId: attempt.unitId == null ? null : String(attempt.unitId),
            unitName: attempt.unitName == null ? "" : String(attempt.unitName),
            total: total,
            correct: correct,
            accuracy: total ? correct / total : 0,
            timeSeconds: Math.max(0, int(attempt.timeSeconds, 0)),
            at: at,
            topics: topics,
            missed: Array.isArray(attempt.missed)
                ? attempt.missed.filter(function (item) {
                    return item && item.question;
                }).slice(0, 100)
                : [],
            examBreakdown: attempt.examBreakdown && typeof attempt.examBreakdown === "object"
                ? attempt.examBreakdown
                : null
        };

        data.attempts.unshift(record);
        data.attempts = data.attempts.slice(0, MAX_ATTEMPTS);

        write(data);

        return record;
    }

    function dayKey(date) {
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    }

    function buildSummary(data) {
        data = data || read();

        var attempts = data.attempts || [];
        var totalTests = attempts.length;
        var totalQuestions = 0;
        var totalCorrect = 0;
        var studySeconds = 0;
        var bestAccuracy = 0;

        var subjects = {};

        Object.keys(SUBJECTS).forEach(function (key) {
            subjects[key] = {
                tests: 0,
                questions: 0,
                correct: 0,
                accuracy: 0,
                studySeconds: 0,
                lastAt: null
            };
        });

        attempts.forEach(function (attempt) {
            totalQuestions += attempt.total;
            totalCorrect += attempt.correct;
            studySeconds += attempt.timeSeconds;
            bestAccuracy = Math.max(bestAccuracy, attempt.accuracy);

            var subject = subjects[attempt.subject] || subjects.science;

            subject.tests += 1;
            subject.questions += attempt.total;
            subject.correct += attempt.correct;
            subject.studySeconds += attempt.timeSeconds;
            subject.lastAt = subject.lastAt || attempt.at;
        });

        Object.keys(subjects).forEach(function (key) {
            var subject = subjects[key];
            subject.accuracy = subject.questions
                ? subject.correct / subject.questions
                : 0;
        });

        var days = {};
        attempts.forEach(function (attempt) {
            days[dayKey(new Date(attempt.at))] = true;
        });

        var cursor = new Date();

        if (!days[dayKey(cursor)]) {
            cursor.setDate(cursor.getDate() - 1);
        }

        var streak = 0;

        while (days[dayKey(cursor)]) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return {
            totalTests: totalTests,
            totalQuestions: totalQuestions,
            totalCorrect: totalCorrect,
            accuracy: totalQuestions ? totalCorrect / totalQuestions : 0,
            studySeconds: studySeconds,
            bestAccuracy: bestAccuracy,
            streak: streak,
            subjects: subjects,
            lastAttempt: attempts[0] || null,
            updatedAt: data.updatedAt
        };
    }

    function weakTopics(options) {
        options = options || {};

        var threshold = options.threshold == null ? 0.65 : options.threshold;
        var minQuestions = options.minQuestions == null ? 2 : options.minQuestions;
        var limit = options.limit == null ? 8 : options.limit;
        var data = read();
        var map = {};

        data.attempts.forEach(function (attempt) {
            (attempt.topics || []).forEach(function (topic) {
                var subject = SUBJECTS[topic.subject] ? topic.subject : attempt.subject;
                var key = subject + "::" + topic.topicId;

                if (!map[key]) {
                    map[key] = {
                        subject: subject,
                        subjectName: SUBJECTS[subject].name,
                        topicId: topic.topicId,
                        topicName: topic.topicName,
                        questions: 0,
                        correct: 0,
                        accuracy: 0,
                        lastAt: topic.lastAt || attempt.at
                    };
                }

                map[key].questions += topic.questions;
                map[key].correct += topic.correct;
                map[key].lastAt = topic.lastAt || attempt.at;
            });
        });

        return Object.keys(map)
            .map(function (key) {
                var topic = map[key];
                topic.accuracy = topic.questions ? topic.correct / topic.questions : 0;
                return topic;
            })
            .filter(function (topic) {
                return topic.questions >= minQuestions && topic.accuracy < threshold;
            })
            .sort(function (a, b) {
                if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
                return b.questions - a.questions;
            })
            .slice(0, limit);
    }

    function recent(limit) {
        limit = Math.max(1, int(limit, 6));
        return read().attempts.slice(0, limit);
    }

    function getAttempt(id) {
        return read().attempts.filter(function (attempt) {
            return attempt.id === id;
        })[0] || null;
    }

    function clear() {
        try {
            global.localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            /* Ignore. */
        }

        try {
            document.cookie =
                COOKIE_KEY + "=; Max-Age=0; Path=/; SameSite=Lax";
        } catch (error) {
            /* Ignore. */
        }

        try {
            global.dispatchEvent(new CustomEvent("ks:progress-updated"));
        } catch (error) {
            /* Ignore. */
        }
    }

    function formatTime(seconds) {
        seconds = Math.max(0, int(seconds, 0));

        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;

        if (hours > 0) {
            return hours + "h " + minutes + "m";
        }

        if (minutes > 0) {
            return minutes + "m " + secs + "s";
        }

        return secs + "s";
    }

    function formatDate(iso) {
        try {
            return new Date(iso).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        } catch (error) {
            return String(iso || "");
        }
    }

    function subjectMeta(subject) {
        return SUBJECTS[subject] || SUBJECTS.science;
    }

    function renderAttemptInsights(container, attempt) {
        if (!container || !attempt) return;

        var topics = (attempt.topics || [])
            .slice()
            .sort(function (a, b) {
                return a.accuracy - b.accuracy;
            });

        var weak = topics.filter(function (topic) {
            return topic.questions >= 1 && topic.accuracy < 0.65;
        }).slice(0, 3);

        var strong = topics.filter(function (topic) {
            return topic.questions >= 2 && topic.accuracy >= 0.8;
        }).slice(0, 2);

        var html = "";

        if (weak.length) {
            html +=
                '<div class="insight-heading">🎯 Focus next on</div>' +
                '<div class="insight-chips">' +
                weak.map(function (topic) {
                    var meta = subjectMeta(topic.subject);
                    return (
                        '<a class="insight-chip weak" href="' +
                        escapeHtml(meta.href) +
                        "#unit-" + encodeURIComponent(topic.topicId) +
                        '">' +
                        '<span>' + escapeHtml(topic.topicName) + '</span>' +
                        '<strong>' + Math.round(topic.accuracy * 100) + '%</strong>' +
                        '</a>'
                    );
                }).join("") +
                '</div>';
        } else if (topics.length) {
            html +=
                '<div class="insight-heading good">✅ No weak topic in this test. Keep the streak going.</div>';
        }

        if (strong.length) {
            html +=
                '<div class="insight-sub">Strong areas: ' +
                strong.map(function (topic) {
                    return escapeHtml(topic.topicName);
                }).join(", ") +
                '</div>';
        }

        container.innerHTML = html;
        container.hidden = !html;
    }

    global.MCQTracker = {
        subjects: SUBJECTS,
        getData: read,
        summary: buildSummary,
        recordAttempt: recordAttempt,
        weakTopics: weakTopics,
        recent: recent,
        getAttempt: getAttempt,
        clear: clear,
        formatTime: formatTime,
        formatDate: formatDate,
        subjectMeta: subjectMeta,
        renderAttemptInsights: renderAttemptInsights,
        escapeHtml: escapeHtml
    };

    /* Set the small first-party progress cookie as soon as the tracker loads. */
    try {
        syncCookie(read());
    } catch (error) {
        /* Cookies or storage may be blocked. The site still works. */
    }
})(window);
