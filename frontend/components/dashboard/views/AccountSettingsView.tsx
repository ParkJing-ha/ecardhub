import { useAppPreferences } from "@/components/AppPreferencesProvider";
import { SectionHeader } from "../ui";

export function AccountSettingsView() {
  const { language, resolvedTheme, setLanguage, setTheme } = useAppPreferences();

  return (
    <div style={{ maxWidth: 860 }}>
      <SectionHeader title={language === "sw" ? "Mipangilio ya Akaunti" : "Account Settings"} />
      <div
        className="card-base"
        style={{
          padding: 20,
          display: "grid",
          gap: 18,
        }}
      >
        <section>
          <h3 style={{ margin: 0, color: "var(--foreground)", fontSize: 17 }}>
            {language === "sw" ? "Lugha ya mfumo" : "Interface Language"}
          </h3>
          <p
            style={{
              margin: "6px 0 12px",
              color: "var(--muted-foreground)",
              fontSize: 13,
            }}
          >
            {language === "sw"
              ? "Badili lugha bila kupakia ukurasa upya."
              : "Switch language without reloading the page."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {(["en", "sw"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={language === item ? "btn-gold" : "btn-outline"}
                style={{ minHeight: 44, padding: "0 18px", borderRadius: 8 }}
                onClick={() => setLanguage(item)}
              >
                {item === "en" ? "English" : "Kiswahili"}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{ margin: 0, color: "var(--foreground)", fontSize: 17 }}>
            {language === "sw" ? "Mandhari" : "Theme"}
          </h3>
          <p
            style={{
              margin: "6px 0 12px",
              color: "var(--muted-foreground)",
              fontSize: 13,
            }}
          >
            {language === "sw"
              ? "Chagua mwonekano wa mwanga au giza."
              : "Choose light or dark appearance."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {(["light", "dark"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={resolvedTheme === item ? "btn-gold" : "btn-outline"}
                style={{ minHeight: 44, padding: "0 18px", borderRadius: 8 }}
                onClick={() => setTheme(item)}
              >
                {item === "light"
                  ? language === "sw"
                    ? "Mwanga"
                    : "Light"
                  : language === "sw"
                    ? "Giza"
                    : "Dark"}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
