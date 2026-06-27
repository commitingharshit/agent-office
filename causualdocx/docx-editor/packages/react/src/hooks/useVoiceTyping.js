/**
 * Voice typing — Web Speech API wrapper.
 *
 * Wraps `webkitSpeechRecognition` / `SpeechRecognition` into a React
 * hook with a tight surface: `start()`, `stop()`, `isListening`,
 * `supported`. The host (DocxEditor) wires `onFinalText` to insert
 * the recognized text into the editor at the cursor.
 *
 * Browser support: Chrome / Edge / Brave (full), Safari iOS (partial),
 * Firefox (no). On unsupported browsers `supported` is false and the
 * UI can hide / disable the menu entry. We don't fall back to a
 * server-side recognizer — that would need a paid API, and voice
 * typing is a nice-to-have not a critical feature.
 *
 * Recognition mode: continuous + interimResults so the user sees
 * words as they speak. Only `final` results are emitted via
 * `onFinalText` (interim text is mirrored via `interimText` for the
 * indicator UI). Recognition restarts itself on the `end` event
 * while `isListening` is true so the user can pause mid-sentence
 * without the session dying.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
function getRecognitionConstructor() {
    var _a, _b;
    if (typeof window === 'undefined')
        return null;
    const w = window;
    return (_b = (_a = w.SpeechRecognition) !== null && _a !== void 0 ? _a : w.webkitSpeechRecognition) !== null && _b !== void 0 ? _b : null;
}
export function useVoiceTyping(options = {}) {
    const { onFinalText, lang } = options;
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [error, setError] = useState(null);
    const supported = getRecognitionConstructor() !== null;
    const recognitionRef = useRef(null);
    // Track the latest onFinalText so the recognition handler (set up
    // once when start() is called) always calls the current handler
    // — not the one captured at session start.
    const onFinalTextRef = useRef(onFinalText);
    useEffect(() => {
        onFinalTextRef.current = onFinalText;
    }, [onFinalText]);
    // Mirror isListening so the `end` auto-restart can decide whether
    // the user actually wanted to stop (vs. the engine ending its
    // current chunk).
    const wantsToListenRef = useRef(false);
    const stop = useCallback(() => {
        wantsToListenRef.current = false;
        const rec = recognitionRef.current;
        if (rec) {
            try {
                rec.stop();
            }
            catch (_a) {
                // Already stopped — fine.
            }
        }
        setIsListening(false);
        setInterimText('');
    }, []);
    const start = useCallback(() => {
        const Ctor = getRecognitionConstructor();
        if (!Ctor)
            return;
        if (recognitionRef.current)
            return; // already running
        setError(null);
        const rec = new Ctor();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = lang !== null && lang !== void 0 ? lang : (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
        rec.onstart = () => {
            wantsToListenRef.current = true;
            setIsListening(true);
        };
        rec.onend = () => {
            setIsListening(false);
            setInterimText('');
            // If the user hasn't asked to stop, restart — Web Speech
            // recognition naturally ends after silence; users expect a
            // continuous dictation session until they hit Stop.
            const wants = wantsToListenRef.current;
            recognitionRef.current = null;
            if (wants) {
                try {
                    start();
                }
                catch (_a) {
                    // Some browsers throw if start() is called too quickly
                    // after end. Best-effort.
                }
            }
        };
        rec.onresult = (e) => {
            var _a;
            let interim = '';
            let finalChunk = '';
            for (let i = 0; i < e.results.length; i++) {
                const r = e.results[i];
                if (r.isFinal)
                    finalChunk += r[0].transcript;
                else
                    interim += r[0].transcript;
            }
            if (finalChunk)
                (_a = onFinalTextRef.current) === null || _a === void 0 ? void 0 : _a.call(onFinalTextRef, finalChunk);
            setInterimText(interim);
        };
        rec.onerror = (e) => {
            var _a;
            setError((_a = e.error) !== null && _a !== void 0 ? _a : 'unknown');
            // Permission denied / network errors are terminal; don't auto-
            // restart, drop wantsToListen so onend doesn't loop.
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                wantsToListenRef.current = false;
            }
        };
        recognitionRef.current = rec;
        try {
            rec.start();
        }
        catch (_a) {
            recognitionRef.current = null;
            setError('start-failed');
        }
    }, [lang]);
    const toggle = useCallback(() => {
        if (isListening)
            stop();
        else
            start();
    }, [isListening, start, stop]);
    // Stop on unmount so the mic doesn't keep listening after the
    // editor unmounts (e.g. SPA navigation away from the doc).
    useEffect(() => {
        return () => {
            wantsToListenRef.current = false;
            const rec = recognitionRef.current;
            if (rec) {
                try {
                    rec.abort();
                }
                catch (_a) {
                    // ignore
                }
            }
        };
    }, []);
    return { supported, isListening, interimText, error, start, stop, toggle };
}
//# sourceMappingURL=useVoiceTyping.js.map