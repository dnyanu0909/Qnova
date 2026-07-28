import { Plus, Trash2, Github, Linkedin, Twitter, Instagram } from "lucide-react";
import type { MicroPageForm, MicroPageSocials } from "@/hooks/useMicroPage";
import { fileToResizedDataUrl } from "@/lib/imageResize";

interface Props {
  form: MicroPageForm;
  onUpdate: <K extends keyof MicroPageForm>(key: K, value: MicroPageForm[K]) => void;
  onUpdateSocial: (key: keyof MicroPageSocials, value: string) => void;
  onAddButton: () => void;
  onUpdateButton: (index: number, patch: { label?: string; url?: string }) => void;
  onRemoveButton: (index: number) => void;
}

const inputClass =
  "w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus";

const socialFields: { key: keyof MicroPageSocials; label: string; icon: typeof Github; placeholder: string }[] = [
  { key: "github", label: "GitHub", icon: Github, placeholder: "github.com/username" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "linkedin.com/in/username" },
  { key: "twitter", label: "Twitter / X", icon: Twitter, placeholder: "x.com/username" },
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/username" },
];

export default function MicroCardForm({
  form,
  onUpdate,
  onUpdateSocial,
  onAddButton,
  onUpdateButton,
  onRemoveButton,
}: Props) {
  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToResizedDataUrl(file, 320);
    onUpdate("avatarDataUrl", dataUrl);
  };

  return (
    <div className="glass-card p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Your details</h2>
        <p className="text-sm text-muted-foreground">Everything you add appears instantly in the preview.</p>
      </div>

      <Field label="Full Name">
        <input
          value={form.fullName}
          onChange={(e) => onUpdate("fullName", e.target.value)}
          placeholder="Ada Lovelace"
          className={inputClass}
        />
      </Field>

      <Field label="Profile Picture">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
            {form.avatarDataUrl && (
              <img src={form.avatarDataUrl} alt="Profile preview" className="w-full h-full object-cover" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleAvatar(e.target.files?.[0])}
            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer"
          />
        </div>
      </Field>

      <Field label="Job Title / Headline">
        <input
          value={form.headline}
          onChange={(e) => onUpdate("headline", e.target.value)}
          placeholder="Product Designer at Acme"
          className={inputClass}
        />
      </Field>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={(e) => onUpdate("bio", e.target.value)}
          rows={3}
          placeholder="A short line about what you do."
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onUpdate("phone", e.target.value)}
            placeholder="+1 234 567 8900"
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => onUpdate("email", e.target.value)}
            placeholder="ada@example.com"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Social Links</h3>
        {socialFields.map(({ key, label, icon: Icon, placeholder }) => (
          <Field key={key} label={label}>
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-lg border border-input bg-secondary/50 flex items-center justify-center text-muted-foreground shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <input
                value={form.socials[key]}
                onChange={(e) => onUpdateSocial(key, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          </Field>
        ))}
      </div>

      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Custom Action Buttons</h3>
          <button
            onClick={onAddButton}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {form.buttons.length === 0 && (
          <p className="text-sm text-muted-foreground">No buttons yet — add one to link a portfolio, booking page, or shop.</p>
        )}
        {form.buttons.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                value={b.label}
                onChange={(e) => onUpdateButton(i, { label: e.target.value })}
                placeholder="Button label"
                className={inputClass}
              />
              <input
                value={b.url}
                onChange={(e) => onUpdateButton(i, { url: e.target.value })}
                placeholder="https://your-link.com"
                className={inputClass}
              />
            </div>
            <button
              onClick={() => onRemoveButton(i)}
              aria-label="Remove button"
              className="w-10 h-10 rounded-lg border border-input flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <Field label="Accent Colour">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.accent}
              onChange={(e) => onUpdate("accent", e.target.value)}
              className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
            />
            <span className="text-xs text-muted-foreground font-mono">{form.accent}</span>
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}