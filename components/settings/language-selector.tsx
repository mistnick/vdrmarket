"use client";

import { useI18n } from "@/lib/i18n-context";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LanguageSelector() {
    const { language, setLanguage, t } = useI18n();

    const handleLanguageChange = (value: string) => {
        setLanguage(value as "en" | "it");
        // Reload page to apply translations throughout the app
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('common.language')}</CardTitle>
                <CardDescription>
                    Select your preferred language for the interface.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={language} onValueChange={handleLanguageChange}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="lang-en" />
                        <Label htmlFor="lang-en" className="cursor-pointer">
                            English
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="it" id="lang-it" />
                        <Label htmlFor="lang-it" className="cursor-pointer">
                            Italiano
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
