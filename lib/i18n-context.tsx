"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/dictionaries/en.json";
import it from "@/dictionaries/it.json";

type Dictionary = typeof en;
type Language = "en" | "it";

const dictionaries: Record<Language, Dictionary> = {
    en,
    it,
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dictionary: Dictionary;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [mounted, setMounted] = useState(false);

    // Load language from local storage on mount
    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const savedLang = localStorage.getItem("language") as Language;
            if (savedLang && (savedLang === "en" || savedLang === "it")) {
                setLanguage(savedLang);
            }
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        if (typeof window !== "undefined") {
            localStorage.setItem("language", lang);
        }
    };

    const t = (path: string) => {
        const keys = path.split(".");
        let current: any = dictionaries[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path}`);
                return path;
            }
            current = current[key];
        }

        return current as string;
    };

    return (
        <I18nContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                t,
                dictionary: dictionaries[language],
            }}
        >
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}
