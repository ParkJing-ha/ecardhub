import { useEffect, useState } from "react";
import type { ApiEvent, Event, EventCategory, EventType } from "../types";
import { useAppPreferences } from "../../AppPreferencesProvider";
import { useIsMobile } from "../hooks";
import { SectionHeader } from "../ui";
import { categoryEmoji, categoryGradient } from "../category";
import { EVENT_CATEGORIES, allTemplates, type Template } from "@/lib/templates";
import { createCustomTemplate, getTemplates } from "@/lib/data";
import TemplateCard from "@/components/templates/TemplateCard";

const categoryToEventType: Record<EventCategory, EventType> = {
  Wedding: "wedding",
  Graduation: "graduation",
  Birthday: "birthday",
  "Kitchen Party": "kitchen_party",
  Holiday: "holiday",
  Anniversary: "anniversary",
  "Send-off": "send_off",
  "Custom Ceremony": "custom_ceremony",
};

const eventTypeToCategory: Record<EventType, EventCategory> = {
  wedding: "Wedding",
  graduation: "Graduation",
  birthday: "Birthday",
  kitchen_party: "Kitchen Party",
  holiday: "Holiday",
  anniversary: "Anniversary",
  send_off: "Send-off",
  custom_ceremony: "Custom Ceremony",
};

function apiEventToDashboardEvent(
  apiEvent: ApiEvent,
  guestCount: number,
): Event {
  return {
    id: String(apiEvent.id),
    title: apiEvent.title,
    category: eventTypeToCategory[apiEvent.event_type],
    date: apiEvent.event_date,
    venue: apiEvent.venue,
    status:
      apiEvent.status === "active"
        ? "Active"
        : apiEvent.status === "completed"
          ? "Completed"
          : "Draft",
    guestCount,
    sentCount: 0,
    rsvpCount: 0,
  };
}

const initialForm = {
  title: "",
  hostFamilyName: "",
  date: "",
  eventTime: "",
  venue: "",
  guestCount: "",
  rsvpDeadline: "",
  rsvpReplyPhone: "",
  cardMessage: "",
  dressCodeColors: ["#FF5733", "#1E3A8A", "#F5E6CC"],
  description: "",
};

const createEventDraftKey = "ecardhub:create-event-draft";
const createEventCategories = EVENT_CATEGORIES.filter(
  (item): item is EventCategory => item !== "All",
);

interface CreateEventDraft {
  step: number;
  category: EventCategory | null;
  template: string | null;
  form: typeof initialForm;
}

function readCreateEventDraft(): CreateEventDraft {
  if (typeof window === "undefined") {
    return {
      step: 1,
      category: null,
      template: null,
      form: initialForm,
    };
  }

  try {
    const rawDraft = window.localStorage.getItem(createEventDraftKey);

    if (!rawDraft) {
      return {
        step: 1,
        category: null,
        template: null,
        form: initialForm,
      };
    }

    const draft = JSON.parse(rawDraft) as Partial<CreateEventDraft>;
    const savedCategory =
      draft.category && createEventCategories.includes(draft.category)
        ? draft.category
        : null;
    const savedStep =
      typeof draft.step === "number"
        ? Math.min(Math.max(Math.trunc(draft.step), 1), 4)
        : 1;

    return {
      step: savedStep,
      category: savedCategory,
      template: typeof draft.template === "string" ? draft.template : null,
      form: {
        ...initialForm,
        ...(draft.form ?? {}),
        dressCodeColors: Array.isArray(draft.form?.dressCodeColors)
          ? draft.form.dressCodeColors
          : initialForm.dressCodeColors,
      },
    };
  } catch {
    window.localStorage.removeItem(createEventDraftKey);
    return {
      step: 1,
      category: null,
      template: null,
      form: initialForm,
    };
  }
}

export function CreateEventView({
  onCreated,
}: {
  onCreated: (ev: Event) => void;
}) {
  const isMobile = useIsMobile();
  const { language, t } = useAppPreferences();
  const steps = [
    {
      number: 1,
      label: t(language, "wizard", "stepCategory"),
      description: t(language, "wizard", "stepCategoryDesc"),
    },
    {
      number: 2,
      label: t(language, "wizard", "stepDetails"),
      description: t(language, "wizard", "stepDetailsDesc"),
    },
    {
      number: 3,
      label: t(language, "wizard", "stepTemplate"),
      description: t(language, "wizard", "stepTemplateDesc"),
    },
    {
      number: 4,
      label: t(language, "wizard", "stepReview"),
      description: t(language, "wizard", "stepReviewDesc"),
    },
  ];

  const [step, setStep] = useState(1);

  const [category, setCategory] = useState<EventCategory | null>(null);

  const [template, setTemplate] = useState<string | null>(null);
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);

  const [form, setForm] = useState(initialForm);
  const [draftRestored, setDraftRestored] = useState(false);

  const [done, setDone] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState("");

  const templates = allTemplates(dbTemplates);
  const filteredTemplates = category
    ? templates.filter(
        (item) => item.category === category || item.category === "All",
      )
    : templates;
  const rawSelectedTemplate = templates.find((item) => item.id === template);
  const selectedTemplate =
    !category ||
    !rawSelectedTemplate ||
    rawSelectedTemplate.category === category ||
    rawSelectedTemplate.category === "All"
      ? rawSelectedTemplate
      : undefined;

  useEffect(() => {
    queueMicrotask(() => {
      const draft = readCreateEventDraft();

      setStep(draft.step);
      setCategory(draft.category);
      setTemplate(draft.template);
      setForm(draft.form);
      setDraftRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!draftRestored || done) return;

    const hasDraftContent =
      Boolean(category) ||
      Boolean(template) ||
      Object.entries(form).some(([key, value]) => {
        if (key === "dressCodeColors") return false;
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      });

    if (!hasDraftContent) {
      window.localStorage.removeItem(createEventDraftKey);
      return;
    }

    const draft: CreateEventDraft = {
      step,
      category,
      template,
      form,
    };

    window.localStorage.setItem(createEventDraftKey, JSON.stringify(draft));
  }, [category, done, draftRestored, form, step, template]);

  useEffect(() => {
    let mounted = true;

    getTemplates()
      .then((items) => {
        if (mounted) setDbTemplates(items);
      })
      .catch(() => {
        if (mounted) setDbTemplates([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const validateDetails = () => {
    if (!form.title.trim()) {
      setError(t(language, "wizard", "titleRequired"));
      return false;
    }

    if (!form.date) {
      setError(t(language, "wizard", "dateRequired"));
      return false;
    }

    if (!form.venue.trim()) {
      setError(t(language, "wizard", "venueRequired"));
      return false;
    }

    setError("");

    return true;
  };

  const handleCreate = async () => {
    if (!category) {
      setError(t(language, "wizard", "selectCategoryError"));
      setStep(1);
      return;
    }

    if (!validateDetails()) {
      setStep(2);
      return;
    }

    if (!selectedTemplate) {
      setError(t(language, "wizard", "selectTemplateError"));
      setStep(3);
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: form.title.trim(),

          event_type: categoryToEventType[category],

          host_family_name: form.hostFamilyName.trim(),

          event_date: form.date,

          event_time: form.eventTime || null,

          venue: form.venue.trim(),

          rsvp_deadline: form.rsvpDeadline || null,

          rsvp_reply_phone: form.rsvpReplyPhone.trim(),

          card_message: form.cardMessage.trim(),

          dress_code_colors: form.dressCodeColors.filter(Boolean),

          description: form.description.trim(),

          status: "draft",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Unable to create event.");
      }

      if (selectedTemplate) {
        await createCustomTemplate(String(data.id), selectedTemplate);
      }

      const createdEvent = apiEventToDashboardEvent(
        data as ApiEvent,
        Number(form.guestCount) || 0,
      );

      onCreated(createdEvent);

      window.localStorage.removeItem(createEventDraftKey);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the event.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const updateForm = (
    key: keyof typeof initialForm,
    value: string | string[],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  if (done) {
    return (
      <div
        style={{
          minHeight: 520,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 0",
        }}
      >
        <div
          className="card-base"
          style={{
            width: "100%",
            maxWidth: 620,
            padding: isMobile ? 28 : 48,
            textAlign: "center",
            border: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: "50%",
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(201,168,76,0.12)",
              border: "1px solid rgba(201,168,76,0.35)",
              fontSize: 38,
            }}
          >
            🎉
          </div>

          <h2
            style={{
              margin: "0 0 12px",
              fontFamily: "DM Serif Display, serif",
              fontSize: isMobile ? 30 : 38,
              color: "var(--foreground)",
            }}
          >
            {t(language, "wizard", "createdTitle")}
          </h2>

          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 430,
              margin: "0 auto 30px",
            }}
          >
            <strong
              style={{
                color: "var(--accent-text)",
              }}
            >
              {form.title}
            </strong>{" "}
            {t(language, "wizard", "savedMessage")}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-outline"
              style={{
                padding: "12px 24px",
                borderRadius: 10,
              }}
              onClick={() => {
                setStep(1);
                setDone(false);
                setCategory(null);
                setTemplate(null);
                setError("");
                setForm(initialForm);
                window.localStorage.removeItem(createEventDraftKey);
              }}
            >
              + {t(language, "wizard", "createAnother")}
            </button>

            <button
              className="btn-gold"
              style={{
                padding: "12px 24px",
                borderRadius: 10,
              }}
              onClick={() => {
                setStep(1);
                setDone(false);
                setCategory(null);
                setTemplate(null);
                setError("");
                setForm(initialForm);
                window.localStorage.removeItem(createEventDraftKey);
              }}
            >
              {t(language, "wizard", "viewEvents")} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        paddingBottom: 30,
      }}
    >
      <SectionHeader title={t(language, "wizard", "createNewEvent")} />

      <div
        style={{
          marginTop: 10,
          marginBottom: 30,
        }}
      >
        <p
          style={{
            color: "var(--muted-foreground)",
            margin: 0,
            fontSize: 14,
          }}
        >
          {t(language, "wizard", "fourSteps")}
        </p>
      </div>

      {/* STEP PROGRESS */}

      <div
        className="card-base"
        style={{
          padding: isMobile ? "18px 12px" : "22px 28px",
          marginBottom: 28,
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            minWidth: isMobile ? 620 : undefined,
          }}
        >
          {steps.map((item, index) => {
            const active = step === item.number;
            const completed = step > item.number;

            return (
              <div
                key={item.number}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: index < steps.length - 1 ? 1 : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background:
                        completed || active
                          ? "var(--accent-text)"
                          : "var(--secondary)",
                      color:
                        completed || active
                          ? "var(--accent-foreground)"
                          : "var(--muted-foreground)",
                      border:
                        active && !completed
                          ? "4px solid rgba(201,168,76,0.2)"
                          : "1px solid var(--border)",
                      boxSizing: "border-box",
                    }}
                  >
                    {completed ? "✓" : item.number}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          active || completed
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      {item.label}
                    </div>

                    {!isMobile && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                          marginTop: 3,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      minWidth: 24,
                      margin: "0 14px",
                      background:
                        step > item.number
                          ? "var(--accent-text)"
                          : "var(--border)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 22,
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(220,38,38,0.10)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* STEP 1 */}

      {step === 1 && (
        <section>
          <StepIntro
            eyebrow="STEP 01"
            title={t(language, "wizard", "celebratingTitle")}
            description={t(language, "wizard", "celebratingDesc")}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {createEventCategories.map((cat) => {
              const selected = category === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setTemplate(null);
                    setError("");
                  }}
                  style={{
                    border: selected
                      ? "1.5px solid var(--accent)"
                      : "1px solid var(--border)",
                    background: selected
                      ? "color-mix(in srgb, var(--accent) 10%, var(--card))"
                      : "var(--card)",
                    borderRadius: 8,
                    padding: isMobile ? "20px 12px" : "24px 16px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    minHeight: 145,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: categoryGradient(cat),
                      fontSize: 26,
                      marginBottom: 18,
                    }}
                  >
                    {categoryEmoji(cat)}
                  </div>

                  <div
                    style={{
                      color: selected ? "var(--accent-text)" : "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {cat}
                  </div>

                  {selected && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        color: "var(--accent-text)",
                      }}
                    >
                      ✓ {t(language, "wizard", "selected")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <ActionBar
            isMobile={isMobile}
            nextLabel={`${t(language, "wizard", "continueDetails")} →`}
            nextDisabled={!category}
            onNext={() => {
              if (!category) {
                setError(t(language, "wizard", "selectCategoryError"));
                return;
              }

              setError("");
              setStep(2);
            }}
          />
        </section>
      )}

      {/* STEP 2 */}

      {step === 2 && (
        <section>
          <StepIntro
            eyebrow="STEP 02"
            title={t(language, "wizard", "eventDetailsTitle")}
            description={t(language, "wizard", "eventDetailsDesc")}
          />

          <div
            className="card-base"
            style={{
              padding: isMobile ? 18 : 30,
            }}
          >
            <FormSection
              title={t(language, "wizard", "eventInformation")}
              description={t(language, "wizard", "eventInformationDesc")}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 18,
                }}
              >
                <Field
                  label={t(language, "wizard", "eventTitle")}
                  required
                  value={form.title}
                  placeholder={`e.g. ${category || "Wedding"} Celebration`}
                  onChange={(value) => updateForm("title", value)}
                />

                <Field
                  label={t(language, "wizard", "hostName")}
                  value={form.hostFamilyName}
                  placeholder="e.g. Emmanuel Family"
                  onChange={(value) => updateForm("hostFamilyName", value)}
                />

                <Field
                  label={t(language, "wizard", "eventDate")}
                  required
                  type="date"
                  value={form.date}
                  onChange={(value) => updateForm("date", value)}
                />

                <Field
                  label={t(language, "wizard", "eventTime")}
                  type="time"
                  value={form.eventTime}
                  onChange={(value) => updateForm("eventTime", value)}
                />

                <Field
                  label={t(language, "wizard", "venue")}
                  required
                  value={form.venue}
                  placeholder="e.g. Hyatt Regency Dar es Salaam"
                  onChange={(value) => updateForm("venue", value)}
                />

                <Field
                  label={t(language, "wizard", "expectedGuests")}
                  type="number"
                  value={form.guestCount}
                  placeholder="e.g. 250"
                  onChange={(value) => updateForm("guestCount", value)}
                />
              </div>
            </FormSection>

            <Divider />

            <FormSection
              title={t(language, "wizard", "rsvpInformation")}
              description={t(language, "wizard", "rsvpInformationDesc")}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 18,
                }}
              >
                <Field
                  label={t(language, "wizard", "rsvpDeadline")}
                  type="date"
                  value={form.rsvpDeadline}
                  onChange={(value) => updateForm("rsvpDeadline", value)}
                />

                <Field
                  label={t(language, "wizard", "rsvpReplyPhone")}
                  type="tel"
                  value={form.rsvpReplyPhone}
                  placeholder="+255 700 000 000"
                  onChange={(value) => updateForm("rsvpReplyPhone", value)}
                />
              </div>
            </FormSection>

            <Divider />

            <FormSection
              title={t(language, "wizard", "invitationContent")}
              description={t(language, "wizard", "invitationContentDesc")}
            >
              <div
                style={{
                  display: "grid",
                  gap: 18,
                }}
              >
                <TextAreaField
                  label={t(language, "wizard", "cardMessage")}
                  value={form.cardMessage}
                  rows={4}
                  placeholder="Write a warm message for your guests..."
                  onChange={(value) => updateForm("cardMessage", value)}
                />

                <TextAreaField
                  label={t(language, "wizard", "eventDescription")}
                  value={form.description}
                  rows={4}
                  placeholder="Tell your guests more about the event..."
                  onChange={(value) => updateForm("description", value)}
                />
              </div>
            </FormSection>

            <Divider />

            <FormSection
              title={t(language, "wizard", "dressCode")}
              description={t(language, "wizard", "dressCodeDesc")}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                {form.dressCodeColors.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => {
                        const colors = [...form.dressCodeColors];

                        colors[index] = event.target.value;

                        updateForm("dressCodeColors", colors);
                      }}
                      style={{
                        width: 38,
                        height: 38,
                        padding: 2,
                        borderRadius: 8,
                        cursor: "pointer",
                        border: "none",
                        background: "transparent",
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                          marginBottom: 2,
                        }}
                      >
                        {t(language, "wizard", "color")} {index + 1}
                      </div>

                      <div
                        style={{
                          color: "var(--foreground)",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {color.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          </div>

          <ActionBar
            isMobile={isMobile}
            backLabel={`← ${t(language, "wizard", "back")}`}
            nextLabel={`${t(language, "wizard", "continueTemplates")} →`}
            onBack={() => {
              setError("");
              setStep(1);
            }}
            onNext={() => {
              if (validateDetails()) {
                setStep(3);
              }
            }}
          />
        </section>
      )}

      {/* STEP 3 */}

      {step === 3 && (
        <section>
          <StepIntro
            eyebrow="STEP 03"
            title={t(language, "wizard", "chooseStyleTitle")}
            description={t(language, "wizard", "chooseStyleDesc")}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {filteredTemplates.length === 0 ? (
              <div
                className="card-base"
                style={{
                  gridColumn: "1 / -1",
                  padding: 24,
                  color: "var(--muted-foreground)",
                  fontSize: 14,
                }}
              >
                {t(language, "wizard", "noTemplates")}
              </div>
            ) : (
              filteredTemplates.map((item) => (
                <TemplateCard
                  key={item.id}
                  template={item}
                  selected={template === item.id}
                  onSelect={(selectedItem) => {
                    setTemplate(selectedItem.id);
                    setError("");
                  }}
                />
              ))
            )}
          </div>

          <ActionBar
            isMobile={isMobile}
            backLabel={`← ${t(language, "wizard", "back")}`}
            nextLabel={`${t(language, "wizard", "reviewEvent")} →`}
            nextDisabled={!selectedTemplate}
            onBack={() => {
              setError("");
              setStep(2);
            }}
            onNext={() => {
              if (!selectedTemplate) {
                setError(t(language, "wizard", "selectTemplateError"));
                return;
              }

              setError("");
              setStep(4);
            }}
          />
        </section>
      )}

      {/* STEP 4 */}

      {step === 4 && (
        <section>
          <StepIntro
            eyebrow="STEP 04"
            title={t(language, "wizard", "reviewTitle")}
            description={t(language, "wizard", "reviewDesc")}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* EVENT SUMMARY */}

            <div
              className="card-base"
              style={{
                padding: isMobile ? 20 : 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  paddingBottom: 22,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      flexShrink: 0,
                      background: categoryGradient(category!),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                    }}
                  >
                    {categoryEmoji(category!)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "var(--accent-text)",
                        textTransform: "uppercase",
                        marginBottom: 5,
                      }}
                    >
                      {t(language, "wizard", "eventSummary")}
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "DM Serif Display, serif",
                        fontSize: isMobile ? 24 : 30,
                        color: "var(--foreground)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {form.title}
                    </h2>

                    <div
                      style={{
                        marginTop: 7,
                        fontSize: 13,
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {category} · {t(language, "wizard", "draftEvent")}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  style={{
                    minHeight: 44,
                    padding: "0 14px",
                    borderRadius: 8,
                    flexShrink: 0,
                    fontSize: 13,
                  }}
                  onClick={() => setStep(2)}
                >
                  {t(language, "wizard", "editDetails")}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12,
                  marginTop: 22,
                }}
              >
                <ReviewItem
                  icon="📅"
                  label={t(language, "wizard", "eventDate")}
                  value={form.date || t(language, "wizard", "notSpecified")}
                />

                <ReviewItem
                  icon="🕒"
                  label={t(language, "wizard", "eventTime")}
                  value={form.eventTime || t(language, "wizard", "notSpecified")}
                />

                <ReviewItem
                  icon="📍"
                  label={t(language, "wizard", "venue")}
                  value={form.venue || t(language, "wizard", "notSpecified")}
                />

                <ReviewItem
                  icon="👥"
                  label={t(language, "wizard", "expectedGuests")}
                  value={form.guestCount || t(language, "wizard", "notSpecified")}
                />

                <ReviewItem
                  icon="👨‍👩‍👧"
                  label={t(language, "wizard", "hostFamily")}
                  value={
                    form.hostFamilyName || t(language, "wizard", "notSpecified")
                  }
                />

                <ReviewItem
                  icon="📱"
                  label={t(language, "wizard", "rsvpReplyPhone")}
                  value={
                    form.rsvpReplyPhone || t(language, "wizard", "notSpecified")
                  }
                />

                <ReviewItem
                  icon="⏳"
                  label={t(language, "wizard", "rsvpDeadline")}
                  value={
                    form.rsvpDeadline || t(language, "wizard", "notSpecified")
                  }
                />

                <ReviewItem
                  icon="🎨"
                  label={t(language, "wizard", "invitationTemplate")}
                  value={
                    selectedTemplate?.name || t(language, "wizard", "notSelected")
                  }
                />
              </div>

              {form.cardMessage && (
                <div
                  style={{
                    marginTop: 22,
                    padding: 16,
                    borderRadius: 12,
                    background: "var(--secondary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted-foreground)",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t(language, "wizard", "cardMessage")}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--foreground)",
                      lineHeight: 1.7,
                    }}
                  >
                    {form.cardMessage}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 22,
                }}
              >
                <div
                  style={{
                  fontSize: 11,
                  color: "var(--muted-foreground)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                  {t(language, "wizard", "dressCodeColors")}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {form.dressCodeColors.map((color) => (
                    <div
                      key={color}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: 20,
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: color,
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      />

                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {color.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TEMPLATE PREVIEW */}

            <div
              className="card-base"
              style={{
                padding: isMobile ? 20 : 28,
                position: isMobile ? "static" : "sticky",
                top: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--accent-text)",
                    textTransform: "uppercase",
                  }}
                >
                  {t(language, "wizard", "selectedDesign")}
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  style={{
                    minHeight: 44,
                    padding: "0 14px",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  onClick={() => setStep(3)}
                >
                  {t(language, "wizard", "editTemplate")}
                </button>
              </div>

              <h3
                style={{
                  margin: "0 0 20px",
                  fontFamily: "DM Serif Display, serif",
                  fontSize: 22,
                  color: "var(--foreground)",
                }}
              >
                {selectedTemplate?.name ||
                  t(language, "wizard", "invitationTemplate")}
              </h3>

              <div
                style={{
                  minHeight: isMobile ? 280 : 380,
                  borderRadius: 18,
                  background: selectedTemplate?.image_data_url
                    ? `${selectedTemplate.background_color} url(${selectedTemplate.image_data_url}) center / cover no-repeat`
                    : selectedTemplate?.background_color || "#17142e",
                  padding: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: 260,
                    minHeight: 300,
                    padding: 24,
                    borderRadius: 10,
                    border: `1px solid ${
                      selectedTemplate?.accent_color || "rgba(255,255,255,0.25)"
                    }`,
                    background: selectedTemplate?.image_data_url
                      ? "rgba(255,255,255,0.72)"
                      : "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(6px)",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      color:
                        selectedTemplate?.text_color ||
                        "rgba(255,255,255,0.65)",
                      opacity: 0.7,
                      textTransform: "uppercase",
                    }}
                  >
                    {t(language, "wizard", "invited")}
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      fontFamily: "DM Serif Display, serif",
                      fontSize: 28,
                      color: selectedTemplate?.primary_color || "var(--accent-text)",
                    }}
                  >
                    {form.title || t(language, "wizard", "yourEvent")}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 13,
                      color:
                        selectedTemplate?.text_color ||
                        "rgba(255,255,255,0.75)",
                      opacity: 0.8,
                    }}
                  >
                    {form.date}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color:
                        selectedTemplate?.text_color ||
                        "rgba(255,255,255,0.65)",
                      opacity: 0.7,
                    }}
                  >
                    {form.venue}
                  </div>

                  <div
                    style={{
                      width: 54,
                      height: 54,
                      margin: "22px auto 0",
                      border: `1px solid ${
                        selectedTemplate?.accent_color ||
                        "rgba(255,255,255,0.35)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      color:
                        selectedTemplate?.accent_color ||
                        "rgba(255,255,255,0.7)",
                    }}
                  >
                    QR
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 10,
                  background: "rgba(201,168,76,0.07)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {t(language, "wizard", "createdAsDraft")}
              </div>
            </div>
          </div>

          <ActionBar
            isMobile={isMobile}
            backLabel={`← ${t(language, "wizard", "back")} ${t(
              language,
              "wizard",
              "stepTemplate",
            )}`}
            nextLabel={
              isCreating
                ? t(language, "wizard", "creatingEvent")
                : t(language, "wizard", "createEventButton")
            }
            nextDisabled={isCreating}
            onBack={() => setStep(3)}
            onNext={handleCreate}
          />
        </section>
      )}
    </div>
  );
}

function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "var(--accent-text)",
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: "DM Serif Display, serif",
          fontSize: 28,
          color: "var(--foreground)",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "8px 0 0",
          color: "var(--muted-foreground)",
          fontSize: 14,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          marginBottom: 18,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            color: "var(--foreground)",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: "5px 0 0",
            fontSize: 12,
            color: "var(--muted-foreground)",
          }}
        >
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--border)",
        margin: "28px 0",
      }}
    />
  );
}

function Field({
  label,
  value,
  placeholder,
  type = "text",
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--foreground)",
          marginBottom: 8,
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color: "var(--accent-text)",
              marginLeft: 4,
            }}
          >
            *
          </span>
        )}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          minHeight: 46,
          padding: "0 14px",
          borderRadius: 10,
          boxSizing: "border-box",
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          outline: "none",
          fontSize: 14,
        }}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--foreground)",
          marginBottom: 8,
        }}
      >
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          padding: "13px 14px",
          borderRadius: 10,
          boxSizing: "border-box",
          resize: "vertical",
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          outline: "none",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}

function ReviewItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "13px 14px",
        borderRadius: 12,
        background: "var(--secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "var(--muted-foreground)",
          fontSize: 11,
          marginBottom: 6,
        }}
      >
        <span>{icon}</span>

        <span>{label}</span>
      </div>

      <div
        style={{
          color: "var(--foreground)",
          fontSize: 13,
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionBar({
  isMobile,
  backLabel,
  nextLabel,
  nextDisabled,
  onBack,
  onNext,
}: {
  isMobile: boolean;
  backLabel?: string;
  nextLabel: string;
  nextDisabled?: boolean;
  onBack?: () => void;
  onNext: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 28,
        flexDirection: isMobile ? "column-reverse" : "row",
      }}
    >
      <div>
        {onBack && (
          <button
            type="button"
            className="btn-outline"
            style={{
              padding: "12px 22px",
              borderRadius: 10,
              width: isMobile ? "100%" : undefined,
            }}
            onClick={onBack}
          >
            {backLabel}
          </button>
        )}
      </div>

      <button
        type="button"
        className="btn-gold"
        disabled={nextDisabled}
        style={{
          padding: "12px 26px",
          borderRadius: 10,
          opacity: nextDisabled ? 0.5 : 1,
          cursor: nextDisabled ? "not-allowed" : "pointer",
          width: isMobile ? "100%" : undefined,
        }}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}
